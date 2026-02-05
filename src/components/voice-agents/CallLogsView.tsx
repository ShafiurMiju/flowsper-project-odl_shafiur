'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button, Card, Select, Modal } from '@/components/ui';
import { GHLVoiceCallLog, GHLVoiceAgent } from '@/types';
import { 
  RefreshCw, 
  Phone, 
  MessageSquare, 
  ChevronLeft,
  ChevronRight,
  FileText,
  Copy,
  ThumbsUp,
  ThumbsDown,
  TrendingUp
} from 'lucide-react';

interface CallLogsViewProps {
  agents: GHLVoiceAgent[];
}

export function CallLogsView({ agents }: CallLogsViewProps) {
  const [callLogs, setCallLogs] = useState<GHLVoiceCallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [selectedCallLog, setSelectedCallLog] = useState<GHLVoiceCallLog | null>(null);
  const [callType, setCallType] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('30');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const fetchCallLogs = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      
      if (selectedAgentId) {
        params.append('agentId', selectedAgentId);
      }
      
      if (callType) {
        params.append('callType', callType);
      }

      if (dateRange) {
        const endDate = Date.now();
        const startDate = endDate - (parseInt(dateRange) * 24 * 60 * 60 * 1000);
        params.append('startDate', startDate.toString());
        params.append('endDate', endDate.toString());
      }

      const res = await fetch(`/api/voice-agents/call-logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCallLogs(data.callLogs || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Error fetching call logs:', error);
    } finally {
      setLoading(false);
    }
  }, [page, selectedAgentId, callType, dateRange]);

  useEffect(() => {
    fetchCallLogs();
  }, [fetchCallLogs]);

  const stats = useMemo(() => {
    const totalDuration = callLogs.reduce((acc, log) => acc + (log.duration || 0), 0);
    const avgDuration = callLogs.length > 0 ? totalDuration / callLogs.length : 0;
    
    return {
      totalDuration: Math.round(totalDuration / 60),
      avgDuration: (avgDuration / 60).toFixed(1),
    };
  }, [callLogs]);

  const formatDuration = (seconds: number): string => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getAgentName = (agentId: string): string => {
    const agent = agents.find(a => a.id === agentId);
    return agent?.agentName || 'Unknown Agent';
  };

  const parseTranscript = (transcript: string): { role: 'ai' | 'user'; content: string }[] => {
    if (!transcript) return [];
    
    const messages: { role: 'ai' | 'user'; content: string }[] = [];
    const lines = transcript.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (lowerLine.startsWith('ai:') || lowerLine.startsWith('assistant:') || lowerLine.startsWith('bot:')) {
        messages.push({ role: 'ai', content: line.replace(/^(ai|assistant|bot):\s*/i, '') });
      } else if (lowerLine.startsWith('user:') || lowerLine.startsWith('caller:') || lowerLine.startsWith('customer:')) {
        messages.push({ role: 'user', content: line.replace(/^(user|caller|customer):\s*/i, '') });
      } else {
        const lastRole = messages.length > 0 ? messages[messages.length - 1].role : 'user';
        messages.push({ role: lastRole === 'ai' ? 'user' : 'ai', content: line });
      }
    }
    
    return messages;
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Total Duration</p>
            <p className="text-3xl font-semibold text-gray-900">{stats.totalDuration} Mins</p>
          </div>
          <div className="mt-3 flex items-center text-sm text-green-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>100% vs last month</span>
          </div>
        </Card>
        
        <Card className="p-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Average Call Duration</p>
            <p className="text-3xl font-semibold text-gray-900">{stats.avgDuration} Mins</p>
          </div>
          <div className="mt-3 flex items-center text-sm text-green-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>100% vs last month</span>
          </div>
        </Card>

        <Card className="p-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Total Calls</p>
            <p className="text-3xl font-semibold text-gray-900">{total}</p>
          </div>
          <div className="mt-3 flex items-center text-sm text-green-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>Active calls tracked</span>
          </div>
        </Card>

        <Card className="p-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Active Agents</p>
            <p className="text-3xl font-semibold text-gray-900">{agents.length}</p>
          </div>
          <div className="mt-3 flex items-center text-sm text-green-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>Voice agents available</span>
          </div>
        </Card>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={fetchCallLogs} className="h-9">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={dateRange}
            onChange={(e) => {
              setDateRange(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '7', label: '7 Days' },
              { value: '14', label: '14 Days' },
              { value: '30', label: '30 Days' },
              { value: '90', label: '90 Days' },
              { value: '', label: 'All Time' },
            ]}
            className="min-w-[120px]"
          />
          
          <Select
            value={callType}
            onChange={(e) => {
              setCallType(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All Calls' },
              { value: 'LIVE', label: 'Live' },
              { value: 'TRIAL', label: 'Trial' },
            ]}
            className="min-w-[100px]"
          />
          
          <Select
            value={selectedAgentId}
            onChange={(e) => {
              setSelectedAgentId(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All Agents' },
              ...agents.map(a => ({ value: a.id, label: a.agentName })),
            ]}
            className="min-w-[150px]"
          />
        </div>
      </div>

      {/* Call Logs Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
            <p className="mt-4 text-gray-600">Loading call logs...</p>
          </div>
        ) : callLogs.length === 0 ? (
          <div className="p-12 text-center">
            <Phone className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No call logs found</h3>
            <p className="text-gray-500 mt-2">Call logs will appear here once calls are made.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Agent Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      From Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      To Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date/Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions Triggered
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {callLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {log.isAgentDeleted ? (
                            <span className="text-gray-400 italic">Deleted</span>
                          ) : (
                            getAgentName(log.agentId)
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {log.contactId ? `Contact (${log.contactId.slice(0, 6)}...)` : log.fromNumber || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{log.fromNumber || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{log.fromNumber || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(log.createdAt)}</div>
                        <div className="text-xs text-gray-500">{formatTime(log.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDuration(log.duration)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {log.executedCallActions?.length > 0 
                            ? `${log.executedCallActions.length} action${log.executedCallActions.length > 1 ? 's' : ''}`
                            : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="secondary"
                            onClick={() => setSelectedCallLog(log)}
                            className="h-8 text-xs px-3 inline-flex items-center gap-1.5"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            Summary
                          </Button>
                          <button
                            onClick={() => setSelectedCallLog(log)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                            title="View Transcript"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigator.clipboard.writeText(log.transcript || '')}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                            title="Copy Transcript"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                            title="Good Call"
                          >
                            <ThumbsUp className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Bad Call"
                          >
                            <ThumbsDown className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
              <p className="text-sm text-gray-600">
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} results
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="secondary"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-8 px-3"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-1 mx-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-8 h-8 text-sm rounded ${
                          page === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <Button
                  variant="secondary"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="h-8 px-3"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Transcript Modal */}
      <Modal
        isOpen={!!selectedCallLog}
        onClose={() => setSelectedCallLog(null)}
        title="Transcript"
        size="2xl"
      >
        {selectedCallLog && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Your conversation with AI</p>
            
            {/* Chat-style transcript */}
            <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2">
              {parseTranscript(selectedCallLog.transcript).length > 0 ? (
                parseTranscript(selectedCallLog.transcript).map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-2' : ''}`}>
                      {msg.role === 'ai' && (
                        <div className="flex items-center gap-1 mb-1">
                          <span className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                            AI
                          </span>
                        </div>
                      )}
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm ${
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white rounded-br-md'
                            : 'bg-gray-100 text-gray-800 rounded-bl-md'
                        }`}
                      >
                        {msg.content}
                      </div>
                      {msg.role === 'user' && (
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className="text-xs text-gray-500">You</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500 text-sm">No transcript available</p>
                </div>
              )}
            </div>

            {/* Call Summary Section */}
            {selectedCallLog.summary && (
              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Call Summary
                </h4>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                  {selectedCallLog.summary}
                </p>
              </div>
            )}

            {/* Actions Executed */}
            {selectedCallLog.executedCallActions?.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Actions Executed</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCallLog.executedCallActions.map((action, idx) => (
                    <span
                      key={idx}
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        action.success 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {action.name}
                      {action.success ? ' ✓' : ' ✗'}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Extracted Data */}
            {selectedCallLog.extractedData && Object.keys(selectedCallLog.extractedData).length > 0 && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Extracted Data</h4>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <pre className="text-xs text-gray-700 overflow-x-auto">
                    {JSON.stringify(selectedCallLog.extractedData, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
