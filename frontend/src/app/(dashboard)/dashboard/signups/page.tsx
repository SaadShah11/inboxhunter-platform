"use client";

import { useEffect, useState } from "react";
import { 
  MailCheck, 
  CheckCircle, 
  XCircle, 
  Clock,
  ExternalLink,
  RefreshCw,
  Loader2,
  Image as ImageIcon
} from "lucide-react";
import { signups as signupsApi } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Signup {
  id: string;
  url: string;
  domain: string;
  email: string;
  status: string;
  error?: string;
  screenshotUrl?: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

export default function SignupsPage() {
  const [signupsList, setSignupsList] = useState<Signup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSignup, setSelectedSignup] = useState<Signup | null>(null);

  useEffect(() => {
    loadSignups();
  }, []);

  const loadSignups = async () => {
    setLoading(true);
    const { data } = await signupsApi.list();
    if (data) {
      const list = Array.isArray(data) ? data : data.signups || [];
      setSignupsList(list);
    }
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-500/20 text-green-500';
      case 'failed':
        return 'bg-red-500/20 text-red-500';
      default:
        return 'bg-yellow-500/20 text-yellow-500';
    }
  };

  // Stats
  const totalSignups = signupsList.length;
  const successfulSignups = signupsList.filter(s => s.status === 'success').length;
  const failedSignups = signupsList.filter(s => s.status === 'failed').length;
  const successRate = totalSignups > 0 ? Math.round((successfulSignups / totalSignups) * 100) : 0;

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Signups</h1>
          <p className="text-muted-foreground">
            History of all signup attempts
          </p>
        </div>
        <button
          onClick={loadSignups}
          className="p-2 hover:bg-secondary rounded-lg transition"
          title="Refresh"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">Total</p>
          <p className="text-2xl font-bold">{totalSignups}</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">Successful</p>
          <p className="text-2xl font-bold text-green-500">{successfulSignups}</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">Failed</p>
          <p className="text-2xl font-bold text-red-500">{failedSignups}</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">Success Rate</p>
          <p className="text-2xl font-bold">{successRate}%</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : signupsList.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center">
          <MailCheck className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Signups Yet</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Signups will appear here after you create and run tasks.
          </p>
        </div>
      ) : (
        <div className="bg-card border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-secondary/30">
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Website</th>
                <th className="text-left p-4 font-medium">Email Used</th>
                <th className="text-left p-4 font-medium">Date</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {signupsList.map((signup) => (
                <tr key={signup.id} className="border-b last:border-0 hover:bg-secondary/20">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(signup.status)}
                      <span className={cn(
                        "px-2 py-0.5 text-xs rounded-full capitalize",
                        getStatusColor(signup.status)
                      )}>
                        {signup.status}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <a 
                      href={signup.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-primary transition"
                    >
                      {signup.domain || (signup.url ? new URL(signup.url).hostname : 'Unknown')}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {signup.email || '-'}
                  </td>
                  <td className="p-4 text-muted-foreground text-sm">
                    {new Date(signup.createdAt).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => setSelectedSignup(signup)}
                      className="text-sm text-primary hover:underline"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Signup Detail Modal */}
      {selectedSignup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border rounded-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Signup Details</h2>
              <button
                onClick={() => setSelectedSignup(null)}
                className="p-2 hover:bg-secondary rounded-lg transition"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getStatusIcon(selectedSignup.status)}
                <span className={cn(
                  "px-2 py-0.5 text-sm rounded-full capitalize",
                  getStatusColor(selectedSignup.status)
                )}>
                  {selectedSignup.status}
                </span>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">URL</p>
                <a 
                  href={selectedSignup.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline break-all"
                >
                  {selectedSignup.url}
                </a>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Email Used</p>
                <p>{selectedSignup.email || '-'}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Date</p>
                <p>{new Date(selectedSignup.createdAt).toLocaleString()}</p>
              </div>

              {selectedSignup.error && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Error</p>
                  <p className="text-red-500">{selectedSignup.error}</p>
                </div>
              )}

              {selectedSignup.screenshotUrl && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Screenshot</p>
                  <img 
                    src={selectedSignup.screenshotUrl} 
                    alt="Screenshot" 
                    className="w-full rounded-lg border"
                  />
                </div>
              )}

              {selectedSignup.metadata && Object.keys(selectedSignup.metadata).length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Metadata</p>
                  <pre className="bg-secondary/50 p-3 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedSignup.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

