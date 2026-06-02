'use client';

import { useState, useEffect, useCallback } from 'react';
import PremiumGlassCard from '@/components/ui/PremiumGlassCard';
import { 
  CheckCircle, 
  XCircle, 
  Search, 
  Trash2, 
  Filter,
  AlertTriangle
} from 'lucide-react';

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
  const [cursorStack, setCursorStack] = useState<string[]>([]);
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  
  // Filters
  const [levelFilter, setLevelFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Details Modal
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: '20' });
    if (currentCursor) params.append('cursor', currentCursor);
    if (levelFilter) params.append('level', levelFilter);
    if (searchQuery) params.append('search', searchQuery);
    if (statusFilter) params.append('status', statusFilter);

    try {
      const res = await fetch(`/api/siteadmin/logs?${params.toString()}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotalLogs(data.pagination?.total || 0);
      setNextCursor(data.pagination?.nextCursor || null);
    } catch (e) {
      console.error('Error fetching logs', e);
    } finally {
      setLoading(false);
    }
  }, [page, currentCursor, levelFilter, searchQuery, statusFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

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

  const toggleResolved = async (id: string, currentStatus: boolean, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    try {
      const res = await fetch('/api/siteadmin/logs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isResolved: !currentStatus })
      });
      
      if (res.ok) {
        if (selectedLog?.id === id) {
          setSelectedLog({ ...selectedLog, isResolved: !currentStatus });
        }
        setLogs(logs.map(log => log.id === id ? { ...log, isResolved: !currentStatus } : log));
      }
    } catch (error) {
      console.error('Failed to update log status', error);
      alert('Failed to update log status');
    }
  };

  const getLevelColor = (level: string) => {
    switch (level.toUpperCase()) {
      case 'AI_ALERT': return 'text-purple-400 bg-purple-400/20 border-purple-400/50 shadow-[0_0_15px_rgba(168,85,247,0.5)] animate-pulse';
      case 'ERROR':
      case 'CRITICAL': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'WARNING':
      case 'WARN': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'INFO': return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20';
      default: return 'text-gray-400 bg-white/10 border-white/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            Infrastructure Logs
          </h2>
          <p className="text-[13px] text-gray-400 mt-1 font-mono">
            {totalLogs} system events recorded
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
          <div className="relative flex-grow xl:flex-grow-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text"
              placeholder="Search message or path..."
              value={searchQuery}
              onChange={(e) => { 
                setSearchQuery(e.target.value); 
                setPage(1); 
                setCurrentCursor(null);
                setCursorStack([]);
              }}
              className="w-full xl:w-56 h-9 bg-black/40 backdrop-blur-md border border-white/10 rounded-lg pl-9 pr-3 text-white outline-none text-[12px] font-mono shadow-inner focus:border-white/30 transition-colors placeholder:text-gray-600"
            />
          </div>

          <div className="relative">
            <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <select 
              value={levelFilter}
              onChange={(e) => { 
                setLevelFilter(e.target.value); 
                setPage(1);
                setCurrentCursor(null);
                setCursorStack([]);
              }}
              className="h-9 bg-black/40 backdrop-blur-md border border-white/10 rounded-lg pl-9 pr-8 text-white outline-none text-[12px] font-semibold shadow-inner focus:border-white/30 transition-colors appearance-none"
            >
              <option value="">All Severities</option>
              <option value="AI_ALERT">AI Alert</option>
              <option value="ERROR">Error</option>
              <option value="WARNING">Warning</option>
              <option value="INFO">Info</option>
            </select>
          </div>

          <select 
            value={statusFilter}
            onChange={(e) => { 
              setStatusFilter(e.target.value); 
              setPage(1);
              setCurrentCursor(null);
              setCursorStack([]);
            }}
            className="h-9 bg-black/40 backdrop-blur-md border border-white/10 rounded-lg px-3 text-white outline-none text-[12px] font-semibold shadow-inner focus:border-white/30 transition-colors"
          >
            <option value="">All Statuses</option>
            <option value="unresolved">Unresolved</option>
            <option value="resolved">Resolved</option>
          </select>

          <button
            onClick={handleDeleteOldLogs}
            className="h-9 bg-red-500/10 text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 hover:bg-red-500/20 px-3 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all shadow-inner flex items-center gap-1.5 ml-auto xl:ml-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Old
          </button>
        </div>
      </div>

      <PremiumGlassCard accentColor="crm-primary" className="!p-0 overflow-hidden bg-black/60 border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: 160 }} />
              <col style={{ width: 100 }} />
              <col style={{ width: 180 }} />
              <col />
              <col style={{ width: 70 }} />
              <col style={{ width: 70 }} />
            </colgroup>
            <thead>
              <tr className="border-b border-white/10 bg-black/40">
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest font-bold text-gray-500">Timestamp</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest font-bold text-gray-500">Level</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest font-bold text-gray-500">Path</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest font-bold text-gray-500">Message</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest font-bold text-gray-500 text-center">Status</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest font-bold text-gray-500 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-500 font-mono">
                    <div className="animate-pulse flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-[12px]">Querying logs...</p>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-500 font-mono">
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle className="w-8 h-8 text-gray-600" />
                      <p className="text-[12px]">No logs found matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr 
                    key={log.id} 
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3 font-mono text-[11px] text-gray-400 whitespace-nowrap overflow-hidden text-ellipsis">
                      {new Date(log.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border shadow-inner ${getLevelColor(log.level)}`}>
                        {log.level}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-gray-300 overflow-hidden text-ellipsis whitespace-nowrap">
                      {log.path || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-200 font-mono text-[11px] overflow-hidden text-ellipsis whitespace-nowrap">
                      {log.message}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button 
                        onClick={(e) => toggleResolved(log.id, log.isResolved, e)}
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full transition-all ${
                          log.isResolved 
                            ? 'text-green-400 bg-green-400/10 hover:bg-green-400/20' 
                            : 'text-gray-500 bg-white/5 hover:bg-white/10 hover:text-white'
                        }`}
                        title={log.isResolved ? "Mark as Unresolved" : "Mark as Resolved"}
                      >
                        {log.isResolved ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-white transition-colors">
                        View
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-white/10 bg-black/40 flex justify-between items-center">
            <button 
              onClick={() => {
                if (cursorStack.length > 0) {
                  const newStack = [...cursorStack];
                  const prevCursor = newStack.pop() || null;
                  setCursorStack(newStack);
                  setCurrentCursor(prevCursor);
                  setPage(p => p - 1);
                } else {
                  setCurrentCursor(null);
                  setPage(1);
                }
              }}
              disabled={page === 1}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[12px] font-bold text-white disabled:opacity-30 disabled:hover:bg-white/5 shadow-inner border border-white/10 transition-colors"
            >
              Previous
            </button>
            <span className="text-[12px] font-mono text-gray-400">
              Page <span className="text-white">{page}</span> of <span className="text-white">{totalPages}</span>
            </span>
            <button 
              onClick={() => {
                if (nextCursor) {
                  setCursorStack([...cursorStack, currentCursor || '']);
                  setCurrentCursor(nextCursor);
                  setPage(p => p + 1);
                }
              }}
              disabled={!nextCursor}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[12px] font-bold text-white disabled:opacity-30 disabled:hover:bg-white/5 shadow-inner border border-white/10 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </PremiumGlassCard>

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedLog(null)}>
          <div className="bg-[#0a0a0a] border border-white/10 shadow-2xl rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-white/10 flex justify-between items-start bg-white/5 shrink-0">
              <div className="pr-8">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <span className={`px-2.5 py-1 rounded text-[10px] font-black tracking-widest border shadow-inner ${getLevelColor(selectedLog.level)}`}>
                    {selectedLog.level}
                  </span>
                  <span className="font-mono text-[12px] text-gray-400 bg-black/30 px-2 py-1 rounded border border-white/5">
                    {new Date(selectedLog.createdAt).toLocaleString()}
                  </span>
                  <button
                    onClick={() => toggleResolved(selectedLog.id, selectedLog.isResolved)}
                    className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border transition-all flex items-center gap-1.5 ${
                      selectedLog.isResolved
                        ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'
                        : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {selectedLog.isResolved ? (
                      <><CheckCircle className="w-3.5 h-3.5" /> Resolved</>
                    ) : (
                      <><XCircle className="w-3.5 h-3.5" /> Mark Resolved</>
                    )}
                  </button>
                </div>
                <h3 className="text-lg font-mono text-white break-all leading-relaxed">{selectedLog.message}</h3>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-gray-500 hover:text-white text-3xl leading-none transition-colors absolute top-6 right-6">×</button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-[10px] uppercase tracking-widest font-black text-gray-500 mb-2">Path / Context</h4>
                  <div className="bg-black/50 p-3 rounded-lg border border-white/5 font-mono text-[12px] text-gray-300 break-all shadow-inner">
                    {selectedLog.path || '-'}
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] uppercase tracking-widest font-black text-gray-500 mb-2">Log ID</h4>
                  <div className="bg-black/50 p-3 rounded-lg border border-white/5 font-mono text-[12px] text-gray-300 break-all shadow-inner select-all">
                    {selectedLog.id}
                  </div>
                </div>
              </div>
              
              {selectedLog.metadata && (
                <div>
                  <h4 className="text-[10px] uppercase tracking-widest font-black text-gray-500 mb-2">Metadata / Payload</h4>
                  <div className="bg-black/60 rounded-xl border border-white/5 overflow-hidden shadow-inner relative group">
                    <div className="absolute top-0 left-0 right-0 h-6 bg-white/5 border-b border-white/5 flex items-center px-3">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
                      </div>
                      <span className="ml-3 text-[9px] font-mono text-gray-500">json</span>
                    </div>
                    <pre className="p-4 pt-10 font-mono text-[12px] text-green-400 overflow-x-auto whitespace-pre-wrap break-all">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
