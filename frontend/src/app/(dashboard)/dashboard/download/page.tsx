'use client';

import { useEffect, useState } from 'react';
import {
  Download,
  Monitor,
  Apple,
  Cpu,
  Copy,
  Check,
  ExternalLink,
  CheckCircle,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { agents as agentsApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

type Platform = 'windows' | 'macos' | 'linux';

const platforms: { id: Platform; name: string; icon: any; ext: string; description: string }[] = [
  {
    id: 'windows',
    name: 'Windows',
    icon: Monitor,
    ext: '.exe',
    description: 'Windows 10 or later',
  },
  {
    id: 'macos',
    name: 'macOS',
    icon: Apple,
    ext: '.dmg',
    description: 'macOS 11 or later',
  },
  {
    id: 'linux',
    name: 'Linux',
    icon: Cpu,
    ext: '.AppImage',
    description: 'Ubuntu 20.04 or later',
  },
];

const steps = [
  { title: 'Download the Agent', description: 'Get the installer for your platform' },
  { title: 'Generate Token', description: 'Create a registration token' },
  { title: 'Install & Configure', description: 'Run installer and enter token' },
  { title: 'Start Automating', description: 'Agent connects automatically' },
];

export default function DownloadPage() {
  const { toast } = useToast();
  
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('windows');
  const [token, setToken] = useState('');
  const [generatingToken, setGeneratingToken] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Detect user's platform
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('mac')) {
      setSelectedPlatform('macos');
    } else if (userAgent.includes('linux')) {
      setSelectedPlatform('linux');
    } else {
      setSelectedPlatform('windows');
    }
  }, []);

  const handleGenerateToken = async () => {
    setGeneratingToken(true);
    const { data, error } = await agentsApi.getRegistrationToken();

    if (data?.token) {
      setToken(data.token);
      toast({ type: 'success', title: 'Token generated!', description: 'Copy it and use it during installation.' });
    } else {
      toast({ type: 'error', title: 'Failed to generate token', description: error });
    }
    setGeneratingToken(false);
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ type: 'success', title: 'Token copied!' });
  };

  const selectedPlatformInfo = platforms.find((p) => p.id === selectedPlatform)!;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <Download className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Download Agent</h1>
        <p className="text-gray-500 max-w-xl mx-auto">
          Install the InboxHunter Agent on your computer to start automating email signups.
        </p>
      </div>

      {/* Steps */}
      <div className="flex items-center justify-center gap-2 py-4 overflow-x-auto">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 whitespace-nowrap">
              <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                {i + 1}
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{step.title}</span>
            </div>
            {i < steps.length - 1 && (
              <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-1 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>

      {/* Platform Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Choose Your Platform</CardTitle>
          <CardDescription>Select your operating system to download the appropriate installer</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-4">
            {platforms.map((platform) => (
              <button
                key={platform.id}
                onClick={() => setSelectedPlatform(platform.id)}
                className={cn(
                  'p-4 rounded-xl border-2 text-left transition-all',
                  selectedPlatform === platform.id
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                )}
              >
                <platform.icon
                  className={cn(
                    'w-8 h-8 mb-3',
                    selectedPlatform === platform.id ? 'text-indigo-500' : 'text-gray-400'
                  )}
                />
                <p className="font-semibold text-gray-900 dark:text-white">{platform.name}</p>
                <p className="text-sm text-gray-500">{platform.description}</p>
              </button>
            ))}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center gap-4">
            <Button
              size="lg"
              className="w-full sm:w-auto"
              icon={<Download className="w-5 h-5" />}
              onClick={() => {
                // TODO: Actual download link
                toast({ type: 'info', title: 'Download starting...', description: `InboxHunter Agent${selectedPlatformInfo.ext}` });
              }}
            >
              Download for {selectedPlatformInfo.name}
            </Button>
            <span className="text-sm text-gray-500">
              InboxHunterAgent{selectedPlatformInfo.ext} · v1.0.0
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Token Generation */}
      <Card>
        <CardHeader>
          <CardTitle>Registration Token</CardTitle>
          <CardDescription>Generate a token to connect your agent to your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!token ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Button onClick={handleGenerateToken} loading={generatingToken}>
                Generate Registration Token
              </Button>
              <p className="text-sm text-gray-500">
                You'll need this token during agent installation
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-emerald-700 dark:text-emerald-400">Token generated!</p>
                    <p className="text-sm text-emerald-600 dark:text-emerald-500 mt-1">
                      This token expires in 24 hours. Copy it now.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Your Registration Token
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={token}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 font-mono text-sm"
                  />
                  <Button onClick={handleCopyToken} icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}>
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Installation Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Installation Instructions</CardTitle>
          <CardDescription>Follow these steps for {selectedPlatformInfo.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {selectedPlatform === 'windows' && (
              <>
                <Step number={1} title="Run the Installer">
                  Double-click <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm">InboxHunterAgent.exe</code> to start installation.
                </Step>
                <Step number={2} title="Follow Setup Wizard">
                  Accept the license agreement and choose installation directory.
                </Step>
                <Step number={3} title="Enter Registration Token">
                  Paste your registration token when prompted to connect the agent.
                </Step>
                <Step number={4} title="Start Automating">
                  The agent will appear in your system tray and connect automatically.
                </Step>
              </>
            )}

            {selectedPlatform === 'macos' && (
              <>
                <Step number={1} title="Open the DMG File">
                  Double-click the downloaded <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm">.dmg</code> file.
                </Step>
                <Step number={2} title="Drag to Applications">
                  Drag the InboxHunter Agent to your Applications folder.
                </Step>
                <Step number={3} title="Open the Agent">
                  Right-click and select "Open" to bypass Gatekeeper on first launch.
                </Step>
                <Step number={4} title="Enter Registration Token">
                  Paste your token in the configuration dialog.
                </Step>
              </>
            )}

            {selectedPlatform === 'linux' && (
              <>
                <Step number={1} title="Make Executable">
                  <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                    chmod +x InboxHunterAgent.AppImage
                  </code>
                </Step>
                <Step number={2} title="Run the AppImage">
                  <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                    ./InboxHunterAgent.AppImage
                  </code>
                </Step>
                <Step number={3} title="Configure Token">
                  Enter your registration token when prompted.
                </Step>
                <Step number={4} title="Start Automating">
                  The agent will connect to your account automatically.
                </Step>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Help */}
      <Card className="border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-indigo-500 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Need help?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 mb-3">
                Check out our documentation or contact support if you're having trouble with installation.
              </p>
              <Button variant="secondary" size="sm" icon={<ExternalLink className="w-4 h-4" />}>
                View Documentation
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{number}</span>
      </div>
      <div>
        <p className="font-medium text-gray-900 dark:text-white">{title}</p>
        <p className="text-sm text-gray-500 mt-0.5">{children}</p>
      </div>
    </div>
  );
}
