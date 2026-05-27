'use client';

import { useEffect } from 'react';

export default function IframeAuthHandler({ redirectUrl }: { redirectUrl: string }) {
  useEffect(() => {
    // If we are inside an iframe, tell the parent to close the modal
    if (window !== window.parent) {
      window.parent.postMessage({ type: 'CLOSE_MODAL' }, window.location.origin);
    } else {
      // If not in an iframe, just perform a standard redirect
      window.location.href = redirectUrl;
    }
  }, [redirectUrl]);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-12 bg-crm-surface text-center min-h-[80vh]">
      <div className="text-6xl mb-4 text-crm-primary">✓</div>
      <h2 className="text-2xl font-bold text-crm-text mb-2 font-serif">Sign In Successful</h2>
      <p className="text-crm-muted mb-6 text-[14px]">You are now authenticated.</p>
      <p className="text-sm text-crm-muted/60">This window will close automatically...</p>
    </div>
  );
}
