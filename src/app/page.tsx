'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, Button } from '@/components/ui';
import {
  Users,
  Target,
  DollarSign,
  Activity,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  contactCount: number;
  opportunityCount: number;
  totalPipelineValue: number;
  recentActivities: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    contactCount: 0,
    opportunityCount: 0,
    totalPipelineValue: 0,
    recentActivities: 0,
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchStats = async () => {
    try {
      const [contactsRes, opportunitiesRes, activityRes] = await Promise.all([
        fetch('/api/contacts?limit=1'),
        fetch('/api/opportunities?limit=100'),
        fetch('/api/activity?limit=10'),
      ]);

      const contactsData = await contactsRes.json();
      const opportunitiesData = await opportunitiesRes.json();
      const activityData = await activityRes.json();

      const totalValue = (opportunitiesData.opportunities || []).reduce(
        (sum: number, opp: { monetaryValue?: number }) =>
          sum + (opp.monetaryValue || 0),
        0
      );

      setStats({
        contactCount: contactsData.meta?.total || contactsData.contacts?.length || 0,
        opportunityCount: opportunitiesData.opportunities?.length || 0,
        totalPipelineValue: totalValue,
        recentActivities: activityData.logs?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncAll = async () => {
    setSyncing(true);
    try {
      await Promise.all([
        fetch('/api/contacts/sync', { method: 'POST' }),
        fetch('/api/opportunities/sync', { method: 'POST' }),
      ]);
      await fetchStats();
    } catch (error) {
      console.error('Error syncing:', error);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const statCards = [
    {
      label: 'Total Contacts',
      value: stats.contactCount,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      href: '/contacts',
    },
    {
      label: 'Opportunities',
      value: stats.opportunityCount,
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      href: '/opportunities',
    },
    {
      label: 'Pipeline Value',
      value: `$${stats.totalPipelineValue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      href: '/opportunities',
    },
    {
      label: 'Recent Activities',
      value: stats.recentActivities,
      icon: Activity,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      href: '/activity',
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Overview of your GoHighLevel data synced with Supabase
          </p>
        </div>
        <Button onClick={syncAll} loading={syncing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          Sync All Data
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {loading ? '...' : stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader
            title="Quick Actions"
            description="Common tasks you can perform"
          />
          <div className="grid grid-cols-2 gap-4">
            <Link href="/contacts">
              <Button variant="secondary" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                Manage Contacts
              </Button>
            </Link>
            <Link href="/opportunities">
              <Button variant="secondary" className="w-full justify-start">
                <Target className="w-4 h-4 mr-2" />
                View Opportunities
              </Button>
            </Link>
            <Link href="/activity">
              <Button variant="secondary" className="w-full justify-start">
                <Activity className="w-4 h-4 mr-2" />
                Activity Log
              </Button>
            </Link>
            <Button
              variant="secondary"
              className="w-full justify-start"
              onClick={syncAll}
              loading={syncing}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Sync Data
            </Button>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Integration Status"
            description="Connected services and their status"
          />
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">GoHighLevel</p>
                  <p className="text-sm text-gray-500">CRM Data Source</p>
                </div>
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                Connected
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-emerald-600"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path
                      fillRule="evenodd"
                      d="M9 8a3 3 0 100 6 3 3 0 000-6zm-5 3a5 5 0 1110 0 5 5 0 01-10 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Supabase</p>
                  <p className="text-sm text-gray-500">Database & Storage</p>
                </div>
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                Connected
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
