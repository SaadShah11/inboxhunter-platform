"use client";

import { useEffect, useState } from "react";
import { 
  Play, 
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
  Zap,
  Link as LinkIcon,
  CheckSquare,
  Square
} from "lucide-react";
import { scrapedLinks, agents as agentsApi, credentials as credentialsApi } from "@/lib/api";
import { cn } from "@/lib/utils";

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
  signedUpAt?: string;
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

type TabType = 'scrape' | 'signup' | 'links';

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState<TabType>('links');
  const [links, setLinks] = useState<ScrapedLink[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [credentialsList, setCredentialsList] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, signedUp: 0, failed: 0 });
  
  // Selection
  const [selectedLinks, setSelectedLinks] = useState<Set<string>>(new Set());
  
  // Scrape form
  const [scrapeKeywords, setScrapeKeywords] = useState("marketing, funnel");
  const [scrapeLimit, setScrapeLimit] = useState(50);
  const [scraping, setScraping] = useState(false);
  
  // Signup form
  const [customUrl, setCustomUrl] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("");
  const [selectedCredential, setSelectedCredential] = useState("");
  const [signingUp, setSigningUp] = useState(false);
  
  // Filter
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    setLoading(true);
    const [linksRes, agentsRes, credsRes, statsRes] = await Promise.all([
      scrapedLinks.list(statusFilter || undefined),
      agentsApi.list(),
      credentialsApi.list(),
      scrapedLinks.stats(),
    ]);
    
    if (linksRes.data) {
      setLinks(Array.isArray(linksRes.data) ? linksRes.data : []);
    }
    if (agentsRes.data) {
      setAgents(Array.isArray(agentsRes.data) ? agentsRes.data : []);
    }
    if (credsRes.data) {
      setCredentialsList(Array.isArray(credsRes.data) ? credsRes.data : []);
    }
    if (statsRes.data) {
      setStats(statsRes.data);
    }
    setLoading(false);
  };

  const onlineAgents = agents.filter(a => a.status === 'online' || a.status === 'busy');
  const defaultCredential = credentialsList.find(c => c.isDefault);

  // ===== Scrape Functions =====
  const handleStartScrape = async () => {
    if (!scrapeKeywords.trim()) return;
    
    setScraping(true);
    const keywords = scrapeKeywords.split(',').map(k => k.trim()).filter(k => k);
    const { data, error } = await scrapedLinks.startScrape(keywords, scrapeLimit, selectedAgent || undefined);
    
    if (data?.success) {
      alert(`Scrape task sent to agent! Keywords: ${keywords.join(', ')}`);
    } else {
      alert(error || data?.error || 'Failed to start scrape');
    }
    setScraping(false);
  };

  // ===== Signup Functions =====
  const handleSignupSingle = async (linkId: string) => {
    setSigningUp(true);
    const { data, error } = await scrapedLinks.startSignupSingle(
      linkId,
      selectedAgent || undefined,
      selectedCredential || defaultCredential?.id
    );
    
    if (data?.success) {
      alert('Signup task sent to agent!');
      loadData();
    } else {
      alert(error || data?.error || 'Failed to start signup');
    }
    setSigningUp(false);
  };

  const handleSignupSelected = async () => {
    if (selectedLinks.size === 0) return;
    
    setSigningUp(true);
    const { data, error } = await scrapedLinks.startSignupSelected(
      Array.from(selectedLinks),
      selectedAgent || undefined,
      selectedCredential || defaultCredential?.id
    );
    
    if (data?.success) {
      alert(data.message || 'Signup tasks sent!');
      setSelectedLinks(new Set());
      loadData();
    } else {
      alert(error || data?.error || 'Failed to start signups');
    }
    setSigningUp(false);
  };

  const handleSignupAll = async () => {
    if (stats.pending === 0) {
      alert('No pending links to process');
      return;
    }
    
    if (!confirm(`Start signup for all ${stats.pending} pending links?`)) return;
    
    setSigningUp(true);
    const { data, error } = await scrapedLinks.startSignupAll(
      selectedAgent || undefined,
      selectedCredential || defaultCredential?.id
    );
    
    if (data?.success) {
      alert(data.message || 'Signup tasks sent!');
      loadData();
    } else {
      alert(error || data?.error || 'Failed to start signups');
    }
    setSigningUp(false);
  };

  const handleCustomUrlSignup = async () => {
    if (!customUrl.trim()) return;
    
    setSigningUp(true);
    const { data, error } = await scrapedLinks.addCustomLink(
      customUrl,
      true, // start signup immediately
      selectedAgent || undefined,
      selectedCredential || defaultCredential?.id
    );
    
    if (data?.link) {
      alert('Custom link added and signup started!');
      setCustomUrl('');
      loadData();
    } else {
      alert(error || 'Failed to add custom link');
    }
    setSigningUp(false);
  };

  // ===== Link Management =====
  const handleDeleteLink = async (id: string) => {
    if (!confirm('Delete this link?')) return;
    await scrapedLinks.delete(id);
    loadData();
  };

  const handleDeleteAll = async () => {
    if (!confirm('Delete ALL links? This cannot be undone.')) return;
    await scrapedLinks.deleteAll();
    loadData();
  };

  const toggleSelectLink = (id: string) => {
    const newSelected = new Set(selectedLinks);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedLinks(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedLinks.size === links.length) {
      setSelectedLinks(new Set());
    } else {
      setSelectedLinks(new Set(links.map(l => l.id)));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'signed_up':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'skipped':
        return <XCircle className="h-4 w-4 text-gray-400" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'signed_up': return 'bg-green-500/20 text-green-500';
      case 'failed': return 'bg-red-500/20 text-red-500';
      case 'skipped': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-yellow-500/20 text-yellow-500';
    }
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Automation</h1>
          <p className="text-muted-foreground">
            Scrape links and run signup automation
          </p>
        </div>
        <button
          onClick={loadData}
          className="p-2 hover:bg-secondary rounded-lg transition"
          title="Refresh"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      {/* Warning if no online agents */}
      {onlineAgents.length === 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-500">No agents online</p>
            <p className="text-sm text-muted-foreground">
              Start your desktop agent to run automation. Run: <code className="bg-secondary px-1 rounded">python main.py --console</code>
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Links</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">Pending</p>
          <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">Signed Up</p>
          <p className="text-2xl font-bold text-green-500">{stats.signedUp}</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">Failed</p>
          <p className="text-2xl font-bold text-red-500">{stats.failed}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b pb-2">
        <button
          onClick={() => setActiveTab('scrape')}
          className={cn(
            "px-4 py-2 rounded-lg flex items-center gap-2 transition",
            activeTab === 'scrape' ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
          )}
        >
          <Search className="h-4 w-4" />
          Scrape Links
        </button>
        <button
          onClick={() => setActiveTab('signup')}
          className={cn(
            "px-4 py-2 rounded-lg flex items-center gap-2 transition",
            activeTab === 'signup' ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
          )}
        >
          <Zap className="h-4 w-4" />
          Run Signup
        </button>
        <button
          onClick={() => setActiveTab('links')}
          className={cn(
            "px-4 py-2 rounded-lg flex items-center gap-2 transition",
            activeTab === 'links' ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
          )}
        >
          <LinkIcon className="h-4 w-4" />
          Saved Links ({stats.total})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'scrape' && (
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Scrape Meta Ad Library
          </h2>
          <p className="text-muted-foreground mb-6">
            Search the Meta Ad Library for ads and extract their landing page URLs.
          </p>

          <div className="space-y-4 max-w-xl">
            <div>
              <label className="block text-sm font-medium mb-2">Search Keywords</label>
              <input
                type="text"
                value={scrapeKeywords}
                onChange={(e) => setScrapeKeywords(e.target.value)}
                className="w-full px-4 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="marketing, funnel, coaching"
              />
              <p className="text-xs text-muted-foreground mt-1">Comma-separated keywords</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Max Links to Scrape</label>
              <input
                type="number"
                value={scrapeLimit}
                onChange={(e) => setScrapeLimit(Number(e.target.value))}
                className="w-full px-4 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                min={1}
                max={200}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Agent</label>
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="w-full px-4 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Auto-select available agent</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id} disabled={agent.status !== 'online'}>
                    {agent.name} ({agent.status})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleStartScrape}
              disabled={scraping || !scrapeKeywords.trim() || onlineAgents.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
            >
              {scraping ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
              Start Scraping
            </button>
          </div>
        </div>
      )}

      {activeTab === 'signup' && (
        <div className="space-y-6">
          {/* Custom URL Signup */}
          <div className="bg-card border rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Custom URL Signup
            </h2>
            <p className="text-muted-foreground mb-4">
              Enter a URL to sign up immediately without saving to your links.
            </p>

            <div className="flex gap-3 max-w-2xl">
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="flex-1 px-4 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="https://example.com/signup"
              />
              <button
                onClick={handleCustomUrlSignup}
                disabled={signingUp || !customUrl.trim() || onlineAgents.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
              >
                {signingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Signup Now
              </button>
            </div>
          </div>

          {/* Batch Signup */}
          <div className="bg-card border rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Batch Signup
            </h2>
            <p className="text-muted-foreground mb-4">
              Run signup automation on your saved links.
            </p>

            <div className="space-y-4 max-w-xl">
              <div>
                <label className="block text-sm font-medium mb-2">Agent</label>
                <select
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                  className="w-full px-4 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Auto-select available agent</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id} disabled={agent.status !== 'online'}>
                      {agent.name} ({agent.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Credential</label>
                <select
                  value={selectedCredential}
                  onChange={(e) => setSelectedCredential(e.target.value)}
                  className="w-full px-4 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Use default credential</option>
                  {credentialsList.map((cred) => (
                    <option key={cred.id} value={cred.id}>
                      {cred.name} ({cred.email}) {cred.isDefault && '★'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSignupAll}
                  disabled={signingUp || stats.pending === 0 || onlineAgents.length === 0}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  {signingUp ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
                  Signup All Pending ({stats.pending})
                </button>
                
                {selectedLinks.size > 0 && (
                  <button
                    onClick={handleSignupSelected}
                    disabled={signingUp || onlineAgents.length === 0}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {signingUp ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
                    Signup Selected ({selectedLinks.size})
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'links' && (
        <div className="bg-card border rounded-xl overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-background border rounded-lg text-sm"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="signed_up">Signed Up</option>
                <option value="failed">Failed</option>
                <option value="skipped">Skipped</option>
              </select>
              
              {selectedLinks.size > 0 && (
                <span className="text-sm text-muted-foreground">
                  {selectedLinks.size} selected
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {selectedLinks.size > 0 && (
                <button
                  onClick={handleSignupSelected}
                  disabled={signingUp || onlineAgents.length === 0}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition disabled:opacity-50"
                >
                  <Play className="h-4 w-4" />
                  Signup Selected
                </button>
              )}
              <button
                onClick={handleDeleteAll}
                className="flex items-center gap-2 px-3 py-2 text-red-500 hover:bg-red-500/10 rounded-lg text-sm transition"
              >
                <Trash2 className="h-4 w-4" />
                Delete All
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : links.length === 0 ? (
            <div className="p-12 text-center">
              <LinkIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No links yet</h3>
              <p className="text-muted-foreground mb-4">
                Scrape some links from Meta Ad Library or add custom URLs.
              </p>
              <button
                onClick={() => setActiveTab('scrape')}
                className="text-primary hover:underline"
              >
                Start scraping →
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b bg-secondary/30">
                  <th className="p-3 text-left w-10">
                    <button onClick={toggleSelectAll} className="p-1">
                      {selectedLinks.size === links.length ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th className="p-3 text-left font-medium">Status</th>
                  <th className="p-3 text-left font-medium">Website</th>
                  <th className="p-3 text-left font-medium">Source</th>
                  <th className="p-3 text-left font-medium">Date</th>
                  <th className="p-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {links.map((link) => (
                  <tr key={link.id} className="border-b last:border-0 hover:bg-secondary/20">
                    <td className="p-3">
                      <button onClick={() => toggleSelectLink(link.id)} className="p-1">
                        {selectedLinks.has(link.id) ? (
                          <CheckSquare className="h-4 w-4 text-primary" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(link.status)}
                        <span className={cn(
                          "px-2 py-0.5 text-xs rounded-full capitalize",
                          getStatusColor(link.status)
                        )}>
                          {link.status.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <a 
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-primary transition max-w-xs truncate"
                        title={link.url}
                      >
                        {link.domain || 'Unknown'}
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      </a>
                      {link.advertiserName && (
                        <p className="text-xs text-muted-foreground">{link.advertiserName}</p>
                      )}
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {link.source || '-'}
                      {link.searchKeyword && (
                        <p className="text-xs">"{link.searchKeyword}"</p>
                      )}
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {new Date(link.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        {link.status === 'pending' && (
                          <button
                            onClick={() => handleSignupSingle(link.id)}
                            disabled={signingUp || onlineAgents.length === 0}
                            className="p-2 hover:bg-green-500/20 rounded-lg transition text-green-500"
                            title="Run Signup"
                          >
                            <Play className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteLink(link.id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition text-muted-foreground hover:text-red-500"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
