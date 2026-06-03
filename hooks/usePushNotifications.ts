'use client';

import { useState, useCallback, useEffect } from 'react';

interface PushNotificationState {
  isSupported: boolean;
  permission: NotificationPermission | null;
  subscription: PushSubscription | null;
  isSubscribing: boolean;
  error: string | null;
}

/**
 * Converts a base64-encoded VAPID public key to a Uint8Array
 * required by the PushManager.subscribe() options.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Hook for managing push notification subscription lifecycle.
 *
 * Handles:
 * - Feature detection (service worker + PushManager)
 * - Service worker registration
 * - Permission request
 * - Push subscription via VAPID key
 * - Sending the subscription to the server
 */
export function usePushNotifications(shopId?: string) {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: null,
    subscription: null,
    isSubscribing: false,
    error: null,
  });

  // Check support on mount
  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window;

    setState((prev) => ({
      ...prev,
      isSupported: supported,
      permission: supported ? Notification.permission : null,
    }));
  }, []);

  /**
   * Register the service worker and subscribe to push notifications.
   * Sends the subscription object to the backend.
   */
  const subscribe = useCallback(async () => {
    if (!state.isSupported) {
      setState((prev) => ({
        ...prev,
        error: 'Push notifications are not supported in this browser.',
      }));
      return null;
    }

    setState((prev) => ({ ...prev, isSubscribing: true, error: null }));

    try {
      // 1. Register the service worker
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      // Wait until the service worker is active
      await navigator.serviceWorker.ready;

      // 2. Request notification permission
      const permission = await Notification.requestPermission();
      setState((prev) => ({ ...prev, permission }));

      if (permission !== 'granted') {
        setState((prev) => ({
          ...prev,
          isSubscribing: false,
          error: 'Notification permission was denied.',
        }));
        return null;
      }

      // 3. Subscribe to push
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error(
          'VAPID public key is not configured. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY in your environment.'
        );
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey).buffer as ArrayBuffer,
      });

      // 4. Send subscription to server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          shopId: shopId ?? null,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Server rejected push subscription: ${response.status}`
        );
      }

      setState((prev) => ({
        ...prev,
        subscription,
        isSubscribing: false,
      }));

      return subscription;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to subscribe to push.';
      setState((prev) => ({
        ...prev,
        isSubscribing: false,
        error: message,
      }));
      return null;
    }
  }, [state.isSupported, shopId]);

  /**
   * Unsubscribe from push notifications.
   */
  const unsubscribe = useCallback(async () => {
    if (!state.subscription) return;

    try {
      await state.subscription.unsubscribe();
      setState((prev) => ({
        ...prev,
        subscription: null,
      }));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to unsubscribe.';
      setState((prev) => ({ ...prev, error: message }));
    }
  }, [state.subscription]);

  return {
    ...state,
    subscribe,
    unsubscribe,
  };
}
