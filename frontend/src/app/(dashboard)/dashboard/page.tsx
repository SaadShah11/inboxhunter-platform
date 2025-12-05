"use client";

import { useEffect, useState } from "react";
import { 
  Bot, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp,
  Activity,
  Cpu,
  Download
} from "lucide-react";
import { users, agents } from "@/lib/api";
import { cn } from "@/lib/utils";

interface DashboardData {
  recentSignups: any[];
  recentTasks: any[];
  agents: any[];
  today: {
    total: number;
    successful: number;
    successRate: number;
  };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const { data: dashboardData } = await users.dashboard();
    if (dashboardData) {
      setData(dashboardData);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Bot className="h-8 w-8 animate-pulse text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your automation activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Today's Signups"
          value={data?.today?.total ?? 0}
          icon={<Activity className="h-5 w-5" />}
          color="blue"
        />
        <StatCard
          title="Successful"
          value={data?.today?.successful ?? 0}
          icon={<CheckCircle className="h-5 w-5" />}
          color="green"
        />
        <StatCard
          title="Success Rate"
          value={`${data?.today?.successRate ?? 0}%`}
          icon={<TrendingUp className="h-5 w-5" />}
          color="purple"
        />
        <StatCard
          title="Active Agents"
          value={Array.isArray(data?.agents) ? data.agents.filter(a => a.status === 'online' || a.status === 'busy').length : 0}
          icon={<Cpu className="h-5 w-5" />}
          color="orange"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Signups */}
        <div className="bg-card border rounded-xl">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold">Recent Signups</h2>
            <a href="/dashboard/signups" className="text-sm text-primary hover:underline">
              View all
            </a>
          </div>
          <div className="p-4">
            {!Array.isArray(data?.recentSignups) || data.recentSignups.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No signups yet. Start your first task!
              </p>
            ) : (
              <div className="space-y-3">
                {data.recentSignups.slice(0, 5).map((signup: any) => (
                  <div key={signup.id} className="flex items-center gap-3">
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center",
                      signup.status === 'success' ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                    )}>
                      {signup.status === 'success' ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{new URL(signup.url).hostname}</p>
                      <p className="text-xs text-muted-foreground">
                        {signup.platform || 'Unknown platform'}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(signup.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Agents */}
        <div className="bg-card border rounded-xl">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold">Your Agents</h2>
            <a href="/dashboard/agents" className="text-sm text-primary hover:underline">
              Manage
            </a>
          </div>
          <div className="p-4">
            {!Array.isArray(data?.agents) || data.agents.length === 0 ? (
              <div className="text-center py-8">
                <Download className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-3">No agents connected</p>
                <a
                  href="/dashboard/agents"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm hover:bg-primary/90 transition"
                >
                  <Download className="h-4 w-4" />
                  Add Agent
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                {data.agents.map((agent: any) => (
                  <div key={agent.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition">
                    <div className={cn(
                      "h-3 w-3 rounded-full",
                      agent.status === 'online' ? "bg-green-500" :
                      agent.status === 'busy' ? "bg-blue-500 animate-pulse" :
                      agent.status === 'error' ? "bg-red-500" :
                      "bg-gray-500"
                    )} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{agent.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {agent.status || 'unknown'}
                      </p>
                    </div>
                    {agent.lastSeenAt && (
                      <span className="text-xs text-muted-foreground">
                        {formatTime(agent.lastSeenAt)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: "blue" | "green" | "purple" | "orange";
}) {
  const colors = {
    blue: "bg-blue-500/10 text-blue-500",
    green: "bg-green-500/10 text-green-500",
    purple: "bg-purple-500/10 text-purple-500",
    orange: "bg-orange-500/10 text-orange-500",
  };

  return (
    <div className="bg-card border rounded-xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className={cn("p-2 rounded-lg", colors[color])}>
          {icon}
        </div>
        <span className="text-sm text-muted-foreground">{title}</span>
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

function formatTime(date: string) {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString();
}

