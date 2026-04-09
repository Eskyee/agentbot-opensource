/**
 * onboarding.ts - User Onboarding System
 * 
 * Guided first-time experience to help users get started
 */

import { prisma } from './prisma'

export interface OnboardingStep {
  id: string
  title: string
  description: string
  action: string
  link: string
  completed: boolean
  order: number
}

export interface OnboardingProgress {
  userId: string
  completed: boolean
  currentStep: number
  steps: OnboardingStep[]
  progress: number // 0-100
}

// Define onboarding steps
export const ONBOARDING_STEPS: Omit<OnboardingStep, 'completed'>[] = [
  {
    id: 'welcome',
    title: 'Welcome to Agentbot',
    description: 'Complete your profile and get familiar with the platform',
    action: 'Get Started',
    link: '/settings',
    order: 1
  },
  {
    id: 'create_agent',
    title: 'Create Your First Agent',
    description: 'Build an AI agent that represents you or your brand',
    action: 'Create Agent',
    link: '/dashboard/agents/new',
    order: 2
  },
  {
    id: 'deploy_agent',
    title: 'Deploy Your Agent',
    description: 'Launch your agent to the cloud and make it accessible',
    action: 'Deploy',
    link: '/dashboard/deploy',
    order: 3
  },
  {
    id: 'connect_platform',
    title: 'Connect a Platform',
    description: 'Link your agent to Telegram, Discord, or WhatsApp',
    action: 'Connect',
    link: '/dashboard/integrations',
    order: 4
  },
  {
    id: 'customize_personality',
    title: 'Customize Personality',
    description: 'Give your agent a unique voice and behavior',
    action: 'Customize',
    link: '/dashboard/personality',
    order: 5
  },
  {
    id: 'invite_team',
    title: 'Invite Your Team',
    description: 'Add collaborators to help manage your agents',
    action: 'Invite',
    link: '/dashboard/team',
    order: 6
  },
  {
    id: 'earn_rewards',
    title: 'Start Earning Rewards',
    description: 'Refer friends and earn credits for your account',
    action: 'Refer Friends',
    link: '/settings?tab=referrals',
    order: 7
  }
]

/**
 * Get or create user's onboarding progress
 */
export async function getOnboardingProgress(userId: string): Promise<OnboardingProgress> {
  // Check user settings for onboarding data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
    }
  })

  // Check if user has agents
  const agentCount = await prisma.agent.count({
    where: { userId }
  })

  if (!user) {
    throw new Error('User not found')
  }

  // Get onboarding completion status from user settings
  const onboardingSetting = await prisma.userSetting.findFirst({
    where: { userId, key: 'onboarding_completed' }
  })

  const completedSteps = await prisma.userSetting.findMany({
    where: { userId, key: { startsWith: 'onboarding_step_' } }
  })

  const completedStepIds = new Set(
    completedSteps.map(s => s.key.replace('onboarding_step_', ''))
  )

  // Auto-detect completed steps based on user data
  const steps: OnboardingStep[] = ONBOARDING_STEPS.map(step => {
    let completed = completedStepIds.has(step.id)

    // Auto-complete based on user data
    if (step.id === 'welcome' && user.name) completed = true
    if (step.id === 'create_agent' && agentCount > 0) completed = true
    if (step.id === 'deploy_agent' && agentCount > 0) completed = true

    return { ...step, completed }
  })

  const completedCount = steps.filter(s => s.completed).length
  const currentStep = steps.find(s => !s.completed)?.order || steps.length
  const progress = Math.round((completedCount / steps.length) * 100)
  const completed = onboardingSetting?.value === 'true' || progress === 100

  return {
    userId,
    completed,
    currentStep,
    steps,
    progress
  }
}

/**
 * Mark a step as completed
 */
export async function completeOnboardingStep(userId: string, stepId: string): Promise<void> {
  await prisma.userSetting.upsert({
    where: {
      userId_key: { userId, key: `onboarding_step_${stepId}` }
    },
    update: { value: 'true' },
    create: {
      userId,
      key: `onboarding_step_${stepId}`,
      value: 'true'
    }
  })

  // Check if all steps completed
  const progress = await getOnboardingProgress(userId)
  if (progress.progress === 100) {
    await prisma.userSetting.upsert({
      where: {
        userId_key: { userId, key: 'onboarding_completed' }
      },
      update: { value: 'true' },
      create: {
        userId,
        key: 'onboarding_completed',
        value: 'true'
      }
    })

    // Award completion badge
    await awardBadge(userId, 'onboarding_complete')
  }
}

/**
 * Skip onboarding
 */
export async function skipOnboarding(userId: string): Promise<void> {
  await prisma.userSetting.upsert({
    where: {
      userId_key: { userId, key: 'onboarding_completed' }
    },
    update: { value: 'skipped' },
    create: {
      userId,
      key: 'onboarding_completed',
      value: 'skipped'
    }
  })
}

/**
 * Award a badge (gamification)
 */
async function awardBadge(userId: string, badgeId: string): Promise<void> {
  const existing = await prisma.userSetting.findFirst({
    where: { userId, key: `badge_${badgeId}` }
  })

  if (!existing) {
    await prisma.userSetting.create({
      data: {
        userId,
        key: `badge_${badgeId}`,
        value: new Date().toISOString()
      }
    })
  }
}

/**
 * Get user's badges
 */
export async function getUserBadges(userId: string): Promise<string[]> {
  const badges = await prisma.userSetting.findMany({
    where: { 
      userId, 
      key: { startsWith: 'badge_' } 
    }
  })

  return badges.map(b => b.key.replace('badge_', ''))
}
