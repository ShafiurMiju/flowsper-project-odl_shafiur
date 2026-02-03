'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, Button, Select, SkeletonCard } from '@/components/ui';
import { DBActivityLog } from '@/types';
import { RefreshCw, Users, Target, Plus, Edit2, Trash2, ArrowRight, Activity, Clock, Filter, LogIn, LogOut } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

const actionIcons: Record<string, LucideIcon> = {
  create: Plus,
  update: Edit2,
  delete: Trash2,
  sync: RefreshCw,
  move: ArrowRight,
  login: LogIn,
  logout: LogOut,
};

const actionColors: Record<string, string> = {
  create: 'bg-muted text-foreground',
  update: 'bg-muted text-foreground',
  delete: 'bg-muted text-foreground',
  sync: 'bg-muted text-foreground',
  move: 'bg-muted text-foreground',
  login: 'bg-muted text-foreground',
  logout: 'bg-muted text-foreground',
};

export default function ActivityPage() {
  const [logs, setLogs] = useState<DBActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const url =
        filter === 'all'
          ? '/api/activity?limit=100'
          : `/api/activity?limit=100&entityType=${filter}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-foreground rounded-xl flex items-center justify-center">
            <Activity className="w-6 h-6 text-background" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Activity Log</h1>
            <p className="text-muted-foreground">
              Track all changes to contacts and opportunities
            </p>
          </div>
        </div>
        <Button 
          variant="secondary" 
          onClick={fetchLogs} 
          loading={loading}
          className="gap-2"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Filter */}
      <Card className="border-border/50 shadow-sm">
        <div className="px-6 flex items-center gap-4">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <Select
            label=""
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Activities' },
              { value: 'contact', label: 'Contacts Only' },
              { value: 'opportunity', label: 'Opportunities Only' },
            ]}
            className="min-w-[180px]"
          />
        </div>
      </Card>

      {/* Activity List */}
      <Card padding="none" className="border-border/50 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border/50 bg-muted/30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">Activity History</h3>
              <p className="text-sm text-muted-foreground">
                {loading ? 'Loading...' : `${logs.length} recent actions`}
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-4 animate-pulse">
                <div className="w-10 h-10 bg-muted rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
                <div className="h-3 bg-muted rounded w-20" />
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No activity yet</h3>
            <p className="text-muted-foreground">
              Perform some actions to see them here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {logs.map((log) => {
              const Icon = actionIcons[log.action] || RefreshCw;
              const colorClass = actionColors[log.action] || 'bg-muted text-muted-foreground';
              const EntityIcon = log.entity_type === 'contact' ? Users : Target;

              return (
                <div
                  key={log.id}
                  className="p-4 flex items-start gap-4 hover:bg-muted/50 transition-colors"
                >
                  <div className={cn("p-2.5 rounded-xl", colorClass)}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground capitalize">
                        {log.action}
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-muted/50 rounded-full">
                        <EntityIcon className="w-3 h-3 text-muted-foreground" />
                        <span className="capitalize text-xs text-muted-foreground">
                          {log.entity_type}
                        </span>
                      </div>
                    </div>

                    <p className="text-foreground mt-1 truncate">
                      {log.entity_name || log.entity_id}
                    </p>

                    {log.details && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                        {JSON.stringify(log.details)}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                    <Clock className="w-3 h-3" />
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
