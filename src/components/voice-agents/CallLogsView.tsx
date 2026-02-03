'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Card, CardHeader, Select, Modal } from '@/components/ui';
import { GHLVoiceCallLog, GHLVoiceAgent } from '@/types';
import { RefreshCw, Phone, Clock, MessageSquare, ChevronRight, Filter } from 'lucide-react';

interface CallLogsViewProps {
  agents: GHLVoiceAgent[];
}

export function CallLogsView({ agents }: CallLogsViewProps) {
  const [callLogs, setCallLogs] = useState<GHLVoiceCallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [selectedCallLog, setSelectedCallLog] = useState<GHLVoiceCallLog | null>(null);
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
  }, [page, selectedAgentId]);

  useEffect(() => {
    fetchCallLogs();
  }, [fetchCallLogs]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  const getAgentName = (agentId: string): string => {
    const agent = agents.find(a => a.id === agentId);
    return agent?.agentName || 'Unknown Agent';
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="px-6 flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">Filter by agent:</span>
          </div>
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
          />
          <Button variant="secondary" onClick={fetchCallLogs}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </Card>

      {/* Call Logs Table */}
      <Card padding="none">
        <div className="p-6 border-b">
          <CardHeader
            title={`Call Logs (${total})`}
            description="View call history and transcripts"
          />
        </div>

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
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Agent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      From Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions Executed
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {callLogs.map((log) => (
                    <tr 
                      key={log.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedCallLog(log)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(log.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {log.isAgentDeleted ? (
                            <span className="text-gray-400 italic">Deleted Agent</span>
                          ) : (
                            getAgentName(log.agentId)
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{log.fromNumber || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Clock className="w-4 h-4 mr-1 text-gray-400" />
                          {formatDuration(log.duration)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          log.trialCall ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {log.trialCall ? 'Trial' : 'Live'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {log.executedCallActions?.slice(0, 3).map((action, idx) => (
                            <span
                              key={idx}
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                action.success ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {action.name}
                            </span>
                          ))}
                          {(log.executedCallActions?.length || 0) > 3 && (
                            <span className="text-xs text-gray-500">
                              +{(log.executedCallActions?.length || 0) - 3} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Call Log Detail Modal */}
      <Modal
        isOpen={!!selectedCallLog}
        onClose={() => setSelectedCallLog(null)}
        title="Call Details"
      >
        {selectedCallLog && (
          <div className="space-y-6">
            {/* Call Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Date & Time</p>
                <p className="text-gray-900">{formatDate(selectedCallLog.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="text-gray-900">{formatDuration(selectedCallLog.duration)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">From Number</p>
                <p className="text-gray-900">{selectedCallLog.fromNumber || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Call Type</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  selectedCallLog.trialCall ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                }`}>
                  {selectedCallLog.trialCall ? 'Trial' : 'Live'}
                </span>
              </div>
            </div>

            {/* Summary */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Call Summary
              </h4>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                {selectedCallLog.summary || 'No summary available'}
              </p>
            </div>

            {/* Actions Executed */}
            {selectedCallLog.executedCallActions?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Actions Executed</h4>
                <div className="space-y-2">
                  {selectedCallLog.executedCallActions.map((action, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-2 rounded-lg ${
                        action.success ? 'bg-green-50' : 'bg-red-50'
                      }`}
                    >
                      <span className="text-sm text-gray-900">{action.name}</span>
                      <span className={`text-xs font-medium ${
                        action.success ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {action.success ? 'Success' : 'Failed'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transcript */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Transcript</h4>
              <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg max-h-60 overflow-y-auto whitespace-pre-wrap">
                {selectedCallLog.transcript || 'No transcript available'}
              </div>
            </div>

            {/* Extracted Data */}
            {selectedCallLog.extractedData && Object.keys(selectedCallLog.extractedData).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Extracted Data</h4>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <pre className="text-sm text-gray-700 overflow-x-auto">
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
