'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Target,
  Activity,
  RefreshCw,
  Settings,
  LogOut,
  Building2,
  ChevronDown,
  MessageCircle,
} from 'lucide-react';
import { useAuth } from '@/context';
import { useState } from 'react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/contacts', label: 'Contacts', icon: Users },
  { href: '/opportunities', label: 'Opportunities', icon: Target },
  { href: '/conversations', label: 'Conversations', icon: MessageCircle },
  { href: '/activity', label: 'Activity Log', icon: Activity },
];

const adminNavItems = [
  { href: '/admin/sub-accounts', label: 'Sub-Accounts', icon: Building2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, logout, activeSubAccount, subAccounts, switchSubAccount, isLoading } = useAuth();
  const [showSubAccountDropdown, setShowSubAccountDropdown] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // Don't render sidebar if not logged in
  if (isLoading || !user) {
    return (
      <aside className="fixed left-0 top-0 h-full w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <RefreshCw className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Flowsper</h1>
              <p className="text-xs text-gray-400">Loading...</p>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-gray-900 text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Flowsper</h1>
            <p className="text-xs text-gray-400">
              {isAdmin ? 'Agency Mode' : activeSubAccount?.name || 'CRM'}
            </p>
          </div>
        </div>
      </div>

      {/* Sub-Account Switcher (Admin only) */}
      {isAdmin && (
        <div className="p-4 border-b border-gray-800">
          <div className="relative">
            <button
              onClick={() => setShowSubAccountDropdown(!showSubAccountDropdown)}
              className="w-full flex items-center justify-between px-3 py-2 bg-gray-800 rounded-lg text-sm hover:bg-gray-700 transition-colors"
            >
              <span className="truncate">
                {activeSubAccount ? activeSubAccount.name : 'All Sub-Accounts'}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showSubAccountDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showSubAccountDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                <button
                  onClick={() => {
                    switchSubAccount(null);
                    setShowSubAccountDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 ${!activeSubAccount ? 'bg-blue-600' : ''}`}
                >
                  All Sub-Accounts
                </button>
                {subAccounts.map((sa) => (
                  <button
                    key={sa.id}
                    onClick={() => {
                      switchSubAccount(sa.id);
                      setShowSubAccountDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 truncate ${activeSubAccount?.id === sa.id ? 'bg-blue-600' : ''}`}
                  >
                    {sa.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Admin Section */}
        {isAdmin && (
          <>
            <div className="mt-6 mb-2 px-4">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Admin
              </span>
            </div>
            <ul className="space-y-1">
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium">
              {user.email?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.profile?.full_name || user.email}</p>
            <p className="text-xs text-gray-400 capitalize">{user.profile?.role || 'User'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
