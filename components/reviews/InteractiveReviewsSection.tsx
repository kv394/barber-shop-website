"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function InteractiveReviewsSection({ shopId, initialReviews = [], themeColor }: { shopId: string, initialReviews?: any[], themeColor?: string }) {
  const [reviews, setReviews] = useState(initialReviews);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`/api/shops/${shopId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment }),
      });

      if (res.status === 401) {
        throw new Error('Please log in to leave a review.');
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit review');
      }

      const newReview = await res.json();
      // Optimistically add the review to the list
      // Mocking user since API doesn't return full user object immediately on create unless included
      setReviews([{ ...newReview, user: { name: 'You' }, createdAt: new Date().toISOString() }, ...reviews]);
      setComment('');
      setRating(5);
      setSuccess(true);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="my-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* Left Column: Form */}
        <div className="lg:col-span-1 bg-crm-surface border border-crm-border p-6 rounded-2xl shadow-sm h-fit">
          <h3 className="text-xl font-bold mb-4" style={{ color: themeColor || 'inherit' }}>Leave a Review</h3>
          
          {success ? (
            <div className="bg-status-confirmed/20 text-status-confirmed p-4 rounded-xl text-sm font-medium">
              Thank you for your feedback!
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-status-cancelled/20 text-status-cancelled p-3 rounded-lg text-[13px]">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-[13px] font-medium text-crm-muted mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className={`text-2xl transition-transform hover:scale-110 \${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-[13px] font-medium text-crm-muted mb-2">Your Review (Optional)</label>
                <textarea
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full bg-crm-bg border border-crm-border rounded-xl p-3 text-crm-text focus:ring-2 focus:outline-none text-[14px]"
                  placeholder="Share your experience..."
                  style={{ '--tw-ring-color': themeColor } as any}
                />
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full font-bold py-3 rounded-xl transition-all disabled:opacity-50 text-white"
                style={{ backgroundColor: themeColor || '#1f2937' }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          )}
        </div>

        {/* Right Column: Reviews List */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-bold mb-6 text-crm-text">What People Are Saying</h3>
          {reviews.length === 0 ? (
            <p className="text-crm-muted italic text-[14px]">No reviews yet. Be the first!</p>
          ) : (
            <div className="grid gap-6">
              {reviews.map((r: any) => (
                <div key={r.id} className="bg-crm-surface border border-crm-border p-6 rounded-2xl shadow-sm flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-crm-text">{r.user?.name || 'Anonymous'}</span>
                    <div className="flex text-yellow-400 text-sm">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i}>{i < r.rating ? '★' : '☆'}</span>
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="text-crm-muted text-[14px] leading-relaxed mb-4">{r.comment}</p>}
                  <div className="text-[12px] text-crm-muted/50 mt-auto">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}