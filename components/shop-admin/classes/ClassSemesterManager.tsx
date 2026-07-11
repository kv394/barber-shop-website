'use client';
import { useState } from 'react';
import { AcademicTerm } from '@prisma/client';

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
    </div>
  );
}
