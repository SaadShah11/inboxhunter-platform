'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Cpu,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Zap,
  Activity,
  TrendingUp,
  ExternalLink,
  Bot,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { users, agents as agentsApi, scrapedLinks } from '@/lib/api';
import { useDashboardStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent, StatCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { stats, setStats, agents, setAgents, recentSignups, setRecentSignups } = useDashboardStore();
  const [loading, setLoading] = useState(true);
  const [linkStats, setLinkStats] = useState({ total: 0, pending: 0, signedUp: 0 });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    const [dashRes, linkStatsRes] = await Promise.all([
      users.dashboard(),
      scrapedLinks.stats(),
    ]);

    if (dashRes.data) {
      setStats(dashRes.data.today || {});
      setAgents(Array.isArray(dashRes.data.agents) ? dashRes.data.agents : []);
      setRecentSignups(Array.isArray(dashRes.data.recentSignups) ? dashRes.data.recentSignups : []);
    }
    if (linkStatsRes.data) {
      setLinkStats(linkStatsRes.data);
    }
    setLoading(false);
  };

  const onlineAgents = agents.filter((a) => a.status === 'online' || a.status === 'busy');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500">Overview of your automation activity</p>
        </div>
        <Button variant="secondary" size="sm" onClick={loadDashboard} icon={<RefreshCw className="w-4 h-4" />}>
          Refresh
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Signups"
          value={stats?.total ?? 0}
          change={`${stats?.successful ?? 0} successful`}
          changeType="positive"
          icon={<CheckCircle className="w-6 h-6" />}
          iconBg="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          title="Success Rate"
          value={`${stats?.successRate ?? 0}%`}
          change="Last 24 hours"
          changeType="neutral"
          icon={<TrendingUp className="w-6 h-6" />}
          iconBg="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
        />
        <StatCard
          title="Scraped Links"
          value={linkStats.total}
          change={`${linkStats.pending} pending`}
          changeType="neutral"
          icon={<Search className="w-6 h-6" />}
          iconBg="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
        />
        <StatCard
          title="Online Agents"
          value={onlineAgents.length}
          change={`${agents.length} total`}
          changeType="neutral"
          icon={<Cpu className="w-6 h-6" />}
          iconBg="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/dashboard/scraper">
          <Card hover className="p-6 h-full">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                <Search className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">Scrape Links</h3>
                <p className="text-sm text-gray-500 mt-1">Find landing pages from Meta Ad Library</p>
                <div className="flex items-center gap-1 mt-3 text-sm font-medium text-purple-600 dark:text-purple-400">
                  Start scraping
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/dashboard/signups">
          <Card hover className="p-6 h-full">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                <Zap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">Run Signups</h3>
                <p className="text-sm text-gray-500 mt-1">Automate form submissions</p>
                <div className="flex items-center gap-1 mt-3 text-sm font-medium text-indigo-600 dark:text-indigo-400">
                  {linkStats.pending} links ready
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/dashboard/agents">
          <Card hover className="p-6 h-full">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                <Bot className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">Manage Agents</h3>
                <p className="text-sm text-gray-500 mt-1">View and configure agents</p>
                <div className="flex items-center gap-1 mt-3 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  {onlineAgents.length} online
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Agents Status */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <CardTitle>Agents</CardTitle>
              <Link
                href="/dashboard/agents"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {agents.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Cpu className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-500 mb-3">No agents connected</p>
                <Link href="/dashboard/download">
                  <Button size="sm">Download Agent</Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {agents.slice(0, 5).map((agent: any) => (
                  <div
                    key={agent.id}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    <div className="relative">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <Cpu className="w-5 h-5 text-gray-500" />
                      </div>
                      <span
                        className={cn(
                          'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900',
                          agent.status === 'online' && 'bg-emerald-500',
                          agent.status === 'busy' && 'bg-amber-500',
                          agent.status === 'offline' && 'bg-gray-400'
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white">{agent.name}</p>
                      <p className="text-sm text-gray-500 capitalize">{agent.status}</p>
                    </div>
                    {agent.status === 'busy' && (
                      <Activity className="w-5 h-5 text-amber-500 animate-pulse" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Signups */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <CardTitle>Recent Signups</CardTitle>
              <Link
                href="/dashboard/signups?tab=history"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentSignups.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-500">No signups yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {recentSignups.slice(0, 5).map((signup: any) => (
                  <div
                    key={signup.id}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    <div
                      className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center',
                        signup.status === 'success'
                          ? 'bg-emerald-100 dark:bg-emerald-900/30'
                          : 'bg-red-100 dark:bg-red-900/30'
                      )}
                    >
                      {signup.status === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <a
                        href={signup.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      >
                        {signup.domain || new URL(signup.url).hostname}
                        <ExternalLink className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      </a>
                      <p className="text-sm text-gray-500">
                        {new Date(signup.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
