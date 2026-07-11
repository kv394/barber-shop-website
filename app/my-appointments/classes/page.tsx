'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface FamilyMember {
  id: string;
  name: string;
  role: string;
}

interface ClassSchedule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  service: { id: string; name: string; description: string | null; price: number; duration: number };
  staff: { id: string; name: string; imageUrl: string | null };
  shop: { id: string; name: string };
  term: { id: string; name: string; startDate: string; endDate: string } | null;
}

interface Enrollment {
  id: string;
  status: string;
  student: { id: string; name: string; role: string };
  classSchedule: {
    id: string;
    service: { id: string; name: string };
    shop: { id: string; name: string };
    term: { id: string; name: string } | null;
  };
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatTime(time24: string) {
  const [h, m] = time24.split(':');
  const d = new Date();
  d.setHours(parseInt(h, 10));
  d.setMinutes(parseInt(m, 10));
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [family, setFamily] = useState<FamilyMember[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [enrollingClassId, setEnrollingClassId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const res = await fetch('/api/my-appointments/classes');
      if (!res.ok) throw new Error('Failed to load classes');
      const data = await res.json();
      setClasses(data.classes || []);
      setEnrollments(data.enrollments || []);
      setFamily(data.family || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleEnroll(e: React.FormEvent) {
    e.preventDefault();
    if (!enrollingClassId || !selectedStudentId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/my-appointments/classes/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classScheduleId: enrollingClassId, studentId: selectedStudentId })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to enroll');
      }

      setEnrollingClassId(null);
      setSelectedStudentId('');
      await fetchData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center">
        <p className="text-crm-muted font-medium text-[13px]">Loading Classes...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      
      {/* Enrollments Section */}
      <div className="bg-crm-surface border border-crm-border rounded-xl shadow-sm overflow-hidden p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-crm-text">My Enrollments</h2>
          <p className="text-crm-muted text-[13px] mt-1">Current active class enrollments for your family.</p>
        </div>

        {enrollments.length === 0 ? (
          <div className="text-center py-10 bg-crm-bg border border-crm-border border-dashed rounded-xl">
            <p className="text-crm-muted text-[13px]">No active enrollments found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {enrollments.map(enr => (
              <div key={enr.id} className="bg-crm-bg border border-crm-border p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-crm-primary/10 text-crm-primary px-2 py-0.5 rounded text-[11px] font-bold">
                      {enr.student.name}
                    </span>
                    <span className="bg-green-500/10 text-green-600 px-2 py-0.5 rounded text-[11px] font-bold">
                      {enr.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-crm-text text-[15px]">{enr.classSchedule.service.name}</h4>
                  <p className="text-crm-muted text-[12px] mt-1">
                    {enr.classSchedule.shop.name} • {enr.classSchedule.term?.name || 'Ongoing'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Classes Section */}
      <div className="bg-crm-surface border border-crm-border rounded-xl shadow-sm overflow-hidden p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-crm-text">Available Classes</h2>
          <p className="text-crm-muted text-[13px] mt-1">Browse and enroll in available classes.</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-lg text-[13px]">
            {error}
          </div>
        )}

        {classes.length === 0 ? (
          <div className="text-center py-10 bg-crm-bg border border-crm-border border-dashed rounded-xl">
            <p className="text-crm-muted text-[13px]">No classes available for enrollment right now.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {classes.map(cls => (
              <div key={cls.id} className="bg-crm-bg border border-crm-border p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-bold text-crm-text text-[16px]">{cls.service.name}</h4>
                  <div className="flex items-center gap-2 mt-1 mb-2 text-[12px] text-crm-muted font-medium">
                    <span>{DAYS[cls.dayOfWeek]}s at {formatTime(cls.startTime)}</span>
                    <span>•</span>
                    <span>{cls.service.duration} min</span>
                  </div>
                  <p className="text-[13px] text-crm-muted line-clamp-2">{cls.service.description}</p>
                  
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-crm-surface flex items-center justify-center border border-crm-border text-[10px] font-bold">
                        {cls.staff.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[12px] text-crm-text">{cls.staff.name}</span>
                    </div>
                    <span className="text-[12px] font-bold text-crm-text">${cls.service.price} / term</span>
                  </div>
                </div>
                
                <div className="sm:text-right">
                  <button
                    onClick={() => {
                      setEnrollingClassId(cls.id);
                      setSelectedStudentId(family[0]?.id || '');
                    }}
                    className="w-full sm:w-auto bg-crm-primary text-white font-bold px-6 py-2.5 rounded-lg text-[13px] hover:opacity-90 transition-opacity"
                  >
                    Enroll
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enrollment Modal */}
      {enrollingClassId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-crm-surface w-full max-w-md rounded-xl shadow-xl overflow-hidden border border-crm-border">
            <div className="p-5 border-b border-crm-border">
              <h3 className="text-lg font-bold text-crm-text">Who is enrolling?</h3>
            </div>
            <form onSubmit={handleEnroll} className="p-5">
              <div className="space-y-3 mb-6">
                {family.map(member => (
                  <label key={member.id} className="flex items-center gap-3 p-3 border border-crm-border rounded-lg cursor-pointer hover:bg-crm-bg transition-colors">
                    <input
                      type="radio"
                      name="student"
                      value={member.id}
                      checked={selectedStudentId === member.id}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="text-crm-primary focus:ring-crm-primary"
                    />
                    <div>
                      <p className="font-bold text-[14px] text-crm-text">{member.name}</p>
                      <p className="text-[11px] text-crm-muted uppercase tracking-wider">{member.role}</p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEnrollingClassId(null)}
                  className="px-4 py-2 text-[13px] font-bold text-crm-text bg-crm-bg border border-crm-border rounded shadow-sm hover:bg-crm-surface transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedStudentId}
                  className="px-6 py-2 text-[13px] font-bold text-white bg-crm-primary rounded shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isSubmitting ? 'Enrolling...' : 'Confirm Enrollment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
