'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface AppointmentData {
  id: string;
  startTime: string;
  status: string;
  service: { name: string; price: number } | null;
  staff: { name: string } | null;
  shop: { id: string; name: string; timezone: string };
  review: { id: string } | null;
}

export default function ReviewPage({ params }: { params: Promise<{ appointmentId: string }> }) {
  const router = useRouter();
  const [appointmentId, setAppointmentId] = useState<string>('');
  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    params.then(p => setAppointmentId(p.appointmentId));
  }, [params]);

  useEffect(() => {
    if (!appointmentId) return;

    fetch('/api/my-appointments')
      .then(r => r.json())
      .then(data => {
        const all = [...(data.upcoming || []), ...(data.past || [])];
        const apt = all.find((a: any) => a.id === appointmentId);
        if (apt) setAppointment(apt);
        else setError('Appointment not found.');
      })
      .catch(() => setError('Failed to load appointment.'))
      .finally(() => setLoading(false));
  }, [appointmentId]);

  const handleSubmit = async () => {
    if (!appointment || rating === 0) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/shops/${appointment.shop.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: appointment.id,
          rating,
          comment: comment.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit review');
      }

      setSuccess(true);
      setTimeout(() => router.push('/my-appointments'), 2000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[100dvh] overflow-y-auto overflow-x-hidden">
        <p className="text-crm-muted animate-pulse text-[13px]">Loading…</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="h-[100dvh] overflow-y-auto overflow-x-hidden">
        <div className="text-center">
          <p className="mb-4 text-[13px]">🎉</p>
          <h2 className="font-bold text-crm-text mb-2 text-xl font-bold">Thank You!</h2>
          <p className="text-crm-muted text-[13px]">Your review has been submitted.</p>
          <p className="text-crm-muted mt-2 text-[13px]">Redirecting…</p>
        </div>
      </div>
    );
  }

  const alreadyReviewed = appointment?.review != null;

  return (
    <main className="h-[100dvh] overflow-y-auto overflow-x-hidden">
      

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {error && (
          <div className="mb-6 bg-status-cancelled/20 border border-status-cancelled/30 text-status-cancelled px-4 py-3 rounded-lg text-[13px]">
            {error}
          </div>
        )}

        {!appointment ? (
          <div className="text-center py-12">
            <p className="text-crm-muted text-[13px]">Appointment not found.</p>
            <Link href="/my-appointments" className="text-crm-accent hover:text-crm-text text-[13px] mt-4 inline-block">← Back to appointments</Link>
          </div>
        ) : alreadyReviewed ? (
          <div className="text-center py-12 bg-crm-surface border border-crm-border shadow-sm rounded-xl p-8">
            <p className="mb-4 text-[13px]">✅</p>
            <h2 className="font-bold text-crm-text mb-2 text-xl font-bold">Already Reviewed</h2>
            <p className="text-crm-muted text-[13px]">You&apos;ve already left a review for this appointment.</p>
            <Link href="/my-appointments" className="text-crm-accent hover:text-crm-text text-[13px] mt-4 inline-block">← Back to appointments</Link>
          </div>
        ) : appointment.status !== 'COMPLETED' ? (
          <div className="text-center py-12 bg-crm-surface border border-crm-border shadow-sm rounded-xl p-8">
            <p className="mb-4 text-[13px]">⏳</p>
            <h2 className="font-bold text-crm-text mb-2 text-xl font-bold">Not Yet Completed</h2>
            <p className="text-crm-muted text-[13px]">You can only review completed appointments.</p>
            <Link href="/my-appointments" className="text-crm-accent hover:text-crm-text text-[13px] mt-4 inline-block">← Back to appointments</Link>
          </div>
        ) : (
          <div className="bg-crm-surface border border-crm-border shadow-sm rounded-xl overflow-hidden">
            {/* Appointment Summary */}
            <div className="p-6 bg-gradient-to-r from-purple-600/10 to-brand-gold/10 border-b border-crm-border">
              <h2 className="font-bold text-crm-text text-xl font-bold">{appointment.shop.name}</h2>
              <div className="mt-2 space-y-1">
                <p className="text-crm-muted text-[13px]">
                  {appointment.service?.name || 'Service'}
                  {appointment.staff?.name && <span className="text-crm-muted"> · with {appointment.staff.name}</span>}
                </p>
                <p className="text-crm-muted text-[13px]">
                  {new Date(appointment.startTime).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Rating */}
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-crm-muted mb-3 text-[13px]">How was your experience?</label>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      onClick={() => setRating(star)}
                      className="text-4xl transition-transform hover:scale-110 active:scale-95"
                    >
                      <span className={star <= (hoveredRating || rating) ? 'opacity-100' : 'opacity-30'}>
                        ⭐
                      </span>
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-center text-crm-muted mt-2 text-[13px]">
                    {rating === 1 && 'Poor'}
                    {rating === 2 && 'Fair'}
                    {rating === 3 && 'Good'}
                    {rating === 4 && 'Great'}
                    {rating === 5 && 'Excellent!'}
                  </p>
                )}
              </div>

              {/* Comment */}
              <div>
                <label className="block text-crm-muted mb-2 text-[13px]">Leave a comment (optional)</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us about your experience…"
                  rows={4}
                  maxLength={1000}
                  className="w-full bg-crm-surface border border-crm-border shadow-sm rounded-lg p-3 text-crm-text placeholder-gray-600 focus:outline-none focus:border-brand-gold resize-none"
                />
                <p className="text-crm-muted text-right mt-1 text-[13px]">{comment.length}/1000</p>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={rating === 0 || submitting}
                className="w-full bg-crm-primary text-white font-bold py-3 rounded-lg hover:bg-crm-surface hover:text-crm-primary border border-transparent hover:border-crm-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting…' : 'Submit Review'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

