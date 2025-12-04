"use client";

import { useEffect, useState } from "react";
import { 
  Cpu, 
  Plus, 
  Copy, 
  Check, 
  Trash2, 
  Play, 
  Square,
  MoreVertical,
  Download,
  RefreshCw
} from "lucide-react";
import { agents as agentsApi } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [registrationToken, setRegistrationToken] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    const { data } = await agentsApi.list();
    if (data) {
      setAgents(data);
    }
    setLoading(false);
  };

  const handleGenerateToken = async () => {
    const { data } = await agentsApi.getRegistrationToken();
    if (data) {
      setRegistrationToken(data.token);
    }
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(registrationToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCommand = async (agentId: string, command: string) => {
    await agentsApi.command(agentId, command);
    loadAgents();
  };

  const handleDelete = async (agentId: string) => {
    if (confirm("Are you sure you want to delete this agent?")) {
      await agentsApi.delete(agentId);
      loadAgents();
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Agents</h1>
          <p className="text-muted-foreground">
            Manage your connected desktop agents
          </p>
        </div>
        <button
          onClick={() => {
            setShowAddModal(true);
            handleGenerateToken();
          }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition"
        >
          <Plus className="h-4 w-4" />
          Add Agent
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : agents.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center">
          <Cpu className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Agents Connected</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Download and install the InboxHunter Agent on your computer to start automating.
          </p>
          <button
            onClick={() => {
              setShowAddModal(true);
              handleGenerateToken();
            }}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition"
          >
            <Download className="h-5 w-5" />
            Add Your First Agent
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {agents.map((agent) => (
            <div key={agent.id} className="bg-card border rounded-xl p-4">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "h-12 w-12 rounded-xl flex items-center justify-center",
                  agent.status === 'ONLINE' ? "bg-green-500/20" :
                  agent.status === 'RUNNING' ? "bg-blue-500/20" :
                  agent.status === 'ERROR' ? "bg-red-500/20" :
                  "bg-gray-500/20"
                )}>
                  <Cpu className={cn(
                    "h-6 w-6",
                    agent.status === 'ONLINE' ? "text-green-500" :
                    agent.status === 'RUNNING' ? "text-blue-500" :
                    agent.status === 'ERROR' ? "text-red-500" :
                    "text-gray-500"
                  )} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{agent.name}</h3>
                    <span className={cn(
                      "px-2 py-0.5 text-xs rounded-full",
                      agent.status === 'ONLINE' ? "bg-green-500/20 text-green-500" :
                      agent.status === 'RUNNING' ? "bg-blue-500/20 text-blue-500" :
                      agent.status === 'ERROR' ? "bg-red-500/20 text-red-500" :
                      "bg-gray-500/20 text-gray-400"
                    )}>
                      {agent.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {agent.os} {agent.osVersion} • v{agent.version || '2.0.0'}
                  </p>
                  {agent.lastSeenAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Last seen: {new Date(agent.lastSeenAt).toLocaleString()}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {agent.status === 'ONLINE' && (
                    <button
                      onClick={() => handleCommand(agent.id, 'start')}
                      className="p-2 hover:bg-secondary rounded-lg transition"
                      title="Start"
                    >
                      <Play className="h-5 w-5 text-green-500" />
                    </button>
                  )}
                  {agent.status === 'RUNNING' && (
                    <button
                      onClick={() => handleCommand(agent.id, 'stop')}
                      className="p-2 hover:bg-secondary rounded-lg transition"
                      title="Stop"
                    >
                      <Square className="h-5 w-5 text-red-500" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(agent.id)}
                    className="p-2 hover:bg-secondary rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 className="h-5 w-5 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm">
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-muted-foreground">Tasks: </span>
                    <span className="font-medium">{agent._count?.tasks || 0}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Signups: </span>
                    <span className="font-medium">{agent._count?.signups || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Agent Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border rounded-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold mb-4">Add New Agent</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">1. Download the Agent</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Download and install the InboxHunter Agent on your computer.
                </p>
                <a
                  href="#"
                  className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:bg-secondary/80 transition"
                >
                  <Download className="h-4 w-4" />
                  Download for your OS
                </a>
              </div>

              <div>
                <h3 className="font-medium mb-2">2. Register the Agent</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Run the agent with --register flag and paste this token:
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={registrationToken}
                    readOnly
                    className="flex-1 px-4 py-2 bg-background border rounded-lg text-sm font-mono"
                    placeholder="Generating token..."
                  />
                  <button
                    onClick={handleCopyToken}
                    className="px-4 py-2 bg-secondary rounded-lg hover:bg-secondary/80 transition"
                  >
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Token expires in 1 hour
                </p>
              </div>

              <div className="bg-secondary/50 rounded-lg p-4">
                <p className="text-sm font-mono">
                  ./InboxHunterAgent --register
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-muted-foreground hover:text-foreground transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  loadAgents();
                }}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

