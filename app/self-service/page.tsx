"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface AppointmentData {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  managementToken: string | null;
  notes: string | null;
  service: { id: string; name: string; price: number; duration: number } | null;
  staff: { name: string; imageUrl: string | null } | null;
  shop: { id: string; name: string; timezone: string; currency: string };
}

function SelfServiceContent() {
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get("token");

  const [mode, setMode] = useState<"TOKEN" | "EMAIL_FORM" | "RESULTS">(
    tokenParam ? "TOKEN" : "EMAIL_FORM"
  );
  const [email, setEmail] = useState("");
  const [clientName, setClientName] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [loading, setLoading] = useState(!!tokenParam);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState<
    { time: string; available: boolean }[]
  >([]);
  const [selectedTime, setSelectedTime] = useState("");
  const [fetchingSlots, setFetchingSlots] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);

  // If token is provided, fetch the single appointment
  useEffect(() => {
    if (tokenParam) {
      fetchByToken(tokenParam);
    }
  }, [tokenParam]);

  async function fetchByToken(token: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/manage/${token}`);
      if (!res.ok) {
        // The manage route only has DELETE/PATCH, so GET returns 405
        // Instead, let's try the lookup approach - show the single appointment manage page
        window.location.href = `/manage/${token}`;
        return;
      }
    } catch {
      // Redirect to single appointment management
      window.location.href = `/manage/${token}`;
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/my-appointments/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Lookup failed");
      }
      setAppointments(data.appointments || []);
      setClientName(data.clientName || null);
      setMode("RESULTS");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(apt: AppointmentData) {
    if (!apt.managementToken) {
      setError("This appointment cannot be cancelled online. Please contact the shop.");
      return;
    }
    setCancellingId(apt.id);
    setError(null);
    try {
      const res = await fetch(`/api/manage/${apt.managementToken}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to cancel");
      }
      // Remove from list
      setAppointments((prev) =>
        prev.filter((a) => a.id !== apt.id)
      );
      setCancelConfirmId(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCancellingId(null);
    }
  }

  async function handleDateChange(date: string, apt: AppointmentData) {
    setSelectedDate(date);
    setSelectedTime("");
    setFetchingSlots(true);
    setError(null);
    try {
      const duration = apt.service?.duration || 30;
      const staffId = (apt as any).staffId || "";
      // Try fetching from renter availability first, fall back to shop availability
      const res = await fetch(
        `/api/renter/${staffId}/availability?date=${date}&duration=${duration}`
      );
      const data = await res.json();
      if (res.ok) {
        setAvailableSlots(data.slots || []);
      } else {
        setError(data.error || "Could not load times");
      }
    } catch {
      setError("Failed to fetch availability");
    } finally {
      setFetchingSlots(false);
    }
  }

  async function handleReschedule(apt: AppointmentData) {
    if (!apt.managementToken || !selectedDate || !selectedTime) return;
    setRescheduling(true);
    setError(null);
    try {
      const [h, m] = selectedTime.split(":").map(Number);
      const start = new Date(selectedDate);
      start.setHours(h, m, 0, 0);
      const end = new Date(
        start.getTime() + (apt.service?.duration || 30) * 60000
      );

      const res = await fetch(`/api/manage/${apt.managementToken}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newStartTime: start.toISOString(),
          newEndTime: end.toISOString(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to reschedule");
      }

      // Update appointment in list
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === apt.id
            ? { ...a, startTime: start.toISOString(), endTime: end.toISOString() }
            : a
        )
      );
      setRescheduleId(null);
      setSelectedDate("");
      setSelectedTime("");
      setAvailableSlots([]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRescheduling(false);
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function formatCurrency(amount: number, currency: string = "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-crm-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-crm-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-crm-muted text-sm animate-pulse">
            Looking up your appointments...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-crm-bg">
      {/* Header */}
      <div className="bg-crm-surface border-b border-crm-border shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-crm-primary/10 flex items-center justify-center text-xl">
              📅
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-crm-text">
                My Appointments
              </h1>
              <p className="text-crm-muted text-[13px]">
                View and manage your upcoming bookings
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-[13px] flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Email Lookup Form */}
        {mode === "EMAIL_FORM" && (
          <div className="bg-crm-surface border border-crm-border rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-crm-primary/10 flex items-center justify-center text-3xl mx-auto mb-4">
                🔍
              </div>
              <h2 className="text-lg font-bold text-crm-text mb-1">
                Find Your Appointments
              </h2>
              <p className="text-crm-muted text-sm">
                Enter the email address you used when booking to see your upcoming
                appointments.
              </p>
            </div>

            <form onSubmit={handleEmailLookup} className="space-y-4">
              <div>
                <label
                  htmlFor="email-lookup"
                  className="block text-sm font-bold text-crm-muted mb-2"
                >
                  Email Address
                </label>
                <input
                  id="email-lookup"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-crm-bg border border-crm-border focus:border-crm-primary focus:ring-1 focus:ring-crm-primary rounded-xl px-4 py-3 text-crm-text text-sm outline-none transition-all placeholder:text-crm-muted/50"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full py-3.5 bg-crm-primary hover:bg-crm-accent text-white font-bold rounded-xl transition-colors disabled:opacity-50 shadow-sm text-sm"
              >
                {loading ? "Looking up..." : "Find My Appointments"}
              </button>
            </form>
          </div>
        )}

        {/* Results */}
        {mode === "RESULTS" && (
          <>
            {/* Back / search again */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setMode("EMAIL_FORM");
                  setAppointments([]);
                  setClientName(null);
                }}
                className="text-crm-muted hover:text-crm-text text-sm font-semibold flex items-center gap-1 transition-colors"
              >
                ← Search Again
              </button>
              {clientName && (
                <span className="text-sm text-crm-muted">
                  Welcome, <span className="font-bold text-crm-text">{clientName}</span>
                </span>
              )}
            </div>

            {appointments.length === 0 ? (
              <div className="bg-crm-surface border border-crm-border rounded-2xl p-8 text-center shadow-sm">
                <div className="text-4xl mb-4">📭</div>
                <h3 className="font-bold text-crm-text text-lg mb-2">
                  No Upcoming Appointments
                </h3>
                <p className="text-crm-muted text-sm">
                  We couldn&apos;t find any upcoming appointments for this email
                  address.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-6 bg-crm-primary rounded-full" />
                  <h2 className="font-bold text-crm-text">
                    Upcoming Appointments ({appointments.length})
                  </h2>
                </div>

                {appointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="bg-crm-surface border border-crm-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Appointment Card Header */}
                    <div className="p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0 space-y-2">
                          {/* Shop name */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-crm-text text-sm sm:text-base">
                              {apt.shop?.name || "Shop"}
                            </span>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                              Upcoming
                            </span>
                          </div>

                          {/* Service + Staff */}
                          <div className="flex items-center gap-2 text-[13px]">
                            <span className="text-crm-text font-medium">
                              {apt.service?.name || "Appointment"}
                            </span>
                            {apt.staff?.name && (
                              <>
                                <span className="text-crm-muted">·</span>
                                <span className="text-crm-muted">
                                  with {apt.staff.name}
                                </span>
                              </>
                            )}
                          </div>

                          {/* Date / Time */}
                          <div className="flex items-center gap-2 text-[13px]">
                            <span className="text-crm-muted">📅</span>
                            <span className="font-mono text-crm-primary font-semibold">
                              {formatDate(apt.startTime)}
                            </span>
                            <span className="text-crm-muted">at</span>
                            <span className="font-mono text-crm-primary font-semibold">
                              {formatTime(apt.startTime)}
                            </span>
                          </div>

                          {/* Price + Duration */}
                          <div className="flex items-center gap-3 text-[12px] text-crm-muted">
                            {apt.service?.price != null && (
                              <span>
                                {formatCurrency(
                                  apt.service.price,
                                  apt.shop?.currency
                                )}
                              </span>
                            )}
                            {apt.service?.duration && (
                              <span>{apt.service.duration} min</span>
                            )}
                          </div>
                        </div>

                        {/* Staff avatar */}
                        {apt.staff && (
                          <div className="shrink-0">
                            {apt.staff.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={apt.staff.imageUrl}
                                alt={apt.staff.name}
                                className="w-12 h-12 rounded-full border-2 border-crm-border object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full border-2 border-crm-border bg-crm-bg flex items-center justify-center text-lg font-bold text-crm-primary">
                                {apt.staff.name[0]?.toUpperCase()}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Reschedule panel */}
                    {rescheduleId === apt.id && (
                      <div className="border-t border-crm-border p-4 sm:p-5 bg-crm-bg space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-crm-text text-sm">
                            Pick a New Time
                          </h4>
                          <button
                            onClick={() => {
                              setRescheduleId(null);
                              setSelectedDate("");
                              setSelectedTime("");
                              setAvailableSlots([]);
                            }}
                            className="text-crm-muted hover:text-crm-text text-sm font-bold"
                          >
                            ✕
                          </button>
                        </div>

                        <div>
                          <label className="block text-[12px] font-bold text-crm-muted mb-1.5">
                            Date
                          </label>
                          <input
                            type="date"
                            min={new Date().toISOString().split("T")[0]}
                            value={selectedDate}
                            onChange={(e) =>
                              handleDateChange(e.target.value, apt)
                            }
                            className="w-full bg-crm-surface border border-crm-border focus:border-crm-primary rounded-lg px-3 py-2.5 text-crm-text text-sm outline-none"
                          />
                        </div>

                        {selectedDate && (
                          <div>
                            <label className="block text-[12px] font-bold text-crm-muted mb-1.5">
                              Time
                            </label>
                            {fetchingSlots ? (
                              <div className="animate-pulse flex gap-2 py-2">
                                {[1, 2, 3].map((i) => (
                                  <div
                                    key={i}
                                    className="h-10 w-20 bg-crm-border rounded-lg"
                                  />
                                ))}
                              </div>
                            ) : availableSlots.length === 0 ? (
                              <p className="text-crm-muted text-[13px] py-2">
                                No availability on this date.
                              </p>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {availableSlots.map((slot) => {
                                  const [h] = slot.time.split(":").map(Number);
                                  const ampm = h >= 12 ? "PM" : "AM";
                                  const fmtH = h % 12 || 12;
                                  return (
                                    <button
                                      key={slot.time}
                                      disabled={!slot.available}
                                      onClick={() =>
                                        setSelectedTime(slot.time)
                                      }
                                      className={`px-3 py-2 rounded-lg font-semibold text-[13px] transition-all ${
                                        !slot.available
                                          ? "bg-crm-bg text-crm-muted opacity-50 cursor-not-allowed"
                                          : selectedTime === slot.time
                                          ? "bg-crm-primary text-white shadow-lg scale-105"
                                          : "bg-crm-surface border border-crm-border text-crm-text hover:border-crm-primary"
                                      }`}
                                    >
                                      {fmtH}:{slot.time.split(":")[1]} {ampm}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}

                        <button
                          onClick={() => handleReschedule(apt)}
                          disabled={
                            rescheduling || !selectedDate || !selectedTime
                          }
                          className="w-full py-3 bg-crm-primary hover:bg-crm-accent text-white font-bold rounded-xl transition-colors disabled:opacity-50 text-sm"
                        >
                          {rescheduling
                            ? "Rescheduling..."
                            : "Confirm Reschedule"}
                        </button>
                      </div>
                    )}

                    {/* Action buttons */}
                    {rescheduleId !== apt.id && (
                      <div className="border-t border-crm-border p-3 flex gap-2">
                        <button
                          onClick={() => setRescheduleId(apt.id)}
                          className="flex-1 py-2.5 text-[13px] font-semibold bg-blue-50 text-blue-600 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          Reschedule
                        </button>
                        <button
                          onClick={() => setCancelConfirmId(apt.id)}
                          disabled={cancellingId === apt.id}
                          className="flex-1 py-2.5 text-[13px] font-semibold bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          {cancellingId === apt.id
                            ? "Cancelling..."
                            : "Cancel"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {cancelConfirmId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-crm-surface rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="text-center mb-4">
              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center text-2xl mx-auto mb-3">
                ⚠️
              </div>
              <h3 className="font-bold text-lg text-crm-text mb-1">
                Cancel Appointment?
              </h3>
              <p className="text-crm-muted text-sm">
                This action cannot be undone. You will lose your time slot.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelConfirmId(null)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-crm-border text-crm-muted font-medium hover:bg-crm-bg transition-colors"
              >
                Keep It
              </button>
              <button
                onClick={() => {
                  const apt = appointments.find(
                    (a) => a.id === cancelConfirmId
                  );
                  if (apt) handleCancel(apt);
                }}
                disabled={!!cancellingId}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {cancellingId ? "Cancelling..." : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SelfServicePortalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-crm-bg flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-crm-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SelfServiceContent />
    </Suspense>
  );
}
