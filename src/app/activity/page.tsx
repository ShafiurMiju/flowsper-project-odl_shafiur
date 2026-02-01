'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, Button, Select } from '@/components/ui';
import { DBActivityLog } from '@/types';
import { RefreshCw, Users, Target, Plus, Edit2, Trash2, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const actionIcons = {
  create: Plus,
  update: Edit2,
  delete: Trash2,
  sync: RefreshCw,
  move: ArrowRight,
};

const actionColors = {
  create: 'bg-green-100 text-green-600',
  update: 'bg-blue-100 text-blue-600',
  delete: 'bg-red-100 text-red-600',
  sync: 'bg-purple-100 text-purple-600',
  move: 'bg-orange-100 text-orange-600',
};

export default function ActivityPage() {
  const [logs, setLogs] = useState<DBActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const url =
        filter === 'all'
          ? '/api/activity?limit=100'
          : `/api/activity?limit=100&entityType=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
          <p className="text-gray-600 mt-1">
            Track all changes to contacts and opportunities
          </p>
        </div>
        <Button variant="secondary" onClick={fetchLogs} loading={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filter */}
      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <Select
            label="Filter by type"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Activities' },
              { value: 'contact', label: 'Contacts Only' },
              { value: 'opportunity', label: 'Opportunities Only' },
            ]}
            className="max-w-xs"
          />
        </div>
      </Card>

      {/* Activity List */}
      <Card padding="none">
        <div className="p-6 border-b">
          <CardHeader
            title={`Activity History (${logs.length})`}
            description="Recent actions performed in the system"
          />
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 mx-auto text-gray-400 animate-spin" />
            <p className="mt-4 text-gray-600">Loading activity logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-600">
              No activity logs yet. Perform some actions to see them here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {logs.map((log) => {
              const Icon = actionIcons[log.action] || RefreshCw;
              const colorClass = actionColors[log.action] || 'bg-gray-100 text-gray-600';
              const EntityIcon = log.entity_type === 'contact' ? Users : Target;

              return (
                <div
                  key={log.id}
                  className="p-4 flex items-start gap-4 hover:bg-gray-50"
                >
                  <div className={`p-2 rounded-lg ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 capitalize">
                        {log.action}
                      </span>
                      <span className="text-gray-400">•</span>
                      <div className="flex items-center gap-1 text-gray-600">
                        <EntityIcon className="w-3 h-3" />
                        <span className="capitalize text-sm">
                          {log.entity_type}
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-700 mt-1 truncate">
                      {log.entity_name || log.entity_id}
                    </p>

                    {log.details && (
                      <p className="text-sm text-gray-500 mt-1">
                        {JSON.stringify(log.details)}
                      </p>
                    )}
                  </div>

                  <div className="text-sm text-gray-500 whitespace-nowrap">
                    {formatDistanceToNow(new Date(log.created_at), {
                      addSuffix: true,
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
