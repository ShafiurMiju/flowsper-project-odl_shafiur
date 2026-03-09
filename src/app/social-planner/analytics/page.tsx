// src/app/social-planner/analytics/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp,
  Users,
  Eye,
  MessageSquare,
  Heart,
  BarChart3,
  RefreshCw,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Pin,
  AlertCircle,
  Send,
  ThumbsUp,
  Info,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';

interface SocialAccount {
  id: string;
  profileId: string;
  name: string;
  avatar: string;
  platform: string;
  type: string;
  expire: string;
  isExpired: boolean;
  hasStatisticsPermissions: boolean;
  buildingStatistics: boolean;
}

interface StatisticsData {
  totals: {
    posts: number;
    likes: number;
    followers: number;
    impressions: number;
    comments: number;
  };
  breakdowns: {
    posts: {
      total: number;
      totalChange: number;
      platforms: Record<string, { value: number; change: number }>;
    };
    impressions: {
      total: number;
      totalChange: string;
      platforms: Record<string, { value: number; change: string }>;
    };
    reach: {
      total: number;
      totalChange: string;
      platforms: Record<string, { value: number; change: string }>;
    };
    engagement: Record<string, {
      likes: number;
      comments: number;
      shares?: number;
      change: number;
    }>;
  };
  platformTotals: {
    impressions: Record<string, { total: number; series: number[] }>;
    followers: Record<string, { total: number; series: number[] }>;
    likes: Record<string, { total: number; series: number[] }>;
  };
  dayRange: string[];
}

const platformIcons = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube,
  pinterest: Pin,
};

const platformColors = {
  facebook: 'text-blue-600',
  instagram: 'text-pink-600',
  linkedin: 'text-blue-700',
  youtube: 'text-red-600',
  pinterest: 'text-red-500',
};

