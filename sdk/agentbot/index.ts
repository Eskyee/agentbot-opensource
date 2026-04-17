export type AgentbotClientOptions = {
  baseUrl: string
  apiKey?: string
  fetchImpl?: typeof fetch
}

export type AgentStatus = 'pending' | 'active' | 'running' | 'failed' | 'stopped'

export interface HealthResponse {
  status: string
  timestamp: string
}

export interface AgentRecord {
  id: string
  agentId?: string
  status: AgentStatus | string
  createdAt?: string
  created?: string
  plan?: string
  subdomain?: string
  name?: string
}

export interface CreateAgentInput {
  name: string
  config?: Record<string, unknown>
}

export interface UpdateAgentInput {
  plan?: string
  aiProvider?: string
  config?: Record<string, unknown>
}

export interface ProvisionInput {
  channelToken?: string
  channelUserId?: string
  aiProvider?: 'openrouter' | 'gemini' | 'groq' | 'anthropic' | 'openai'
  plan?: 'solo' | 'collective' | 'label' | 'network'
  email?: string
  paymentSubscriptionId?: string
  autoProvision?: boolean
  agentType?: string
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
}

export class AgentbotApiError extends Error {
  readonly status: number
  readonly responseText: string

  constructor(status: number, responseText: string) {
    super(`Agentbot API error ${status}: ${responseText}`)
    this.name = 'AgentbotApiError'
    this.status = status
    this.responseText = responseText
  }
}

export function createAgentbotClient(options: AgentbotClientOptions) {
  const fetchImpl = options.fetchImpl ?? fetch
  const baseUrl = options.baseUrl.replace(/\/+$/, '')

  async function request<T>(path: string, init: RequestOptions = {}): Promise<T> {
    const response = await fetchImpl(`${baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(options.apiKey ? { Authorization: `Bearer ${options.apiKey}` } : {}),
        ...(init.headers ?? {}),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    })

    if (!response.ok) {
      throw new AgentbotApiError(response.status, await response.text())
    }

    if (response.status === 204) {
      return undefined as T
    }

    return response.json() as Promise<T>
  }

  return {
    getHealth() {
      return request<HealthResponse>('/health', { method: 'GET' })
    },
    listAgents() {
      return request<AgentRecord[]>('/api/agents', { method: 'GET' })
    },
    getAgent(agentId: string) {
      return request<AgentRecord>(`/api/agents/${encodeURIComponent(agentId)}`, { method: 'GET' })
    },
    createAgent(input: CreateAgentInput) {
      return request<AgentRecord>('/api/agents', { method: 'POST', body: input })
    },
    updateAgent(agentId: string, input: UpdateAgentInput) {
      return request<AgentRecord>(`/api/agents/${encodeURIComponent(agentId)}`, {
        method: 'PUT',
        body: input,
      })
    },
    deleteAgent(agentId: string) {
      return request<{ id: string; deleted: boolean }>(`/api/agents/${encodeURIComponent(agentId)}`, {
        method: 'DELETE',
      })
    },
    provisionAgent(input: ProvisionInput) {
      return request<Record<string, unknown>>('/api/provision', {
        method: 'POST',
        body: input,
      })
    },
  }
}
