/**
 * /app/* layout — Operator Mode gate
 *
 * Server component that guards every page under /app/* (start, templates,
 * tutorials, activity, advanced). Users who aren't authenticated or who
 * aren't covered by the Operator Mode flag (global or admin bypass) are
 * redirected out before the client pages render.
 *
 * This was added to address Codex P2: operator pages were previously
 * rendering unconditionally and only failing when the API rejected
 * actions, giving a confusing half-on UX to non-enabled users.
 */

import { redirect } from 'next/navigation'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { isOperatorModeEnabledForUser } from '@/app/lib/feature-flags'

export default async function OperatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getAuthSession()

  // Not logged in → send to sign-in, preserve intent
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/app/start')
  }

  // Logged in but Operator Mode isn't enabled for this user (flag off and
  // not an admin) → send back to the main dashboard. Avoids rendering the
  // onboarding UI only to have API calls 403.
  if (!isOperatorModeEnabledForUser(session.user.email)) {
    redirect('/dashboard')
  }

  return <>{children}</>
}