export default function AnalyticsPage() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch social media accounts
  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/social-media/accounts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || 'pit-7e6fb007-d3bc-40a0-8780-8b9314830558'}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch accounts');

      const data = await response.json();
      const accountsList = data.results?.accounts || [];
      setAccounts(accountsList);
      
      // Select all accounts by default
      const allAccountIds = new Set<string>(accountsList.map((acc: SocialAccount) => acc.id));
      setSelectedAccounts(allAccountIds);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast.error('Failed to load social media accounts');
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics for selected accounts
  const fetchStatistics = async () => {
    if (selectedAccounts.size === 0) {
      toast.error('Please select at least one account');
      return;
    }

    setStatsLoading(true);
    try {
      const selectedAccountsList = accounts.filter(acc => selectedAccounts.has(acc.id));
      const profileIds = selectedAccountsList
        .filter(account => account.hasStatisticsPermissions && !account.buildingStatistics)
        .map(account => account.profileId);

      const platforms = [...new Set(selectedAccountsList.map(account => account.platform))];

      if (profileIds.length === 0) {
        toast.error('No selected accounts have statistics permissions');
        setStatsLoading(false);
        return;
      }

      const response = await fetch('/api/social-media/statistics', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || 'pit-7e6fb007-d3bc-40a0-8780-8b9314830558'}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileIds,
          platforms,
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch statistics');

      const data = await response.json();
      setStatistics(data.results);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      toast.error('Failed to load statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccounts.size > 0) {
      fetchStatistics();
    }
  }, [selectedAccounts]);

  const toggleAccount = (accountId: string) => {
    const newSelected = new Set(selectedAccounts);
    if (newSelected.has(accountId)) {
      newSelected.delete(accountId);
    } else {
      newSelected.add(accountId);
    }
    setSelectedAccounts(newSelected);
  };

  const toggleAllAccounts = () => {
    if (selectedAccounts.size === accounts.length) {
      setSelectedAccounts(new Set());
    } else {
      setSelectedAccounts(new Set(accounts.map(acc => acc.id)));
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(2) + 'K';
    }
    return num.toString();
  };

  const filteredAccounts = accounts.filter(acc =>
    acc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex gap-6 p-6">
        <div className="w-80">
          <Card>
            <CardContent className="p-4">
              <Skeleton className="h-8 w-full mb-4" />
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full mb-2" />
              ))}
            </CardContent>
          </Card>
        </div>
        <div className="flex-1">
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 p-6">
      {/* Left Sidebar - Account Selector */}
      <div className="w-80 shrink-0">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 mb-3">
              {accounts.map((account, index) => {
                const Icon = platformIcons[account.platform as keyof typeof platformIcons] || BarChart3;
                return (
                  <div key={account.id} className="relative">
                    <img
                      src={account.avatar}
                      alt={account.name}
                      className="w-8 h-8 rounded-full"
                      style={{ marginLeft: index > 0 ? '-8px' : '0' }}
                    />
                    <div className="absolute -bottom-1 -right-1 p-0.5 bg-white rounded-full">
                      <Icon className={`w-2.5 h-2.5 ${platformColors[account.platform as keyof typeof platformColors]}`} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* All Accounts Toggle */}
            <div className="px-4 py-3 border-b">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-medium text-muted-foreground">ALL ACCOUNTS</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleAllAccounts}
                    className="text-xs text-primary hover:underline"
                  >
                    {selectedAccounts.size === accounts.length ? 'Unselect All' : 'Select All'}
                  </button>
                  <input
                    type="checkbox"
                    checked={selectedAccounts.size === accounts.length}
                    onChange={toggleAllAccounts}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                </div>
              </label>
            </div>

            {/* Account List */}
            <div className="max-h-[calc(100vh-350px)] overflow-y-auto">
              {filteredAccounts.map((account) => {
                const Icon = platformIcons[account.platform as keyof typeof platformIcons] || BarChart3;
                const isSelected = selectedAccounts.has(account.id);

                return (
                  <div
                    key={account.id}
                    className={`px-4 py-3 border-b hover:bg-accent cursor-pointer ${isSelected ? 'bg-accent/50' : ''}`}
                    onClick={() => toggleAccount(account.id)}
                  >
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <div className="relative">
                        <img
                          src={account.avatar}
                          alt={account.name}
                          className="w-10 h-10 rounded-full"
                        />
                        <div className="absolute -bottom-1 -right-1 p-1 bg-white rounded-full border">
                          <Icon className={`w-3 h-3 ${platformColors[account.platform as keyof typeof platformColors]}`} />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{account.name}</p>
                        {!account.hasStatisticsPermissions && (
                          <p className="text-xs text-muted-foreground">No statistics permissions</p>
                        )}
                      </div>
                    </label>
                  </div>
                );
              })}
            </div>

            {filteredAccounts.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No accounts found
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Side - Statistics Dashboard */}
      <div className="flex-1 min-w-0">
        {statsLoading ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          </div>
        ) : statistics ? (
          <>
            {/* Top Metrics */}
            <div className="grid gap-4 md:grid-cols-5 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Send className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Number of Posts</span>
                    <Info className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <p className="text-3xl font-bold">{statistics.totals.posts}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ThumbsUp className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Total Likes</span>
                    <Info className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <p className="text-3xl font-bold">{statistics.totals.likes}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Total Followers</span>
                    <Info className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <p className="text-3xl font-bold">{statistics.totals.followers}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Total Impressions</span>
                    <Info className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <p className="text-3xl font-bold">{formatNumber(statistics.totals.impressions)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Total Comments</span>
                    <Info className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <p className="text-3xl font-bold">{statistics.totals.comments}</p>
                </CardContent>
              </Card>
            </div>

            {/* Platform Legend */}
            <div className="mb-4">
              <div className="flex items-center gap-4 text-xs">
                {Object.keys(statistics.platformTotals.impressions || {}).map((platform) => {
                  const Icon = platformIcons[platform as keyof typeof platformIcons] || BarChart3;
                  return (
                    <div key={platform} className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${platformColors[platform as keyof typeof platformColors]?.replace('text-', 'bg-')}`}></div>
                      <Icon className={`w-3.5 h-3.5 ${platformColors[platform as keyof typeof platformColors]}`} />
                      <span className="capitalize">{platform}</span>
                    </div>
                  );
                })}
                {/* Additional platforms */}
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                  <Pin className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Pinterest</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <span>GBP</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                  <span>Bluesky</span>
                </div>
              </div>
            </div>

            {/* Performance Chart */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium">Performance</CardTitle>
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Chart Placeholder */}
                <div className="h-64 flex items-center justify-center border border-dashed rounded-lg">
                  <div className="text-center text-muted-foreground">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Chart will display {statistics.dayRange.length} days of data</p>
                    <p className="text-xs mt-1">
                      {statistics.dayRange[0]} - {statistics.dayRange[statistics.dayRange.length - 1]}
                    </p>
                  </div>
                </div>

                {/* Platform Breakdown */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                  {Object.entries(statistics.platformTotals.impressions || {}).map(([platform, data]) => {
                    const Icon = platformIcons[platform as keyof typeof platformIcons] || BarChart3;
                    return (
                      <div key={platform} className="border rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className={`w-4 h-4 ${platformColors[platform as keyof typeof platformColors]}`} />
                          <span className="text-sm font-medium capitalize">{platform}</span>
                        </div>
                        <p className="text-2xl font-bold">{formatNumber(data.total)}</p>
                        <p className="text-xs text-muted-foreground">impressions</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">
                {selectedAccounts.size === 0 ? 'Select Accounts' : 'No Statistics Available'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {selectedAccounts.size === 0
                  ? 'Please select at least one account to view statistics'
                  : 'Statistics are being calculated for your selected accounts'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}