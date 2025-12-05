'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Bot, 
  LayoutDashboard, 
  Cpu, 
  Search,
  Settings, 
  User,
  LogOut,
  Menu,
  X,
  Download,
  Bell,
  ChevronDown,
  Moon,
  Sun,
  Monitor,
  Zap,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { useThemeStore, getResolvedTheme } from '@/lib/theme-store';
import { useRealtimeStore } from '@/lib/realtime-store';
import { cn } from '@/lib/utils';
import { ToastProvider } from '@/components/ui/toast';
import { WebSocketProvider } from '@/components/websocket-provider';
import { TaskExecutionModal, TaskStatusIndicator } from '@/components/task-execution-modal';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/scraper', label: 'Scraper', icon: Search, description: 'Find landing pages' },
  { href: '/dashboard/signups', label: 'Signups', icon: Zap, description: 'Run & view signups' },
  { href: '/dashboard/agents', label: 'Agents', icon: Cpu, description: 'Manage agents' },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings, description: 'Account & preferences' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, clearAuth, isAuthenticated } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const { connected, activeTasks } = useRealtimeStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);

  const runningTasksCount = activeTasks.filter((t) => t.status === 'running').length;

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const resolvedTheme = getResolvedTheme(theme);

  return (
    <ToastProvider>
      <WebSocketProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      {/* Sidebar */}
      <aside
        className={cn(
              'fixed inset-y-0 left-0 w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-40 transition-transform duration-300 lg:translate-x-0',
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
            <div className="h-16 flex items-center gap-2.5 px-6 border-b border-gray-200 dark:border-gray-800">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg text-gray-900 dark:text-white">InboxHunter</span>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                  isActive
                        ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                )}
              >
                    <item.icon className={cn('h-5 w-5', isActive && 'text-indigo-500')} />
                    <div>
                      <span className={cn('font-medium', isActive && 'font-semibold')}>
                {item.label}
                      </span>
                      {item.description && (
                        <p className="text-xs text-gray-400 dark:text-gray-500">{item.description}</p>
                      )}
                    </div>
              </Link>
            );
          })}
        </nav>

            {/* Download Agent CTA */}
            <div className="px-4 py-4">
              <Link
                href="/dashboard/download"
                className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-200 dark:border-indigo-800 hover:from-indigo-500/20 hover:to-purple-500/20 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Download className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">Download Agent</p>
                  <p className="text-xs text-gray-500">Get the desktop app</p>
                </div>
              </Link>
            </div>

            {/* Connection Status */}
            <div className="px-4 py-2">
              <div
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-xl text-sm',
                  connected
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                )}
              >
                {connected ? (
                  <>
                    <Wifi className="w-4 h-4" />
                    <span>Live Updates Active</span>
                    {runningTasksCount > 0 && (
                      <span className="ml-auto px-1.5 py-0.5 bg-emerald-500 text-white text-xs rounded-full">
                        {runningTasksCount}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4" />
                    <span>Connecting...</span>
                  </>
                )}
              </div>
            </div>

            {/* User Section */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                  {user.name?.[0] || user.email[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user.name || user.email}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{user.plan} Plan</p>
            </div>
          </div>
        </div>
      </aside>

          {/* Mobile overlay */}
      {sidebarOpen && (
        <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

          {/* Main Content */}
          <div className="lg:ml-72">
            {/* Top Header */}
            <header className="sticky top-0 z-20 h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
              <div className="h-full px-4 lg:px-8 flex items-center justify-between">
                {/* Left side */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    {sidebarOpen ? (
                      <X className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                    ) : (
                      <Menu className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                    )}
                  </button>

                  {/* Page Title */}
                  <div className="hidden sm:block">
                    <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {navItems.find(
                        (item) =>
                          pathname === item.href ||
                          (item.href !== '/dashboard' && pathname.startsWith(item.href))
                      )?.label || 'Dashboard'}
                    </h1>
                  </div>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-2">
                  {/* Theme Toggle */}
                  <div className="relative">
                    <button
                      onClick={() => setThemeMenuOpen(!themeMenuOpen)}
                      className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      title="Change theme"
                    >
                      {resolvedTheme === 'dark' ? (
                        <Moon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      ) : (
                        <Sun className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      )}
                    </button>

                    {themeMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setThemeMenuOpen(false)} />
                        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                          <div className="p-1">
                            {[
                              { value: 'light', label: 'Light', icon: Sun },
                              { value: 'dark', label: 'Dark', icon: Moon },
                              { value: 'system', label: 'System', icon: Monitor },
                            ].map((option) => (
                              <button
                                key={option.value}
                                onClick={() => {
                                  setTheme(option.value as any);
                                  setThemeMenuOpen(false);
                                }}
                                className={cn(
                                  'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors',
                                  theme === option.value
                                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                )}
                              >
                                <option.icon className="h-4 w-4" />
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Notifications */}
                  <button className="relative p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full" />
                  </button>

                  {/* User Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                        {user.name?.[0] || user.email[0].toUpperCase()}
                      </div>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </button>

                    {userMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                          <div className="p-3 border-b border-gray-100 dark:border-gray-800">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {user.name || 'User'}
                            </p>
                            <p className="text-sm text-gray-500 truncate">{user.email}</p>
                          </div>
                          <div className="p-1">
                            <Link
                              href="/dashboard/settings"
                              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <User className="h-4 w-4" />
                              Account Settings
                            </Link>
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                            >
                              <LogOut className="h-4 w-4" />
                              Sign out
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </header>

            {/* Page Content */}
            <main className="p-6 lg:p-8">{children}</main>
          </div>

          {/* Task Execution Modal */}
          <TaskExecutionModal />

          {/* Floating Task Status Indicator */}
          <TaskStatusIndicator />
    </div>
      </WebSocketProvider>
    </ToastProvider>
  );
}
