// src/app/social-planner/reports/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart3,
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Users,
  Eye,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  // Mock data for demonstration
  const mockReports = [
    {
      id: 'engagement-report',
      title: 'Engagement Report',
      description: 'Detailed analysis of post engagement across all platforms',
      lastGenerated: '2024-02-10',
      status: 'ready',
      icon: TrendingUp,
    },
    {
      id: 'audience-report',
      title: 'Audience Insights',
      description: 'Demographics and audience growth analysis',
      lastGenerated: '2024-02-09',
      status: 'ready',
      icon: Users,
    },
    {
      id: 'performance-report',
      title: 'Performance Summary',
      description: 'Overall social media performance metrics',
      lastGenerated: '2024-02-08',
      status: 'ready',
      icon: BarChart3,
    },
    {
      id: 'content-report',
      title: 'Content Analysis',
      description: 'Analysis of content types and their performance',
      lastGenerated: '2024-02-07',
      status: 'generating',
      icon: FileText,
    },
  ];

  const generateReport = async (reportId: string) => {
    setLoading(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success(`Report "${reportId}" generated successfully!`);
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = (reportId: string) => {
    toast.success(`Downloading ${reportId} report...`);
    // Mock download
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate and download detailed social media reports
          </p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Report Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mockReports.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base">{report.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {report.description}
                </p>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Last generated: {report.lastGenerated}</span>
                  <Badge
                    variant={report.status === 'ready' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {report.status === 'ready' ? 'Ready' : 'Generating...'}
                  </Badge>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generateReport(report.id)}
                    disabled={loading || report.status === 'generating'}
                    className="flex-1"
                  >
                    <Calendar className="w-3 h-3 mr-1" />
                    Generate
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => downloadReport(report.id)}
                    disabled={report.status !== 'ready'}
                    className="flex-1"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Report History */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: 'Weekly Engagement Report', date: '2024-02-10', size: '2.4 MB' },
              { name: 'Monthly Performance Summary', date: '2024-02-01', size: '5.1 MB' },
              { name: 'Audience Growth Analysis', date: '2024-01-25', size: '1.8 MB' },
            ].map((report, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{report.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Generated on {report.date} • {report.size}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="ghost">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon Features */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Scheduled Reports</h4>
              <p className="text-sm text-muted-foreground">
                Automatically generate and email reports on a schedule
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Custom Dashboards</h4>
              <p className="text-sm text-muted-foreground">
                Create personalized dashboards with your favorite metrics
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}