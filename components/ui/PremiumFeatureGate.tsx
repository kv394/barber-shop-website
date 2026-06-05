import Image from 'next/image';
import React from 'react';
import { prisma } from '@/lib/prisma';
import PremiumFeatureRequestButton from './PremiumFeatureRequestButton';

interface PremiumFeatureGateProps {
  shopId: string;
  featureId: string;
  title: string;
  description: string;
  price: string;
  children: React.ReactNode;
}

export default async function PremiumFeatureGate({
  shopId,
  featureId,
  title,
  description,
  price,
  children
}: PremiumFeatureGateProps) {
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { premiumFeatures: true, customization: true, name: true }
  });

  if (!shop) return <>{children}</>;

  const features = shop.premiumFeatures as Record<string, boolean> | null;
  const isEnabled = features?.[featureId] === true;

  if (isEnabled) {
    return <>{children}</>;
  }

  // Check if there's already a pending request for this feature
  const customization = (shop.customization as Record<string, any>) || {};
  const featureRequests: any[] = customization.featureRequests || [];
  const pendingRequest = featureRequests.find(
    (r: any) => r.featureId === featureId && r.status === 'PENDING'
  );

  return (
    <div className="relative w-full h-full min-h-[60vh] flex items-center justify-center">
      {/* Blurred background preview of the locked feature */}
      <div className="absolute inset-0 overflow-hidden opacity-30 pointer-events-none filter blur-sm transition-all select-none">
        {children}
      </div>
      
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-crm-bg via-crm-bg/80 to-transparent z-10"></div>

      {/* Premium Upsell Card */}
      <div className="relative z-20 max-w-md w-full mx-auto bg-crm-surface border border-crm-border rounded-2xl shadow-2xl p-8 text-center mt-12">
        <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/20">
          <span className="text-3xl">💎</span>
        </div>
        
        <h2 className="text-2xl font-black text-crm-text mb-2">Premium Feature Locked</h2>
        <h3 className="text-xl font-bold text-crm-primary mb-4">{title}</h3>
        
        <p className="text-crm-muted text-[15px] leading-relaxed mb-6">
          {description}
        </p>
        
        <div className="bg-crm-bg rounded-xl p-4 mb-8 border border-crm-border flex justify-between items-center">
          <span className="font-semibold text-crm-text">Monthly Add-on</span>
          <span className="text-2xl font-black text-brand-indigo">{price}</span>
        </div>

        <PremiumFeatureRequestButton
          shopId={shopId}
          featureId={featureId}
          featureName={title}
          hasPendingRequest={!!pendingRequest}
        />

        <p className="text-[12px] text-crm-muted mt-4">
          Your request will be reviewed by the platform administrator.
        </p>
      </div>
    </div>
  );
}
