/**
 * Edge-compatible database client
 * Uses internal REST API instead of direct Prisma (which requires Node.js)
 * 
 * This allows Edge Runtime routes to access database data without
 * the Node.js Prisma client.
 */

import { getEdgeAuthSession } from './edge-auth';

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface UserData {
  id: string;
  referralCredits: number;
  plan: string;
  openclawUrl: string | null;
  openclawInstanceId: string | null;
}

interface AgentData {
  id: string;
  status: string;
  name: string;
  tier: string;
}

interface RegistrationData {
  gateway_token: string | null;
}

/**
 * Edge-compatible database queries for dashboard
 */
export const edgeDb = {
  /**
   * Get user by ID
   */
  async getUser(userId: string): Promise<UserData | null> {
    try {
      const response = await fetch(`${API_BASE}/api/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${await getServiceToken()}`,
        },
        next: { revalidate: 0 }, // No cache for user data
      });
      
      if (!response.ok) return null;
      return response.json();
    } catch (error) {
      console.error('[EdgeDB] Get user error:', error);
      return null;
    }
  },

  /**
   * Get agent for user
   */
  async getAgentForUser(userId: string): Promise<AgentData | null> {
    try {
      const response = await fetch(`${API_BASE}/api/agents/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${await getServiceToken()}`,
        },
        next: { revalidate: 0 },
      });
      
      if (!response.ok) return null;
      const agents = await response.json();
      return agents[0] || null;
    } catch (error) {
      console.error('[EdgeDB] Get agent error:', error);
      return null;
    }
  },

  /**
   * Get registration token for user
   */
  async getRegistrationToken(userId: string): Promise<string | null> {
    try {
      const response = await fetch(`${API_BASE}/api/registration/token?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${await getServiceToken()}`,
        },
        next: { revalidate: 0 },
      });
      
      if (!response.ok) return null;
      const data = await response.json();
      return data.gateway_token || null;
    } catch (error) {
      console.error('[EdgeDB] Get registration error:', error);
      return null;
    }
  },

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/api/health`, {
        next: { revalidate: 0 },
      });
      return response.ok;
    } catch {
      return false;
    }
  },
};

/**
 * Get or create service token for internal API calls
 * This is a simple approach - in production, use proper service-to-service auth
 */
async function getServiceToken(): Promise<string> {
  // For internal API calls from Edge Runtime, we can use a simple
  // shared secret or the user's own session
  const session = await getEdgeAuthSession();
  if (session) {
    // Use session-based auth when user is logged in
    return 'session-based';
  }
  
  // Fallback to service token
  return process.env.INTERNAL_API_TOKEN || 'dev-token';
}

/**
 * Edge-compatible token manager
 * Gets the effective gateway token for a user
 */
export async function getEdgeGatewayToken(userId: string): Promise<string | null> {
  try {
    // Try to get token from registration
    const token = await edgeDb.getRegistrationToken(userId);
    if (token) return token;

    // Try from user record
    const user = await edgeDb.getUser(userId);
    return user?.openclawInstanceId || null;
  } catch (error) {
    console.error('[Edge Token Manager] Error:', error);
    return null;
  }
}
