/**
 * Dashboard Sidebar — Focused Navigation
 *
 * Core: Dashboard, Channels, Skills, Billing, Settings
 * Everything else is accessible from the dashboard page itself.
 */

'use client';

import { useState, useEffect, useCallback, memo, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { buildOpenClawControlUrl } from '@/app/lib/openclaw-control';
import { customSignOut } from '@/app/lib/useCustomSession';
import { useDashboardData } from '@/app/dashboard/DashboardDataProvider';
import { StatusDot } from '@/app/components/ui/status-dot';

export const navSections = [
  {
    label: null,
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: '◈' },
      { label: 'Chat', href: '/chat', icon: '💬' },
    ],
  },
  {
    label: 'Configure',
    items: [
      { label: 'Channels', href: '/dashboard/channels', icon: '◎' },
      { label: 'Skills', href: '/dashboard/skills', icon: '✳' },
      { label: 'Workflows', href: '/dashboard/workflows', icon: '⊞' },
      { label: 'Permissions', href: '/dashboard/rbac', icon: '🛡' },
    ],
  },
  {
    label: 'Monitor',
    items: [
      { label: 'Health', href: '/dashboard/health', icon: '💓' },
      { label: 'Observability', href: '/dashboard/observability', icon: '👁' },
      { label: 'News', href: '/news', icon: '📰' },
      { label: 'DJ Dashboard', href: '/dashboard/dj-stream', icon: '🎵' },
      { label: 'Changelog', href: '/dashboard/changelog', icon: '📋' },
    ],
  },
  {
    label: 'Data & Integrations',
    items: [
      { label: 'Knowledge Base', href: '/dashboard/knowledge', icon: '📚' },
      { label: 'Webhooks', href: '/dashboard/webhooks', icon: '🔗' },
      { label: 'Approvals', href: '/dashboard/approvals', icon: '✅' },
      { label: 'Agentic Wallet', href: '/dashboard/wallet', icon: '🪙' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Invoices', href: '/dashboard/invoice', icon: '🧾' },
      { label: 'Time Tracking', href: '/dashboard/time', icon: '⏱' },
      { label: 'Vault', href: '/dashboard/vault', icon: '🗄' },
      { label: 'Export', href: '/dashboard/export', icon: '📤' },
      { label: 'Bankr', href: '/bankr', icon: '🏦' },
      { label: 'Robinhood', href: '/dashboard/robinhood', icon: '🏹' },
    ],
  },
  {
    label: 'Platform',
    items: [
      { label: 'Voice & TTS', href: '/dashboard/voice', icon: '🎙' },
      { label: 'Stablecoins', href: '/dashboard/stablecoins', icon: '💰' },
      { label: 'Mobile', href: '/dashboard/mobile', icon: '📱' },
      { label: 'Pricing Models', href: '/dashboard/pricing-model', icon: '📊' },
    ],
  },
  {
    label: null,
    items: [
      { label: 'Billing', href: '/billing', icon: '☆' },
      { label: 'Settings', href: '/settings', icon: '⚙' },
    ],
  },
];

export const adminNavSection = {
  label: 'Admin',
  items: [
    { label: 'Admin', href: '/dashboard/admin', icon: '▣' },
  ],
};

export const allNavItems = [...navSections, adminNavSection].flatMap((s) => s.items);

const COLLAPSED_KEY = 'agentbot_sidebar_collapsed';

