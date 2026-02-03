'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Target,
  Activity,
  LogOut,
  Building2,
  ChevronDown,
  MessageCircle,
  Bot,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react';
import { useAuth } from '@/context';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ThemeToggle } from '@/components/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/loader';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/contacts', label: 'Contacts', icon: Users },
  { href: '/opportunities', label: 'Opportunities', icon: Target },
  { href: '/conversations', label: 'Conversations', icon: MessageCircle },
  { href: '/voice-agents', label: 'AI Voice Agents', icon: Bot },
  { href: '/activity', label: 'Activity Log', icon: Activity },
];

const adminNavItems = [
  { href: '/admin/sub-accounts', label: 'Sub-Accounts', icon: Building2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, logout, activeSubAccount, subAccounts, switchSubAccount, isLoading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // Loading state
  if (isLoading || !user) {
    return (
      <aside className={cn(
        "fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border text-sidebar-foreground flex flex-col transition-all duration-300 ease-in-out z-40",
        collapsed ? "w-[70px]" : "w-64"
      )}>
        <div className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shrink-0">
            <Spinner size="sm" className="text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="animate-pulse">
              <div className="h-4 w-20 bg-muted rounded" />
              <div className="h-3 w-16 bg-muted rounded mt-1" />
            </div>
          )}
        </div>
      </aside>
    );
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside className={cn(
        "fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border text-sidebar-foreground flex flex-col transition-all duration-300 ease-in-out z-40",
        collapsed ? "w-[70px]" : "w-64"
      )}>
        {/* Logo */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-foreground rounded-xl flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-background" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <h1 className="font-bold text-lg tracking-tight">Flowsper</h1>
                <p className="text-xs text-muted-foreground truncate">
                  {isAdmin ? 'Agency Mode' : activeSubAccount?.name || 'CRM'}
                </p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 hidden lg:flex"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Sub-Account Switcher (Admin only) */}
        {isAdmin && (
          <div className="px-3 pb-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-between bg-sidebar-accent border-sidebar-border",
                    collapsed && "px-2"
                  )}
                >
                  {collapsed ? (
                    <Building2 className="h-4 w-4" />
                  ) : (
                    <>
                      <span className="truncate text-sm">
                        {activeSubAccount ? activeSubAccount.name : 'All Sub-Accounts'}
                      </span>
                      <ChevronDown className="w-4 h-4 shrink-0 opacity-50" />
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Switch Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => switchSubAccount(null)}
                  className="gap-2"
                >
                  {!activeSubAccount && <Check className="h-4 w-4" />}
                  {activeSubAccount && <div className="w-4" />}
                  All Sub-Accounts
                </DropdownMenuItem>
                {subAccounts.map((sa) => (
                  <DropdownMenuItem
                    key={sa.id}
                    onClick={() => switchSubAccount(sa.id)}
                    className="gap-2"
                  >
                    {activeSubAccount?.id === sa.id && <Check className="h-4 w-4" />}
                    {activeSubAccount?.id !== sa.id && <div className="w-4" />}
                    <span className="truncate">{sa.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        <Separator className="bg-sidebar-border" />

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              const linkContent = (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <Icon className={cn("w-5 h-5 shrink-0", isActive && "animate-pulse")} />
                  {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
                </Link>
              );

              return (
                <div key={item.href}>
                  {collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {linkContent}
                      </TooltipTrigger>
                      <TooltipContent side="right" sideOffset={10}>
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    linkContent
                  )}
                </div>
              );
            })}

            {/* Admin Section */}
            {isAdmin && (
              <>
                <div className={cn("pt-4 pb-2", collapsed ? "px-2" : "px-3")}>
                  {!collapsed ? (
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Admin
                    </span>
                  ) : (
                    <Separator className="bg-sidebar-border" />
                  )}
                </div>
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  const linkContent = (
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
                    </Link>
                  );

                  return (
                    <div key={item.href}>
                      {collapsed ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            {linkContent}
                          </TooltipTrigger>
                          <TooltipContent side="right" sideOffset={10}>
                            {item.label}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        linkContent
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </nav>
        </ScrollArea>

        <Separator className="bg-sidebar-border" />

        {/* Theme Toggle & User Info */}
        <div className="p-3 space-y-3">
          {/* Theme Toggle */}
          <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between px-2")}>
            {!collapsed && <span className="text-xs text-muted-foreground">Theme</span>}
            <ThemeToggle />
          </div>

          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full h-auto p-2 justify-start gap-3",
                  collapsed && "justify-center px-2"
                )}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-sm">
                    {user.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium truncate">
                      {user.profile?.full_name || user.email?.split('@')[0]}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                        {user.profile?.role || 'User'}
                      </Badge>
                    </div>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">
                    {user.profile?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </TooltipProvider>
  );
}
