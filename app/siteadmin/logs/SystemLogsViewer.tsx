'use client';

import { useState, useEffect } from 'react';
import PremiumGlassCard from '@/components/ui/PremiumGlassCard';

type SystemLog = {
 id: string;
 level: string;
 path: string | null;
 message: string;
 metadata: any;
 isResolved: boolean;
 createdAt: string;
};

export default function SystemLogsViewer() {
 const [logs, setLogs] = useState<SystemLog[]>([]);
 const [loading, setLoading] = useState(true);
 const [page, setPage] = useState(1);
 const [totalPages, setTotalPages] = useState(1);
 const [totalLogs, setTotalLogs] = useState(0);
 
 // Filters
 const [levelFilter, setLevelFilter] = useState('');
 const [pathFilter, setPathFilter] = useState('');
 
 // Details Modal
 const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);

 const fetchLogs = () => {
 setLoading(true);
 const params = new URLSearchParams({ page: page.toString(), limit: '20' });
 if (levelFilter) params.append('level', levelFilter);
 if (pathFilter) params.append('path', pathFilter);

 fetch(`/api/siteadmin/logs?${params.toString()}`)
 .then(res => res.json())
 .then(data => {
 setLogs(data.logs || []);
 setTotalPages(data.pagination?.pages || 1);
 setTotalLogs(data.pagination?.total || 0);
 setLoading(false);
 });
 };

 useEffect(() => {
 fetchLogs();
 }, [page, levelFilter, pathFilter]);

 const handleDeleteOldLogs = async () => {
 if (!confirm('Are you sure you want to delete all logs older than 30 days?')) return;
 
 try {
 const res = await fetch('/api/siteadmin/logs', { method: 'DELETE' });
 if (res.ok) {
 alert('Old logs deleted successfully');
 fetchLogs();
 }
 } catch (e) {
 alert('Error deleting logs');
 }
 };

 const getLevelColor = (level: string) => {
 switch (level.toUpperCase()) {
 case 'ERROR':
 case 'CRITICAL': return 'text-red-500 bg-red-500/10 border-red-500/20';
 case 'WARNING':
 case 'WARN': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
 case 'INFO': return 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20';
 default: return 'text-crm-muted bg-white/10 border-white/20';
 }
 };

 return (
 <div className="space-y-6">
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
 <div>
 <h2 className="text-xl font-bold text-crm-text">System Logs</h2>
 <p className="text-[13px] text-crm-muted mt-1">Total Logs: {totalLogs}</p>
 </div>
 
 <div className="flex flex-wrap items-center gap-3">
 <select 
 value={levelFilter}
 onChange={(e) => { setLevelFilter(e.target.value); setPage(1); }}
 className="bg-crm-bg/50 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2.5 text-crm-text outline-none text-[13px] font-bold shadow-inner"
 >
 <option value="">All Levels</option>
 <option value="ERROR">Error</option>
 <option value="WARNING">Warning</option>
 <option value="INFO">Info</option>
 </select>
 
 <input 
 type="text"
 placeholder="Filter by Path/Source"
 value={pathFilter}
 onChange={(e) => { setPathFilter(e.target.value); setPage(1); }}
 className="bg-crm-bg/50 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2.5 text-crm-text outline-none text-[13px] font-medium shadow-inner"
 />

 <button
 onClick={handleDeleteOldLogs}
 className="bg-white/10 text-crm-muted hover:text-red-500 border border-white/20 hover:border-red-500/30 hover:bg-red-500/10 px-4 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-widest transition-colors shadow-inner"
 >
 Clear Old
 </button>
 </div>
 </div>

 <PremiumGlassCard accentColor="crm-primary" className="!p-0 overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="border-b border-white/20 bg-white/40">
 <th className="p-4 text-[10px] uppercase tracking-widest font-black text-crm-muted whitespace-nowrap">Timestamp</th>
 <th className="p-4 text-[10px] uppercase tracking-widest font-black text-crm-muted">Level</th>
 <th className="p-4 text-[10px] uppercase tracking-widest font-black text-crm-muted">Path / Source</th>
 <th className="p-4 text-[10px] uppercase tracking-widest font-black text-crm-muted w-1/2">Message</th>
 <th className="p-4 text-[10px] uppercase tracking-widest font-black text-crm-muted text-right">Details</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-white/10 text-[13px]">
 {loading && logs.length === 0 ? (
 <tr>
 <td colSpan={5} className="p-8 text-center text-crm-muted font-bold">Loading logs...</td>
 </tr>
 ) : logs.length === 0 ? (
 <tr>
 <td colSpan={5} className="p-8 text-center text-crm-muted font-bold">No logs found.</td>
 </tr>
 ) : (
 logs.map(log => (
 <tr key={log.id} className="hover:bg-white/40 transition-colors">
 <td className="p-4 font-mono text-[12px] text-crm-muted whitespace-nowrap">
 {new Date(log.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
 </td>
 <td className="p-4">
 <span className={`px-2 py-1 rounded text-[10px] font-black tracking-widest border shadow-inner ${getLevelColor(log.level)}`}>
 {log.level}
 </span>
 </td>
 <td className="p-4 font-mono text-[11px] text-crm-text truncate max-w-[200px]">
 {log.path || 'System'}
 </td>
 <td className="p-4 text-crm-text truncate max-w-[400px]">
 {log.message}
 </td>
 <td className="p-4 text-right">
 <button 
 onClick={() => setSelectedLog(log)}
 className="text-[11px] font-bold uppercase tracking-wider text-crm-primary hover:text-brand-gold transition-colors"
 >
 View
 </button>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>

 {/* Pagination */}
 {totalPages > 1 && (
 <div className="p-4 border-t border-white/20 bg-white/20 flex justify-between items-center">
 <button 
 onClick={() => setPage(p => Math.max(1, p - 1))}
 disabled={page === 1}
 className="px-4 py-2 bg-white/40 rounded-lg text-[12px] font-bold text-crm-text disabled:opacity-30 shadow-inner border border-white/20"
 >
 Previous
 </button>
 <span className="text-[12px] font-bold text-crm-muted">
 Page {page} of {totalPages}
 </span>
 <button 
 onClick={() => setPage(p => Math.min(totalPages, p + 1))}
 disabled={page === totalPages}
 className="px-4 py-2 bg-white/40 rounded-lg text-[12px] font-bold text-crm-text disabled:opacity-30 shadow-inner border border-white/20"
 >
 Next
 </button>
 </div>
 )}
 </PremiumGlassCard>

 {/* Log Details Modal */}
 {selectedLog && (
 <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedLog(null)}>
 <div className="bg-crm-bg border border-white/20 shadow-2xl rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
 <div className="p-6 border-b border-white/20 flex justify-between items-start bg-white/5">
 <div>
 <div className="flex items-center gap-3 mb-2">
 <span className={`px-2.5 py-1 rounded text-[10px] font-black tracking-widest border shadow-inner ${getLevelColor(selectedLog.level)}`}>
 {selectedLog.level}
 </span>
 <span className="font-mono text-[12px] text-crm-muted">{new Date(selectedLog.createdAt).toLocaleString()}</span>
 </div>
 <h3 className="text-xl font-bold text-crm-text break-all">{selectedLog.message}</h3>
 </div>
 <button onClick={() => setSelectedLog(null)} className="text-crm-muted hover:text-crm-text text-2xl leading-none">×</button>
 </div>
 
 <div className="p-6 space-y-6">
 <div>
 <h4 className="text-[11px] uppercase tracking-widest font-black text-crm-muted mb-2">Path / Source</h4>
 <div className="bg-crm-bg/50 p-3 rounded-lg border border-white/10 font-mono text-[13px] text-crm-text break-all shadow-inner">
 {selectedLog.path || 'N/A'}
 </div>
 </div>
 
 {selectedLog.metadata && (
 <div>
 <h4 className="text-[11px] uppercase tracking-widest font-black text-crm-muted mb-2">Metadata / Payload</h4>
 <pre className="bg-crm-bg/50 p-4 rounded-lg border border-white/10 font-mono text-[12px] text-crm-text overflow-x-auto shadow-inner">
 {JSON.stringify(selectedLog.metadata, null, 2)}
 </pre>
 </div>
 )}
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
