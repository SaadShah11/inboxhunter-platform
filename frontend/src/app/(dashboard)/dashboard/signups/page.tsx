'use client';

import { useEffect, useState } from 'react';
import {
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Play,
  Link as LinkIcon,
  Mail,
  BarChart3,
  Globe,
  TrendingUp,
} from 'lucide-react';
import { scrapedLinks, signups as signupsApi, agents as agentsApi, credentials as credentialsApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '@/components/ui/modal';
import { useRealtimeStore } from '@/lib/realtime-store';
import { addWebSocketListener, removeWebSocketListener } from '@/lib/websocket';

interface PendingLink {
  id: string;
  url: string;
  domain: string;
  advertiserName?: string;
}

interface Signup {
  id: string;
  url: string;
  domain?: string;
  status: string;
  errorMessage?: string;
  completedAt?: string;
  createdAt: string;
}

interface Agent {
  id: string;
  name: string;
  status: string;
}

interface Credential {
  id: string;
  name: string;
  email: string;
  isDefault: boolean;
}

type Tab = 'run' | 'history';

export default function SignupsPage() {
  const { toast } = useToast();
  const { addLog, addTask, openTaskModal, connected } = useRealtimeStore();

  const [activeTab, setActiveTab] = useState<Tab>('run');
  const [loading, setLoading] = useState(true);

  // Run tab data
  const [pendingLinks, setPendingLinks] = useState<PendingLink[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [selectedCredential, setSelectedCredential] = useState('');

  // History tab data
  const [signupHistory, setSignupHistory] = useState<Signup[]>([]);
  const [historyStats, setHistoryStats] = useState({ total: 0, successful: 0, failed: 0, rate: 0 });

  // Custom URL modal
  const [customUrlModalOpen, setCustomUrlModalOpen] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [customRunning, setCustomRunning] = useState(false);

  // Batch signup modal
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchRunning, setBatchRunning] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  // Listen for task completion
  useEffect(() => {
    const handleTaskCompleted = (data: any) => {
      console.log('[Signups] Task completed, refreshing data:', data);
      if (data.success) {
        toast({
          type: 'success',
          title: 'Signup Complete!',
          description: 'Form was filled successfully',
        });
      } else if (data.error) {
        toast({
          type: 'error',
          title: 'Signup Failed',
          description: data.error,
        });
      }
      // Refresh data immediately
      loadData();
      // Reset all running states
      setCustomRunning(false);
      setBatchRunning(false);
    };

    const handleTaskStarted = (data: any) => {
      console.log('[Signups] Task started:', data);
    };

    addWebSocketListener('task:completed', handleTaskCompleted);
    addWebSocketListener('task:started', handleTaskStarted);
    
    return () => {
      removeWebSocketListener('task:completed', handleTaskCompleted);
      removeWebSocketListener('task:started', handleTaskStarted);
    };
  }, [toast]);

  const loadData = async () => {
    setLoading(true);
    const [pendingRes, agentsRes, credRes] = await Promise.all([
      scrapedLinks.pending(),
      agentsApi.list(),
      credentialsApi.list(),
    ]);

    if (pendingRes.data) setPendingLinks(Array.isArray(pendingRes.data) ? pendingRes.data : []);
    if (agentsRes.data) setAgents(Array.isArray(agentsRes.data) ? agentsRes.data : []);
    if (credRes.data) setCredentials(Array.isArray(credRes.data) ? credRes.data : []);

    if (activeTab === 'history') {
      const [historyRes, statsRes] = await Promise.all([
        signupsApi.list({ limit: 100 }),
        signupsApi.stats(30),
      ]);
      if (historyRes.data?.signups) setSignupHistory(historyRes.data.signups);
      if (statsRes.data) {
        setHistoryStats({
          total: statsRes.data.total || 0,
          successful: statsRes.data.successful || 0,
          failed: statsRes.data.failed || 0,
          rate: statsRes.data.successRate || 0,
        });
      }
    }

    setLoading(false);
  };

  const onlineAgents = agents.filter((a) => a.status === 'online' || a.status === 'busy');

  const handleStartSingleSignup = async (linkId: string, url: string) => {
    // Create task in store and open modal
    const taskId = `signup-${Date.now()}`;
    addTask({
      id: taskId,
      type: 'signup',
      status: 'running',
      url,
      startedAt: new Date(),
    });
    openTaskModal(taskId);
    addLog({ level: 'info', message: `Starting signup for: ${url}` });

    const { data, error } = await scrapedLinks.startSignupSingle(
      linkId,
      selectedAgent || undefined,
      selectedCredential || undefined
    );

    if (data?.success) {
      toast({ type: 'info', title: 'Signup Started', description: 'Agent is filling the form...' });
      addLog({ level: 'success', message: 'Signup task sent to agent' });
    } else {
      toast({ type: 'error', title: 'Failed', description: error || 'Could not start signup' });
      addLog({ level: 'error', message: error || 'Failed to start signup' });
    }
  };

  const handleStartAllSignups = async () => {
    setBatchRunning(true);

    // Create task in store and open modal
    const taskId = `batch-signup-${Date.now()}`;
    addTask({
      id: taskId,
      type: 'signup',
      status: 'running',
      startedAt: new Date(),
    });
    openTaskModal(taskId);
    addLog({ level: 'info', message: `Starting batch signup for ${pendingLinks.length} links...` });

    const { data, error } = await scrapedLinks.startSignupAll(
      selectedAgent || undefined,
      selectedCredential || undefined
    );

    if (data?.success) {
      toast({
        type: 'info',
        title: 'Batch Signup Started',
        description: `Processing ${pendingLinks.length} pending links`,
      });
      addLog({ level: 'success', message: 'Batch signup started successfully' });
      setBatchModalOpen(false);
    } else {
      toast({ type: 'error', title: 'Failed', description: error || 'Could not start batch signup' });
      addLog({ level: 'error', message: error || 'Failed to start batch signup' });
    }
    setBatchRunning(false);
  };

  const handleCustomSignup = async () => {
    if (!customUrl.trim()) return;

    setCustomRunning(true);

    // Create task in store and open modal
    const taskId = `custom-signup-${Date.now()}`;
    addTask({
      id: taskId,
      type: 'signup',
      status: 'running',
      url: customUrl,
      startedAt: new Date(),
    });
    openTaskModal(taskId);
    addLog({ level: 'info', message: `Starting signup for custom URL: ${customUrl}` });

    const { data, error } = await scrapedLinks.addCustomLink(
      customUrl,
      true,
      selectedAgent || undefined,
      selectedCredential || undefined
    );

    if (data?.success) {
      toast({ type: 'info', title: 'Signup Started', description: 'Processing custom URL' });
      addLog({ level: 'success', message: 'Custom signup task sent to agent' });
      setCustomUrlModalOpen(false);
      setCustomUrl('');
    } else {
      toast({ type: 'error', title: 'Failed', description: error || 'Could not start signup' });
      addLog({ level: 'error', message: error || 'Failed to start custom signup' });
    }
    setCustomRunning(false);
  };

  const getStatusBadge = (status: string) => {
    const config = {
      success: {
        icon: CheckCircle,
        color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        label: 'Success',
      },
      failed: {
        icon: XCircle,
        color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        label: 'Failed',
      },
      pending: {
        icon: Clock,
        color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        label: 'Pending',
      },
      running: {
        icon: Loader2,
        color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        label: 'Running',
      },
    };
    const { icon: Icon, color, label } = config[status as keyof typeof config] || config.pending;
    const isRunning = status === 'running';
    return (
      <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium', color)}>
        <Icon className={cn('w-3.5 h-3.5', isRunning && 'animate-spin')} />
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Signups</h1>
          <p className="text-gray-500">Automate form submissions on scraped pages</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={loadData}
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Warning if no online agents */}
      {onlineAgents.length === 0 && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-700 dark:text-amber-400">No agents online</p>
                <p className="text-sm text-amber-600 dark:text-amber-500">
                  Start your desktop agent to run signup automation.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connection Status */}
      {!connected && (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Loader2 className="w-5 h-5 text-blue-500 flex-shrink-0 animate-spin mt-0.5" />
              <div>
                <p className="font-medium text-blue-700 dark:text-blue-400">Connecting to live updates...</p>
                <p className="text-sm text-blue-600 dark:text-blue-500">
                  You'll see real-time logs when connected.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
        {[
          { id: 'run' as const, label: 'Run Signups', icon: Zap },
          { id: 'history' as const, label: 'History', icon: BarChart3 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium transition-colors -mb-px',
              activeTab === tab.id
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Run Tab */}
      {activeTab === 'run' && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => setCustomUrlModalOpen(true)}
                  disabled={onlineAgents.length === 0}
                  icon={<LinkIcon className="w-4 h-4" />}
                >
                  Signup Custom URL
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => setBatchModalOpen(true)}
                  disabled={onlineAgents.length === 0 || pendingLinks.length === 0}
                  icon={<Play className="w-4 h-4" />}
                >
                  Run All ({pendingLinks.length})
                </Button>
              </CardContent>
            </Card>

            {/* Agent & Credential Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Settings</CardTitle>
                <CardDescription>Configure agent and credentials for signups</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Agent
                  </label>
                  <select
                    value={selectedAgent}
                    onChange={(e) => setSelectedAgent(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Auto-select</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id} disabled={agent.status !== 'online'}>
                        {agent.name} ({agent.status})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Credential
                  </label>
                  <select
                    value={selectedCredential}
                    onChange={(e) => setSelectedCredential(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Use default</option>
                    {credentials.map((cred) => (
                      <option key={cred.id} value={cred.id}>
                        {cred.name} ({cred.email})
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Links */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <CardHeader className="border-b border-gray-100 dark:border-gray-800">
                <CardTitle>Pending Links</CardTitle>
                <CardDescription>Links waiting to be signed up</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : pendingLinks.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      All caught up!
                    </h3>
                    <p className="text-gray-500">No pending links to sign up</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {pendingLinks.map((link) => (
                      <div
                        key={link.id}
                        className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-gray-900 dark:text-white hover:text-indigo-600 transition-colors font-medium"
                          >
                            {link.domain || 'Unknown'}
                            <ExternalLink className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          </a>
                          {link.advertiserName && (
                            <p className="text-sm text-gray-500 truncate">{link.advertiserName}</p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleStartSingleSignup(link.id, link.url)}
                          disabled={onlineAgents.length === 0}
                          icon={<Zap className="w-4 h-4" />}
                        >
                          Run
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <p className="text-sm text-gray-500 mb-1">Total Signups</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{historyStats.total}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-500 mb-1">Successful</p>
              <p className="text-3xl font-bold text-emerald-500">{historyStats.successful}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-500 mb-1">Failed</p>
              <p className="text-3xl font-bold text-red-500">{historyStats.failed}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-500 mb-1">Success Rate</p>
              <div className="flex items-center gap-2">
                <p className="text-3xl font-bold text-indigo-500">{historyStats.rate}%</p>
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
            </Card>
          </div>

          {/* History Table */}
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-gray-100 dark:border-gray-800">
              <CardTitle>Signup History</CardTitle>
              <CardDescription>Recent signup attempts and results</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : signupHistory.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Mail className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No signups yet
                  </h3>
                  <p className="text-gray-500">Start running signups to see history here</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                        <th className="p-3 text-left text-xs font-semibold text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="p-3 text-left text-xs font-semibold text-gray-500 uppercase">
                          Website
                        </th>
                        <th className="p-3 text-left text-xs font-semibold text-gray-500 uppercase">
                          Date
                        </th>
                        <th className="p-3 text-left text-xs font-semibold text-gray-500 uppercase">
                          Error
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {signupHistory.map((signup) => (
                        <tr
                          key={signup.id}
                          className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                        >
                          <td className="p-3">{getStatusBadge(signup.status)}</td>
                          <td className="p-3">
                            <a
                              href={signup.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-gray-900 dark:text-white hover:text-indigo-600 transition-colors font-medium"
                            >
                              {signup.domain || new URL(signup.url).hostname}
                              <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                            </a>
                          </td>
                          <td className="p-3 text-sm text-gray-500">
                            {new Date(signup.createdAt).toLocaleString()}
                          </td>
                          <td className="p-3 text-sm text-red-500 max-w-xs truncate">
                            {signup.errorMessage || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Custom URL Modal */}
      <Modal open={customUrlModalOpen} onOpenChange={setCustomUrlModalOpen}>
        <ModalContent>
          <ModalHeader onClose={() => setCustomUrlModalOpen(false)}>
            <ModalTitle>Signup Custom URL</ModalTitle>
            <ModalDescription>Enter a landing page URL to sign up</ModalDescription>
          </ModalHeader>
          <ModalBody className="space-y-4">
            <Input
              label="Landing Page URL"
              type="url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://example.com/landing-page"
              icon={<Globe className="w-5 h-5" />}
            />

            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-400">
              <p className="font-medium mb-1">Live Console</p>
              <p className="text-blue-600 dark:text-blue-500">
                When you start, you'll see real-time logs from the agent as it fills the form.
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setCustomUrlModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCustomSignup} loading={customRunning} disabled={!customUrl.trim()}>
              <Zap className="w-4 h-4 mr-2" />
              Start Signup
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Batch Signup Modal */}
      <Modal open={batchModalOpen} onOpenChange={setBatchModalOpen}>
        <ModalContent>
          <ModalHeader onClose={() => setBatchModalOpen(false)}>
            <ModalTitle>Run All Signups</ModalTitle>
            <ModalDescription>Process all {pendingLinks.length} pending links</ModalDescription>
          </ModalHeader>
          <ModalBody>
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-700 dark:text-amber-400">
                    This will run sequentially
                  </p>
                  <p className="text-amber-600 dark:text-amber-500 mt-1">
                    The agent will process each link one by one. This may take several minutes depending
                    on the number of links.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-400">
              <p className="font-medium mb-1">Live Progress</p>
              <p className="text-blue-600 dark:text-blue-500">
                Watch real-time progress in the console window that opens automatically.
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setBatchModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStartAllSignups} loading={batchRunning}>
              <Play className="w-4 h-4 mr-2" />
              Start All ({pendingLinks.length})
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