interface DashboardSidebarProps {
  userName?: string;
  credits?: number;
  plan?: string | null;
  runtimeUrl?: string | null;
  runtimeGatewayToken?: string | null;
  runtimeInstanceId?: string | null;
  isAdmin?: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

export const DashboardSidebar = memo(function DashboardSidebar({
  userName,
  credits = 0,
  plan,
  runtimeUrl,
  runtimeGatewayToken,
  isAdmin = false,
  isOpen,
  onToggle,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const { data: dashboardData } = useDashboardData();
  const [isPendingTransition, startTransition] = useTransition();

  // Exact match for /dashboard so it doesn't stay highlighted on every subpage
  const isItemActive = useCallback(
    (href: string) =>
      href === '/dashboard'
        ? pathname === '/dashboard'
        : pathname === href || pathname.startsWith(href + '/'),
    [pathname]
  );

  // Only close the sidebar on navigation when it's the mobile overlay
  const handleNavigate = useCallback(() => {
    if (isOpen) onToggle();
  }, [isOpen, onToggle]);
  
  const { plan: contextPlan, openclawUrl, gatewayToken } = dashboardData;
  const effectiveOpenclawUrl = runtimeUrl || openclawUrl;
  const effectiveGatewayToken = runtimeGatewayToken || gatewayToken;
  const visibleNavSections = useMemo(
    () => (isAdmin ? [...navSections, adminNavSection] : navSections),
    [isAdmin]
  );

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COLLAPSED_KEY);
      if (stored) {
        setCollapsed(JSON.parse(stored));
        return;
      }
    } catch {}
  }, []);

  const toggleSection = useCallback((label: string) => {
    startTransition(() => {
      setCollapsed((prev: Record<string, boolean>) => {
        const next = { ...prev, [label]: !prev[label] };
        try {
          localStorage.setItem(COLLAPSED_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
    });
  }, []);

  const runtimeStatus = effectiveOpenclawUrl ? (effectiveGatewayToken ? 'paired' : 'live') : 'undeployed';
  const runtimeTone =
    runtimeStatus === 'paired'
      ? 'text-green-400'
      : runtimeStatus === 'live'
        ? 'text-red-500'
        : 'text-zinc-500';
  let runtimeHost: string | null = null;
  try {
    if (effectiveOpenclawUrl) runtimeHost = new URL(effectiveOpenclawUrl).host;
  } catch {}

  return (
    <>
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-black border-r border-zinc-800 flex flex-col font-mono
        transform transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}
      >
        <button
          onClick={onToggle}
          className="md:hidden absolute top-4 right-4 p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          aria-label="Close sidebar"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <nav aria-label="Dashboard navigation" className="flex-1 overflow-y-auto pt-16 md:pt-4 pb-4">
          {/* Agent status */}
          <div className="mx-4 mb-5 border border-zinc-800 bg-zinc-950 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500">Status</div>
                <div className={`mt-1 text-xs font-bold uppercase tracking-widest ${runtimeTone}`}>
                  {runtimeStatus === 'paired' ? 'Online' : runtimeStatus === 'live' ? 'Unpaired' : 'No Agent'}
                </div>
              </div>
              <StatusDot
                state={runtimeStatus === 'paired' ? 'online' : runtimeStatus === 'live' ? 'error' : 'idle'}
                pulse={runtimeStatus === 'paired'}
              />
            </div>
            {runtimeHost && (
              <div className="mt-2 text-[10px] font-mono text-zinc-500/90 break-all">{runtimeHost}</div>
            )}
          </div>

          {/* Nav sections */}
          {visibleNavSections.map((section, i) => {
            const sectionHasActive = section.items.some((item) => isItemActive(item.href));
            const isCollapsed = !sectionHasActive && !!collapsed[section.label ?? ''];
            const hasLabel = !!section.label;

            return (
              <div key={section.label ?? `sec-${i}`} className={i > 0 ? 'mt-3' : ''}>
                {hasLabel && (
                  <button
                    onClick={() => toggleSection(section.label!)}
                    className="w-full flex items-center justify-between pl-4 pr-4 py-1 group"
                    aria-expanded={!isCollapsed}
                  >
                    <span className="text-[9px] uppercase tracking-[0.15em] text-zinc-600 group-hover:text-zinc-300 transition-colors">
                      {section.label}
                    </span>
                    <span className={`text-[8px] text-zinc-700 group-hover:text-zinc-300 transition-all duration-200 ${isCollapsed ? '' : 'rotate-180'}`}>
                      ▲
                    </span>
                  </button>
                )}

                {!isCollapsed && (
                  <div className="mt-0.5 space-y-0.5">
                    {section.items.map((item) => {
                      const isActive = isItemActive(item.href);
                      return (
                        <Link
                          key={item.label}
                          href={item.href}
                          prefetch={false}
                          onClick={handleNavigate}
                          aria-current={isActive ? 'page' : undefined}
                          className={`flex items-center gap-2 px-4 py-2 text-xs transition-colors ${
                            isActive
                              ? 'bg-orange-500/10 text-orange-400'
                              : 'text-zinc-500 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <span className={`text-[10px] w-4 text-center ${isActive ? 'text-orange-400 opacity-100' : 'opacity-60'}`}>
                            {item.icon}
                          </span>
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-white">
              {(userName || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate text-sm text-white">{userName || 'User'}</div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-500">
                {plan || contextPlan || 'Solo'} {credits > 0 ? `· ${credits} cr` : ''}
              </div>
            </div>
          </div>
          <button
            onClick={() => customSignOut()}
            className="w-full flex items-center justify-center gap-2 border border-zinc-800 px-4 py-2 text-sm text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
});
