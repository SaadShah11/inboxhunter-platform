'use client';

import { useState, useEffect } from 'react';
import {
  Download,
  Monitor,
  Apple,
  Terminal,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  Info,
} from 'lucide-react';
import { agentsApi } from '@/lib/api';

interface DownloadInfo {
  os: 'windows' | 'macos' | 'linux';
  download_url: string;
  filename: string;
  size: number;
}

interface ReleaseInfo {
  latest_version: string;
  release_date: string;
  downloads: DownloadInfo[];
  release_notes?: string;
}

const platformConfig = {
  windows: {
    name: 'Windows',
    icon: Monitor,
    color: 'from-blue-500 to-blue-600',
    description: 'Windows 10/11 (64-bit)',
    instructions: [
      'Download the installer (.exe)',
      'Run the installer',
      'Follow the setup wizard',
      'Launch from Desktop or Start Menu',
    ],
  },
  macos: {
    name: 'macOS',
    icon: Apple,
    color: 'from-gray-700 to-gray-800',
    description: 'macOS 10.14+ (Intel & Apple Silicon)',
    instructions: [
      'Download the DMG file',
      'Open the DMG and drag to Applications',
      'Right-click → Open (first time only)',
      'Allow in Security preferences if needed',
    ],
  },
  linux: {
    name: 'Linux',
    icon: Terminal,
    color: 'from-orange-500 to-orange-600',
    description: 'Ubuntu 20.04+, Debian, Fedora',
    instructions: [
      'Download the AppImage',
      'Make it executable: chmod +x *.AppImage',
      'Run: ./InboxHunterAgent*.AppImage',
      'Or use AppImageLauncher for integration',
    ],
  },
};

function detectOS(): 'windows' | 'macos' | 'linux' {
  if (typeof window === 'undefined') return 'windows';
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('win')) return 'windows';
  if (ua.includes('mac')) return 'macos';
  return 'linux';
}

function formatSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

export default function DownloadPage() {
  const [releaseInfo, setReleaseInfo] = useState<ReleaseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [detectedOS, setDetectedOS] = useState<'windows' | 'macos' | 'linux'>('windows');
  const [registrationToken, setRegistrationToken] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setDetectedOS(detectOS());
    fetchReleaseInfo();
  }, []);

  const fetchReleaseInfo = async () => {
    try {
      const response = await fetch('/api/agents/releases');
      if (response.ok) {
        const data = await response.json();
        setReleaseInfo(data);
      }
    } catch (error) {
      console.error('Failed to fetch release info:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateToken = async () => {
    setTokenLoading(true);
    try {
      const { data, error } = await agentsApi.getRegistrationToken();
      if (data?.token) {
        setRegistrationToken(data.token);
      }
    } catch (error) {
      console.error('Failed to generate token:', error);
    } finally {
      setTokenLoading(false);
    }
  };

  const copyToken = () => {
    if (registrationToken) {
      navigator.clipboard.writeText(registrationToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
          <Download className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Download InboxHunter Agent</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          The InboxHunter Agent runs on your computer and handles browser automation tasks.
          Download the agent for your operating system and follow the setup instructions.
        </p>
        {releaseInfo && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Latest Version: {releaseInfo.latest_version}
          </div>
        )}
      </div>

      {/* Download Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {(['windows', 'macos', 'linux'] as const).map((os) => {
          const config = platformConfig[os];
          const Icon = config.icon;
          const download = releaseInfo?.downloads.find((d) => d.os === os);
          const isRecommended = os === detectedOS;

          return (
            <div
              key={os}
              className={`relative bg-white rounded-2xl shadow-sm border-2 transition-all hover:shadow-lg ${
                isRecommended ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-gray-100'
              }`}
            >
              {isRecommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-500 text-white text-xs font-semibold rounded-full">
                  Recommended
                </div>
              )}

              <div className="p-6 space-y-4">
                {/* Platform Header */}
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{config.name}</h3>
                    <p className="text-sm text-gray-500">{config.description}</p>
                  </div>
                </div>

                {/* Download Info */}
                {download && (
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">{download.filename}</span>
                    <span className="mx-2">•</span>
                    <span>{formatSize(download.size)}</span>
                  </div>
                )}

                {/* Download Button */}
                <button
                  onClick={() => download && handleDownload(download.download_url)}
                  disabled={!download || loading}
                  className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                    isRecommended
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700'
                      : 'bg-gray-800 hover:bg-gray-900'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Download
                    </>
                  )}
                </button>

                {/* Instructions */}
                <div className="pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Installation</h4>
                  <ol className="text-sm text-gray-500 space-y-1">
                    {config.instructions.map((step, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-gray-400">{i + 1}.</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Registration Token Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Info className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900">Registration Token</h3>
              <p className="text-sm text-gray-600 mt-1">
                After downloading, you'll need a registration token to connect your agent to this
                account. Generate one below and use it during the agent setup.
              </p>
            </div>

            {registrationToken ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200">
                  <code className="flex-1 text-sm font-mono text-gray-800 break-all">
                    {registrationToken}
                  </code>
                  <button
                    onClick={copyToken}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <Copy className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  This token expires in 1 hour. Run the agent with{' '}
                  <code className="bg-gray-100 px-1 rounded">--register</code> and paste this token
                  when prompted.
                </p>
              </div>
            ) : (
              <button
                onClick={generateToken}
                disabled={tokenLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {tokenLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Generate Registration Token'
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Setup Steps */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Start Guide</h2>

        <div className="grid md:grid-cols-4 gap-6">
          {[
            {
              step: 1,
              title: 'Download',
              description: 'Download the agent for your operating system above',
            },
            {
              step: 2,
              title: 'Install',
              description: 'Run the installer and follow the prompts',
            },
            {
              step: 3,
              title: 'Configure',
              description: 'Add your OpenAI API key and credentials',
            },
            {
              step: 4,
              title: 'Connect',
              description: 'Register with your token and start automating',
            },
          ].map(({ step, title, description }) => (
            <div key={step} className="text-center">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold mx-auto mb-3">
                {step}
              </div>
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500 mt-1">{description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Release Notes */}
      {releaseInfo?.release_notes && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Release Notes</h2>
          <div className="prose prose-sm prose-gray max-w-none">
            <pre className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
              {releaseInfo.release_notes}
            </pre>
          </div>
        </div>
      )}

      {/* Help Links */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <a
          href="https://github.com/YOUR_ORG/inboxhunter-agent/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-gray-500 hover:text-indigo-600 transition-colors"
        >
          Report an Issue
          <ExternalLink className="w-3 h-3" />
        </a>
        <a
          href="https://docs.inboxhunter.io"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-gray-500 hover:text-indigo-600 transition-colors"
        >
          Documentation
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}

