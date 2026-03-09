// src/app/social-planner/layout.tsx

import { Metadata } from 'next';
import Link from 'next/link';
import {
  FileText,
  Plus,
  FolderOpen,
  Tag,
  Users,
  MessageSquare,
  TrendingUp,
  BarChart3
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Social Planner - GHL V2',
  description: 'Manage your social media posts across all platforms',
};

const navigation = [
  { name: 'Overview', href: '/social-planner', icon: TrendingUp },
  { name: 'Accounts', href: '/social-planner/accounts', icon: Users },
  { name: 'Create Post', href: '/social-planner/create', icon: Plus },
  { name: 'Posts', href: '/social-planner/posts', icon: MessageSquare },
  { name: 'Analytics', href: '/social-planner/analytics', icon: TrendingUp },
  { name: 'Reports', href: '/social-planner/reports', icon: BarChart3 },
  { name: 'Categories', href: '/social-planner/categories', icon: FolderOpen },
  { name: 'Tags', href: '/social-planner/tags', icon: Tag },
  { name: 'CSV Upload', href: '/social-planner/csv', icon: FileText },
];

export default function SocialPlannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      {/* Sub-navigation tabs */}
      <div className="border-b">
        <nav className="flex gap-1 overflow-x-auto pb-px">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground border-b-2 border-transparent hover:text-foreground hover:border-border transition-colors whitespace-nowrap"
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      {children}
    </div>
  );
}