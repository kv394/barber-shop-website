'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function KioskClient({ shopId, classes }: { shopId: string, classes: any[] }) {
  const router = useRouter();
  const [checkingIn, setCheckingIn] = useState<string | null>(null);

  const handleCheckIn = async (appointmentId: string) => {
    setCheckingIn(appointmentId);
    try {
      const res = await fetch(`/api/kiosk/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId })
      });
      if (res.ok) {
        // Success animation or something
        setTimeout(() => {
          router.refresh();
          setCheckingIn(null);
        }, 1000);
      } else {
        alert('Failed to check in');
        setCheckingIn(null);
      }
    } catch (e) {
      alert('Error checking in');
      setCheckingIn(null);
    }
  };

  if (classes.length === 0) {
    return (
      <div className="text-center text-zinc-500 py-20 text-2xl font-semibold">
        No classes scheduled for today.
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {classes.map((cls, idx) => (
        <div key={idx} className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
          <div className="flex justify-between items-end mb-8 border-b border-white/10 pb-6">
            <div>
              <h2 className="text-3xl font-black text-white">{cls.service.name}</h2>
              <p className="text-zinc-400 mt-2 text-lg">
                {new Date(cls.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                {new Date(cls.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            {cls.service.location && (
              <div className="bg-pink-500/20 text-pink-400 px-4 py-2 rounded-full font-bold">
                {cls.service.location}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {cls.students.length === 0 && (
              <div className="col-span-full text-center text-zinc-500 py-4">
                No students enrolled
              </div>
            )}
            {cls.students.map((student: any) => {
              const isPresent = student.status === 'PRESENT';
              const isLoading = checkingIn === student.appointmentId;
              
              return (
                <button
                  key={student.appointmentId}
                  disabled={isPresent || isLoading}
                  onClick={() => handleCheckIn(student.appointmentId)}
                  className={`relative p-6 rounded-2xl text-left transition-all ${
                    isPresent 
                      ? 'bg-green-500/20 border border-green-500/50 cursor-default opacity-50'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-pink-500/50 hover:scale-[1.02] cursor-pointer'
                  }`}
                >
                  <div className="text-xl font-bold text-white">{student.user.name || 'Anonymous'}</div>
                  {isPresent && (
                    <div className="absolute top-4 right-4 text-green-400 text-2xl font-black">
                      ✓
                    </div>
                  )}
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
