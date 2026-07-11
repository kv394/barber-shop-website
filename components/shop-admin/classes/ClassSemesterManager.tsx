'use client';
import { useState, useRef } from 'react';
import { AcademicTerm } from '@prisma/client';
import { createSemester } from '@/app/actions/classes';

export default function ClassSemesterManager({ shopId, terms }: { shopId: string, terms: AcademicTerm[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Semesters & Terms</h2>
          <p className="text-sm text-gray-500 font-medium">Manage academic terms or seasons for group classes.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold rounded-xl transition-all shadow-sm active:scale-95"
        >
          Add Semester
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {terms.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <span className="text-4xl opacity-50 mb-3 block">📅</span>
            <p className="text-gray-500 font-medium text-sm">No semesters created yet.</p>
          </div>
        ) : (
          terms.map(term => (
            <div key={term.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-lg font-bold text-gray-900 mb-1">{term.name}</h3>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {new Date(term.startDate).toLocaleDateString()} - {new Date(term.endDate).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-black text-gray-900">Add New Semester</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors p-1 rounded-lg hover:bg-gray-100">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form action={async (formData) => {
              const res = await createSemester(formData);
              if (res.success) setIsModalOpen(false);
              else alert('Failed to create semester: ' + res.error);
            }} className="p-6 space-y-4">
              <input type="hidden" name="shopId" value={shopId} />
              
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Semester Name</label>
                <input type="text" name="name" required placeholder="e.g. Fall 2026" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Start Date</label>
                  <input type="date" name="startDate" required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">End Date</label>
                  <input type="date" name="endDate" required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors" />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 text-sm font-bold text-white bg-gray-900 hover:bg-gray-800 rounded-xl transition-all active:scale-95 shadow-sm">
                  Save Semester
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
