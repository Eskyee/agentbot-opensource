import { render, screen, waitFor } from '@testing-library/react'
import { CreditBadge } from '@/app/components/CreditBadge'
import { Breadcrumbs } from '@/app/components/Breadcrumbs'

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
})

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/wallet',
}))

// Mock DashboardSidebar
jest.mock('@/app/components/DashboardSidebar', () => ({
  allNavItems: [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Wallet', href: '/dashboard/wallet' },
    { label: 'Agents', href: '/dashboard/agents' },
  ],
}))

describe('React Components', () => {
  describe('CreditBadge', () => {
    it('should render nothing initially (loading state)', () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: false })
      const { container } = render(<CreditBadge />)
      expect(container.firstChild).toBeNull()
    })

    it('should render credits when loaded', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ credits: 150 }),
      })

      render(<CreditBadge />)

      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument()
      })
    })

    it('should render link to /credits', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ credits: 50 }),
      })

      render(<CreditBadge />)

      await waitFor(() => {
        const link = screen.getByText('50').closest('a')
        expect(link).toHaveAttribute('href', '/credits')
      })
    })

    it('should handle fetch errors gracefully', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))
      const { container } = render(<CreditBadge />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Breadcrumbs', () => {
    it('should render breadcrumbs for nested path', () => {
      render(<Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Wallet' }]} />)
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Wallet')).toBeInTheDocument()
    })

    it('should render back link when provided', () => {
      render(<Breadcrumbs backHref="/dashboard" backLabel="Back to Dashboard" />)
      expect(screen.getByText('← Back to Dashboard')).toBeInTheDocument()
    })

    it('should not render when only one crumb and no back link', () => {
      const { container } = render(<Breadcrumbs items={[{ label: 'Dashboard' }]} />)
      expect(container.firstChild).toBeNull()
    })

    it('should render custom items when provided', () => {
      render(<Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Settings' }]} />)
      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })
  })
})
