'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Search,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Globe,
  CheckSquare,
  Square,
  Filter,
} from 'lucide-react';
import { scrapedLinks, agents as agentsApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '@/components/ui/modal';
import { useRealtimeStore } from '@/lib/realtime-store';
import { addWebSocketListener, removeWebSocketListener } from '@/lib/websocket';

interface ScrapedLink {
  id: string;
  url: string;
  domain: string;
  title?: string;
  advertiserName?: string;
  source: string;
  status: string;
  searchKeyword?: string;
  lastError?: string;
  createdAt: string;
}

interface Agent {
  id: string;
  name: string;
  status: string;
}

export default function ScraperPage() {
  const { toast } = useToast();
  const { addLog, addTask, openTaskModal, connected } = useRealtimeStore();

  const [links, setLinks] = useState<ScrapedLink[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, signedUp: 0, failed: 0 });

  // Selection
  const [selectedLinks, setSelectedLinks] = useState<Set<string>>(new Set());

  // Scrape form
  const [scrapeKeywords, setScrapeKeywords] = useState('');
  const [scrapeLimit, setScrapeLimit] = useState(50);
  const [scraping, setScraping] = useState(false);
  const [scrapeModalOpen, setScrapeModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('');

  // Filter
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  // Listen for scrape completion and task completion
  useEffect(() => {
    const handleScrapeComplete = (data: any) => {
      toast({
        type: 'success',
        title: 'Scrape Complete!',
        description: `Found ${data.created || 0} new links (${data.duplicates || 0} duplicates)`,
      });
      // Auto-refresh data immediately
      loadData();
      // Reset scraping state
      setScraping(false);
    };

    const handleTaskCompleted = (data: any) => {
      // Refresh data when any task completes
      console.log('[Scraper] Task completed, refreshing data:', data);
      loadData();
      // Reset any loading states
      setScraping(false);
    };

    const handleTaskStarted = (data: any) => {
      console.log('[Scraper] Task started:', data);
    };

    addWebSocketListener('scrape:complete', handleScrapeComplete);
    addWebSocketListener('task:completed', handleTaskCompleted);
    addWebSocketListener('task:started', handleTaskStarted);
    
    return () => {
      removeWebSocketListener('scrape:complete', handleScrapeComplete);
      removeWebSocketListener('task:completed', handleTaskCompleted);
      removeWebSocketListener('task:started', handleTaskStarted);
    };
  }, [toast]);

  const loadData = async () => {
    setLoading(true);
    const [linksRes, agentsRes, statsRes] = await Promise.all([
      scrapedLinks.list(statusFilter || undefined),
      agentsApi.list(),
      scrapedLinks.stats(),
    ]);

    if (linksRes.data) setLinks(Array.isArray(linksRes.data) ? linksRes.data : []);
    if (agentsRes.data) setAgents(Array.isArray(agentsRes.data) ? agentsRes.data : []);
    if (statsRes.data) setStats(statsRes.data);
    setLoading(false);
  };

  const onlineAgents = agents.filter((a) => a.status === 'online' || a.status === 'busy');

  const handleStartScrape = async () => {
    if (!scrapeKeywords.trim()) return;

    setScraping(true);
    const keywords = scrapeKeywords
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k);

    // Create task in store and open modal
    const taskId = `scrape-${Date.now()}`;
    addTask({
      id: taskId,
      type: 'scrape',
      status: 'running',
      keywords,
      startedAt: new Date(),
    });
    openTaskModal(taskId);
    addLog({ level: 'info', message: `Starting scrape for keywords: ${keywords.join(', ')}` });

    const { data, error } = await scrapedLinks.startScrape(
      keywords,
      scrapeLimit,
      selectedAgent || undefined
    );

    if (data?.success) {
      toast({
        type: 'info',
        title: 'Scrape Started',
        description: `Agent is scraping Meta Ads for: ${keywords.join(', ')}`,
      });
      addLog({ level: 'success', message: 'Scrape task sent to agent successfully' });
      setScrapeModalOpen(false);
      setScrapeKeywords('');
    } else {
      toast({ type: 'error', title: 'Failed to Start Scrape', description: error || 'Could not start scrape' });
      addLog({ level: 'error', message: error || 'Failed to start scrape' });
    }
    setScraping(false);
  };

  const handleDeleteLink = async (id: string) => {
    await scrapedLinks.delete(id);
    toast({ type: 'info', title: 'Link Deleted' });
    loadData();
  };

  const handleDeleteAll = async () => {
    if (!confirm('Delete all links? This cannot be undone.')) return;
    await scrapedLinks.deleteAll();
    toast({ type: 'info', title: 'All Links Deleted' });
    loadData();
  };

  const handleDeleteSelected = async () => {
    for (const id of selectedLinks) {
      await scrapedLinks.delete(id);
    }
    toast({ type: 'info', title: `${selectedLinks.size} Links Deleted` });
    setSelectedLinks(new Set());
    loadData();
  };

  const toggleSelectLink = (id: string) => {
    const newSelected = new Set(selectedLinks);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedLinks(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedLinks.size === filteredLinks.length) setSelectedLinks(new Set());
    else setSelectedLinks(new Set(filteredLinks.map((l) => l.id)));
  };

  // Filter links by search query
  const filteredLinks = links.filter((link) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      link.domain?.toLowerCase().includes(query) ||
      link.url?.toLowerCase().includes(query) ||
      link.advertiserName?.toLowerCase().includes(query) ||
      link.searchKeyword?.toLowerCase().includes(query)
    );
  });

  const getStatusBadge = (status: string) => {
    const config = {
      signed_up: {
        icon: CheckCircle,
        color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        label: 'Signed Up',
      },
      failed: {
        icon: XCircle,
        color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        label: 'Failed',
      },
      skipped: {
        icon: XCircle,
        color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
        label: 'Skipped',
      },
      pending: {
        icon: Clock,
        color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        label: 'Pending',
      },
    };
    const { icon: Icon, color, label } = config[status as keyof typeof config] || config.pending;
    return (
      <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium', color)}>
        <Icon className="w-3.5 h-3.5" />
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Scraper</h1>
          <p className="text-gray-500">Find landing pages from Meta Ad Library</p>
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
          <Button
            onClick={() => setScrapeModalOpen(true)}
            disabled={onlineAgents.length === 0}
            icon={<Search className="w-4 h-4" />}
          >
            New Scrape
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
                  Start your desktop agent to scrape links.
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

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-500 mb-1">Total Scraped</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500 mb-1">Pending Signup</p>
          <p className="text-3xl font-bold text-amber-500">{stats.pending}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500 mb-1">Completed</p>
          <p className="text-3xl font-bold text-emerald-500">{stats.signedUp}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500 mb-1">Failed</p>
          <p className="text-3xl font-bold text-red-500">{stats.failed}</p>
        </Card>
      </div>

      {/* Links Table */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-gray-100 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Scraped Links</CardTitle>
              <CardDescription>Links extracted from Meta Ad Library</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search links..."
                  className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
                />
              </div>
              {/* Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="signed_up">Signed Up</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </CardHeader>

        {/* Toolbar */}
        {selectedLinks.size > 0 && (
          <div className="px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-800 flex items-center justify-between">
            <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
              {selectedLinks.size} link{selectedLinks.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={handleDeleteSelected}>
                <Trash2 className="w-4 h-4 mr-1" />
                Delete Selected
              </Button>
            </div>
          </div>
        )}

        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : filteredLinks.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Globe className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {searchQuery ? 'No matching links' : 'No links yet'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchQuery ? 'Try a different search term' : 'Start by scraping links from Meta Ad Library'}
              </p>
              {!searchQuery && (
                <Button onClick={() => setScrapeModalOpen(true)} disabled={onlineAgents.length === 0}>
                  <Search className="w-4 h-4 mr-2" />
                  Start Scraping
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    <th className="p-3 text-left w-12">
                      <button
                        onClick={toggleSelectAll}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                      >
                        {selectedLinks.size === filteredLinks.length ? (
                          <CheckSquare className="w-4 h-4 text-indigo-500" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </th>
                    <th className="p-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="p-3 text-left text-xs font-semibold text-gray-500 uppercase">Website</th>
                    <th className="p-3 text-left text-xs font-semibold text-gray-500 uppercase">Keyword</th>
                    <th className="p-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="p-3 text-left text-xs font-semibold text-gray-500 uppercase w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLinks.map((link) => (
                    <tr
                      key={link.id}
                      className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="p-3">
                        <button
                          onClick={() => toggleSelectLink(link.id)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                        >
                          {selectedLinks.has(link.id) ? (
                            <CheckSquare className="w-4 h-4 text-indigo-500" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </td>
                      <td className="p-3">{getStatusBadge(link.status)}</td>
                      <td className="p-3">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-gray-900 dark:text-white hover:text-indigo-600 transition-colors font-medium"
                        >
                          {link.domain || 'Unknown'}
                          <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                        </a>
                        {link.advertiserName && (
                          <p className="text-xs text-gray-500 mt-0.5">{link.advertiserName}</p>
                        )}
                      </td>
                      <td className="p-3 text-sm text-gray-500">{link.searchKeyword || '-'}</td>
                      <td className="p-3 text-sm text-gray-500">
                        {new Date(link.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleDeleteLink(link.id)}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors text-gray-400 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>

        {/* Footer */}
        {filteredLinks.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {filteredLinks.length} of {stats.total} links
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteAll}
              className="text-red-500 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete All
            </Button>
          </div>
        )}
      </Card>

      {/* Scrape Modal */}
      <Modal open={scrapeModalOpen} onOpenChange={setScrapeModalOpen}>
        <ModalContent>
          <ModalHeader onClose={() => setScrapeModalOpen(false)}>
            <ModalTitle>Scrape Meta Ad Library</ModalTitle>
            <ModalDescription>Search for ads and extract landing page URLs</ModalDescription>
          </ModalHeader>
          <ModalBody className="space-y-4">
            <Input
              label="Search Keywords"
              value={scrapeKeywords}
              onChange={(e) => setScrapeKeywords(e.target.value)}
              placeholder="marketing, funnel, coaching"
              hint="Separate multiple keywords with commas"
              icon={<Search className="w-5 h-5" />}
            />
            <Input
              label="Max Links to Scrape"
              type="number"
              value={scrapeLimit}
              onChange={(e) => setScrapeLimit(Number(e.target.value))}
              min={1}
              max={200}
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Agent</label>
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Auto-select available agent</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id} disabled={agent.status !== 'online'}>
                    {agent.name} ({agent.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-400">
              <p className="font-medium mb-1">Live Logs Enabled</p>
              <p className="text-blue-600 dark:text-blue-500">
                When you start scraping, a console window will open showing real-time progress from the agent.
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setScrapeModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStartScrape} loading={scraping} disabled={!scrapeKeywords.trim()}>
              <Search className="w-4 h-4 mr-2" />
              Start Scraping
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
