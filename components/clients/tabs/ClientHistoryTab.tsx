import Image from 'next/image';
import React from 'react';
import { fmtPrice } from '@/lib/formatters';

export function ClientHistoryTab({ client, loyaltyData, currency, getStatusBadge }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-crm-surface p-3 rounded-lg text-center border border-crm-border shadow-sm">
          <p className="font-bold text-crm-text text-[13px]">{client._count?.clientAppointments || 0}</p>
          <p className="text-crm-muted uppercase tracking-wider text-[13px]">Visits</p>
        </div>
        <div className="bg-crm-surface p-3 rounded-lg text-center border border-crm-border shadow-sm">
          <p className="font-bold text-status-confirmed text-[13px]">
            {fmtPrice(client.clientAppointments?.filter((a: any) => a.status === 'COMPLETED').reduce((sum: number, a: any) => sum + (a.totalAmount > 0 ? a.totalAmount : (a.service?.price || 0)), 0) || 0, currency)}
          </p>
          <p className="text-crm-muted uppercase tracking-wider text-[13px]">Spent</p>
        </div>
        <div className="bg-crm-surface p-3 rounded-lg text-center border border-crm-border shadow-sm">
          <p className="font-bold text-status-pending text-[13px]">
            {client.clientAppointments?.filter((a: any) => a.status === 'NO_SHOW').length || 0}
          </p>
          <p className="text-crm-muted uppercase tracking-wider text-[13px]">No-Shows</p>
        </div>
      </div>
      {loyaltyData && (
        <div className="bg-gradient-to-r from-brand-indigo/10 to-amber-900/10 border border-brand-indigo/20 p-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">⭐</span>
            <div>
              <p className="text-crm-muted uppercase tracking-wider text-[13px]">Loyalty Points</p>
              <p className="font-black text-crm-accent text-[13px]">{loyaltyData.pointsBalance}</p>
            </div>
          </div>
          <div className="text-right text-[13px] text-crm-muted">
            <p className="text-[13px]">Earned: <span className="text-status-confirmed font-semibold">{loyaltyData.totalEarned}</span></p>
            <p className="text-[13px]">Redeemed: <span className="text-status-cancelled font-semibold">{loyaltyData.totalRedeemed}</span></p>
          </div>
        </div>
      )}
      <h4 className="font-semibold text-crm-text mb-3 mt-4 text-base font-semibold">Past Appointments</h4>
      {client.clientAppointments?.length > 0 ? (
        <div className="space-y-2">
          {client.clientAppointments.map((apt: any) => (
            <div key={apt.id} className="bg-crm-surface p-3 rounded-lg border border-crm-border shadow-sm text-[13px] flex flex-wrap justify-between gap-x-2 gap-y-2 items-start">
              <div className="min-w-0">
                <p className="font-medium text-crm-text truncate text-[13px]">{apt.service?.name || 'Walkin Service'}</p>
                <p className="text-crm-muted text-[13px]">
                  {new Date(apt.startTime).toLocaleDateString()} {apt.staff?.name && `• ${apt.staff.name}`}
                </p>
              </div>
              <div className="text-right shrink-0 ml-2">
                <p className="font-bold text-status-confirmed text-[13px]">{fmtPrice(apt.totalAmount > 0 ? apt.totalAmount : (apt.service?.price || 0), currency)}</p>
                {getStatusBadge(apt.status)}
              </div>
            </div>
          ))}
        </div>
      ) : <p className="text-crm-muted italic py-2 text-[13px]">No history yet.</p>}
    </div>
  );
}
