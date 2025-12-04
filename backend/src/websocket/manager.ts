import { WebSocket } from 'ws';
import { prisma } from '../lib/prisma.js';

interface ConnectedAgent {
  ws: WebSocket;
  agentId: string;
  userId: string;
  connectedAt: Date;
}

class AgentConnectionManager {
  private agents: Map<string, ConnectedAgent> = new Map();
  
  /**
   * Register a new agent connection
   */
  addAgent(agentId: string, userId: string, ws: WebSocket) {
    // Close existing connection if any
    const existing = this.agents.get(agentId);
    if (existing) {
      existing.ws.close();
    }
    
    this.agents.set(agentId, {
      ws,
      agentId,
      userId,
      connectedAt: new Date()
    });
    
    console.log(`Agent connected: ${agentId}`);
    
    // Update status in database
    prisma.agent.update({
      where: { id: agentId },
      data: { status: 'ONLINE', lastSeenAt: new Date() }
    }).catch(console.error);
  }
  
  /**
   * Remove an agent connection
   */
  removeAgent(agentId: string) {
    const agent = this.agents.get(agentId);
    if (agent) {
      this.agents.delete(agentId);
      console.log(`Agent disconnected: ${agentId}`);
      
      // Update status in database
      prisma.agent.update({
        where: { id: agentId },
        data: { status: 'OFFLINE' }
      }).catch(console.error);
    }
  }
  
  /**
   * Disconnect an agent
   */
  disconnectAgent(agentId: string) {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.ws.close();
      this.removeAgent(agentId);
    }
  }
  
  /**
   * Send message to specific agent
   */
  sendToAgent(agentId: string, message: object): boolean {
    const agent = this.agents.get(agentId);
    if (!agent || agent.ws.readyState !== WebSocket.OPEN) {
      return false;
    }
    
    try {
      agent.ws.send(JSON.stringify(message));
      return true;
    } catch (err) {
      console.error(`Failed to send to agent ${agentId}:`, err);
      return false;
    }
  }
  
  /**
   * Send message to all agents of a user
   */
  sendToUserAgents(userId: string, message: object) {
    for (const agent of this.agents.values()) {
      if (agent.userId === userId && agent.ws.readyState === WebSocket.OPEN) {
        try {
          agent.ws.send(JSON.stringify(message));
        } catch (err) {
          console.error(`Failed to send to agent ${agent.agentId}:`, err);
        }
      }
    }
  }
  
  /**
   * Broadcast to all connected agents
   */
  broadcast(message: object) {
    for (const agent of this.agents.values()) {
      if (agent.ws.readyState === WebSocket.OPEN) {
        try {
          agent.ws.send(JSON.stringify(message));
        } catch (err) {
          console.error(`Failed to broadcast to agent ${agent.agentId}:`, err);
        }
      }
    }
  }
  
  /**
   * Check if agent is connected
   */
  isConnected(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    return agent !== undefined && agent.ws.readyState === WebSocket.OPEN;
  }
  
  /**
   * Get all connected agents for a user
   */
  getUserAgents(userId: string): string[] {
    const agentIds: string[] = [];
    for (const agent of this.agents.values()) {
      if (agent.userId === userId) {
        agentIds.push(agent.agentId);
      }
    }
    return agentIds;
  }
  
  /**
   * Get connection count
   */
  getConnectionCount(): number {
    return this.agents.size;
  }
  
  /**
   * Get agent info
   */
  getAgentInfo(agentId: string): ConnectedAgent | undefined {
    return this.agents.get(agentId);
  }
}

// Singleton instance
export const agentManager = new AgentConnectionManager();

