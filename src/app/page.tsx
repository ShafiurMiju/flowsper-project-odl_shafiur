'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, Button, PageLoader, SkeletonCard } from '@/components/ui';
import { useAuth } from '@/context';
import {
  Users,
  Target,
  DollarSign,
  Activity,
  RefreshCw,
  TrendingUp,
  LayoutDashboard,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface DashboardStats {
  contactCount: number;
  opportunityCount: number;
  totalPipelineValue: number;
  recentActivities: number;
}

export default function DashboardPage() {
  const { user, isLoading: authLoading, activeSubAccount, isAdmin } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    contactCount: 0,
    opportunityCount: 0,
    totalPipelineValue: 0,
    recentActivities: 0,
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const fetchStats = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [contactsRes, opportunitiesRes, activityRes] = await Promise.all([
        fetch('/api/contacts?limit=1', { headers }),
        fetch('/api/opportunities?limit=100', { headers }),
        fetch('/api/activity?limit=10', { headers }),
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
    const token = localStorage.getItem('access_token');
    if (!token) return;

    setSyncing(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await Promise.all([
        fetch('/api/contacts/sync', { method: 'POST', headers }),
        fetch('/api/opportunities/sync', { method: 'POST', headers }),
      ]);
      await fetchStats();
    } catch (error) {
      console.error('Error syncing:', error);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user, activeSubAccount]);

  if (authLoading) {
    return <PageLoader message="Loading dashboard..." />;
  }

  if (!user) {
    return null;
  }

  const statCards = [
    {
      label: 'Total Contacts',
      value: stats.contactCount,
      icon: Users,
      href: '/contacts',
    },
    {
      label: 'Opportunities',
      value: stats.opportunityCount,
      icon: Target,
      href: '/opportunities',
    },
    {
      label: 'Pipeline Value',
      value: `$${stats.totalPipelineValue.toLocaleString()}`,
      icon: DollarSign,
      href: '/opportunities',
    },
    {
      label: 'Recent Activities',
      value: stats.recentActivities,
      icon: Activity,
      href: '/activity',
    },
  ];

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-foreground flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-background" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground text-sm">
                {isAdmin && !activeSubAccount
                  ? 'Overview of all sub-accounts'
                  : `Overview for ${activeSubAccount?.name || 'your account'}`}
              </p>
            </div>
          </div>
        </div>
        <Button 
          onClick={syncAll} 
          loading={syncing}
          className="gap-2"
        >
          <RefreshCw className={cn("w-4 h-4", syncing && "animate-spin")} />
          Sync All Data
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <SkeletonCard count={4} />
        ) : (
          statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.label} href={stat.href}>
                <Card className="group hover:border-foreground/30 transition-all duration-300 cursor-pointer hover:shadow-lg hover:-translate-y-1">
                  <div className="flex items-start justify-between p-6 pb-4">
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                      <p className="text-3xl font-bold text-foreground">
                        {stat.value}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-foreground">
                      <Icon className="w-5 h-5 text-background" />
                    </div>
                  </div>
                  <div className="px-6 py-4 flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors border-t border-border">
                    <span>View details</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </div>
                </Card>
              </Link>
            );
          })
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader
            title="Quick Actions"
            description="Common tasks you can perform"
          />
          <div className="p-6 pt-4">
            <div className="grid grid-cols-2 gap-3">
            <Link href="/contacts">
              <Button variant="secondary" className="w-full justify-start h-10">
                <Users className="w-4 h-4 mr-2" />
                Manage Contacts
              </Button>
            </Link>
            <Link href="/opportunities">
              <Button variant="secondary" className="w-full justify-start h-10">
                <Target className="w-4 h-4 mr-2" />
                View Opportunities
              </Button>
            </Link>
            <Link href="/activity">
              <Button variant="secondary" className="w-full justify-start h-10">
                <Activity className="w-4 h-4 mr-2" />
                Activity Log
              </Button>
            </Link>
            <Button
              variant="secondary"
              className="w-full justify-start h-10"
              onClick={syncAll}
              loading={syncing}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Sync Data
            </Button>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Integration Status"
            description="Connected services and their status"
          />
          <div className="p-6 pt-4">
            <div className="space-y-3">
            <div className="flex items-center justify-between p-5 bg-muted rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 bg-foreground/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground">GoHighLevel</p>
                  <p className="text-sm text-muted-foreground">CRM Data Source</p>
                </div>
              </div>
              <span className="px-4 py-2 bg-foreground text-background text-xs font-medium rounded-full whitespace-nowrap ml-4">
                Connected
              </span>
            </div>

            <div className="flex items-center justify-between p-5 bg-muted rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 bg-foreground/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-foreground"
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
                  <p className="font-medium text-foreground">Supabase</p>
                  <p className="text-sm text-muted-foreground">Database & Storage</p>
                </div>
              </div>
              <span className="px-4 py-2 bg-foreground text-background text-xs font-medium rounded-full whitespace-nowrap ml-4">
                Connected
              </span>
            </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
