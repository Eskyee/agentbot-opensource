export type Step = 'telegram' | 'token' | 'userid' | 'agenttype' | 'ai' | 'model' | 'skills' | 'deploy' | 'done'

export const FLOW_STEPS: Step[] = ['telegram', 'token', 'userid', 'agenttype', 'ai', 'model', 'skills', 'deploy', 'done']
export const DEPLOY_FLOW_STEPS: Step[] = ['ai', 'deploy', 'done']

export const ADMIN_EMAILS = ['eskyjunglelab@gmail.com', 'admin@agentbot.sh', 'rbasefm@icloud.com']

export interface DeployResult {
  userId: string
  jobId?: string
  subdomain?: string
  url: string
  status?: string
  streamKey?: string
  liveStreamId?: string
}

export interface BotInfo {
  username: string
}

export interface AccountStats {
  agents?: { active: number; total: number; limit: number; newToday: number }
  skills?: { installed: number }
  tasks?: { total: number }
}

export interface DeploymentStats {
  deployment?: {
    provider?: string
    environment?: string
    region?: string | null
    deploymentUrl?: string | null
    commitSha?: string | null
  }
}

export const AVAILABLE_MODELS = [
  { id: 'xiaomi/mimo-v2.5-pro', name: 'MiMo V2.5 Pro', provider: 'xiaomi-direct', description: 'Best reasoning, 1M context. 99% cheaper than GPT-5. Recommended.', recommended: true, tier: 'free' },
  { id: 'xiaomi/mimo-v2.5', name: 'MiMo V2.5', provider: 'xiaomi-direct', description: 'Multimodal — images + text, 256K context. Fast.', tier: 'free' },
  { id: 'openrouter/anthropic/claude-sonnet-4-5', name: 'Claude Sonnet 4.5', provider: 'openrouter', description: 'Anthropic premium. Requires Collective plan.', tier: 'collective' },
  { id: 'openrouter/deepseek/deepseek-r1', name: 'DeepSeek R1', provider: 'openrouter', description: 'Maximum reasoning. Requires Label plan.', tier: 'label' },
]

export const AVAILABLE_SKILLS = [
  { id: 'web-search', name: 'Web Search', description: 'Search the web for information', icon: '🔍' },
  { id: 'file-handler', name: 'File Handler', description: 'Read, write, and process files', icon: '📁' },
  { id: 'code-interpreter', name: 'Code Runner', description: 'Execute code snippets safely', icon: '💻' },
  { id: 'image-analyzer', name: 'Image Analyzer', description: 'Analyze and describe images', icon: '🖼️' },
  { id: 'scheduler', name: 'Scheduler', description: 'Schedule tasks and reminders', icon: '⏰' },
  { id: 'email-sender', name: 'Email Sender', description: 'Send emails via SMTP', icon: '📧' },
  { id: 'api-caller', name: 'API Caller', description: 'Make HTTP requests', icon: '🌐' },
  { id: 'database-query', name: 'Database Query', description: 'Query databases', icon: '🗄️' },
]

export const AGENT_TYPES = [
  { id: 'general', name: 'General Assistant', description: 'Versatile agent for any task', icon: '🤖', color: 'purple' },
  { id: 'dj', name: 'Music DJ', description: '24/7 music streaming with track selection', icon: '🎵', color: 'green' },
  { id: 'business', name: 'Business Assistant', description: 'Email, calendar, and admin tasks', icon: '💼', color: 'blue' },
  { id: 'social', name: 'Social Media', description: 'Post to Twitter, generate content', icon: '📱', color: 'pink' },
  { id: 'support', name: 'Customer Support', description: 'FAQ, tickets, and helpdesk', icon: '🎫', color: 'orange' },
  { id: 'research', name: 'Research Agent', description: 'Web search, analysis, and reports', icon: '🔬', color: 'cyan' },
]
