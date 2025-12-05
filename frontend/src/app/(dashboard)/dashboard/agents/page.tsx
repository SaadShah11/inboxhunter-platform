'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Cpu,
  Plus,
  Trash2,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  Copy,
  Check,
  Download,
  Loader2,
  RefreshCw,
  Settings2,
  Power,
  AlertCircle,
} from 'lucide-react';
import { agents as agentsApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '@/components/ui/modal';

interface Agent {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'busy' | 'error';
  version?: string;
  platform?: string;
  lastSeen: string;
  createdAt: string;
  taskStats?: {
    completed: number;
    failed: number;
    total: number;
  };
}

export default function AgentsPage() {
  const { toast } = useToast();

  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [token, setToken] = useState('');
  const [generatingToken, setGeneratingToken] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    setLoading(true);
    const { data } = await agentsApi.list();
    if (data) {
      setAgents(Array.isArray(data) ? data : []);
    }
    setLoading(false);
  };

  const handleGenerateToken = async () => {
    setGeneratingToken(true);
    const { data, error } = await agentsApi.getRegistrationToken();

    if (data?.token) {
      setToken(data.token);
      setTokenModalOpen(true);
    } else {
      toast({ type: 'error', title: 'Failed to generate token', description: error });
    }
    setGeneratingToken(false);
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ type: 'success', title: 'Token copied to clipboard' });
  };

  const handleDeleteAgent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) return;

    const { error } = await agentsApi.delete(id);
    if (!error) {
      toast({ type: 'success', title: 'Agent deleted' });
      loadAgents();
    } else {
      toast({ type: 'error', title: 'Failed to delete agent', description: error });
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      online: { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', label: 'Online', dot: 'bg-emerald-500' },
      busy: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', label: 'Busy', dot: 'bg-amber-500 animate-pulse' },
      offline: { color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', label: 'Offline', dot: 'bg-gray-400' },
      error: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: 'Error', dot: 'bg-red-500' },
    };
    const { color, label, dot } = config[status as keyof typeof config] || config.offline;
    return (
      <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium', color)}>
        <span className={cn('w-2 h-2 rounded-full', dot)} />
        {label}
      </span>
    );
  };

  const onlineCount = agents.filter((a) => a.status === 'online' || a.status === 'busy').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Agents</h1>
          <p className="text-gray-500">Manage your automation agents</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={loadAgents} icon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
          <Button onClick={handleGenerateToken} loading={generatingToken} icon={<Plus className="w-4 h-4" />}>
            Add Agent
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
              <Cpu className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Agents</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{agents.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Online</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{onlineCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800">
              <Power className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Offline</p>
              <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{agents.length - onlineCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Agents List */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-gray-100 dark:border-gray-800">
          <CardTitle>Connected Agents</CardTitle>
          <CardDescription>View and manage your desktop agents</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : agents.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Cpu className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No agents yet</h3>
              <p className="text-gray-500 mb-4 max-w-sm mx-auto">
                Download and install the InboxHunter Agent on your computer to start automating signups.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/dashboard/download">
                  <Button icon={<Download className="w-4 h-4" />}>Download Agent</Button>
                </Link>
                <Button variant="secondary" onClick={handleGenerateToken} loading={generatingToken}>
                  Generate Token
                </Button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {agents.map((agent) => (
                <div key={agent.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <Cpu className="w-6 h-6 text-gray-500" />
                      </div>
                      <span
                        className={cn(
                          'absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-900',
                          agent.status === 'online' && 'bg-emerald-500',
                          agent.status === 'busy' && 'bg-amber-500 animate-pulse',
                          agent.status === 'offline' && 'bg-gray-400',
                          agent.status === 'error' && 'bg-red-500'
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{agent.name}</h3>
                        {getStatusBadge(agent.status)}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        {agent.platform && (
                          <span className="capitalize">{agent.platform}</span>
                        )}
                        {agent.version && (
                          <span>v{agent.version}</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Last seen {new Date(agent.lastSeen).toLocaleString()}
                        </span>
                      </div>
                      {agent.taskStats && (
                        <div className="flex items-center gap-4 mt-2 text-xs">
                          <span className="flex items-center gap-1 text-emerald-600">
                            <CheckCircle className="w-3.5 h-3.5" />
                            {agent.taskStats.completed} completed
                          </span>
                          <span className="flex items-center gap-1 text-red-500">
                            <XCircle className="w-3.5 h-3.5" />
                            {agent.taskStats.failed} failed
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeleteAgent(agent.id)}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors text-gray-400 hover:text-red-600"
                        title="Delete agent"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Token Modal */}
      <Modal open={tokenModalOpen} onOpenChange={setTokenModalOpen}>
        <ModalContent>
          <ModalHeader onClose={() => setTokenModalOpen(false)}>
            <ModalTitle>Agent Registration Token</ModalTitle>
            <ModalDescription>Use this token to connect a new agent</ModalDescription>
          </ModalHeader>
          <ModalBody className="space-y-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-700 dark:text-amber-400">Keep this token secure</p>
                  <p className="text-amber-600 dark:text-amber-500 mt-1">
                    This token will only be shown once. It expires in 24 hours.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Registration Token
              </label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={token}
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 font-mono text-sm"
                />
                <button
                  onClick={handleCopyToken}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="text-sm text-gray-500">
              <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">How to use:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Download the InboxHunter Agent for your platform</li>
                <li>Run the agent and paste this token when prompted</li>
                <li>The agent will connect automatically</li>
              </ol>
            </div>
          </ModalBody>
          <ModalFooter>
            <Link href="/dashboard/download">
              <Button variant="secondary" icon={<Download className="w-4 h-4" />}>
                Download Agent
              </Button>
            </Link>
            <Button onClick={handleCopyToken} icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}>
              {copied ? 'Copied!' : 'Copy Token'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
