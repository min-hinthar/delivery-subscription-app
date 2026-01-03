import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Home from './page'

// Mock the async Server Components
vi.mock('@/components/marketing/coverage-checker', () => ({
  CoverageChecker: () => <div data-testid="coverage-checker">Coverage Checker Mock</div>,
}))

vi.mock('@/components/marketing/weekly-menu', () => ({
  WeeklyMenu: () => <div data-testid="weekly-menu">Weekly Menu Mock</div>,
}))

describe('Homepage', () => {
  describe('Hero Section', () => {
    it('renders hero heading', () => {
      render(<Home />)
      expect(
        screen.getByRole('heading', {
          name: /authentic burmese cuisine delivered fresh every weekend/i,
        })
      ).toBeInTheDocument()
    })

    it('renders brand badge', () => {
      render(<Home />)
      expect(screen.getByText(/mandalay morning star delivery/i)).toBeInTheDocument()
    })

    it('renders hero CTAs', () => {
      render(<Home />)
      expect(screen.getByRole('link', { name: /check coverage/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /view plans/i })).toBeInTheDocument()
    })

    it('displays delivery windows', () => {
      render(<Home />)
      expect(screen.getByText(/sat 11:00–19:00 pt/i)).toBeInTheDocument()
      expect(screen.getByText(/sun 11:00–15:00 pt/i)).toBeInTheDocument()
      expect(screen.getByText(/cutoff: fri 5:00 pm/i)).toBeInTheDocument()
    })

    it('displays stats', () => {
      render(<Home />)
      expect(screen.getByText(/1000\+/)).toBeInTheDocument()
      expect(screen.getByText(/happy customers/i)).toBeInTheDocument()
      expect(screen.getByText(/4\.9★/)).toBeInTheDocument()
      expect(screen.getByText(/20\+/)).toBeInTheDocument()
      expect(screen.getByText(/weekly dishes/i)).toBeInTheDocument()
    })
  })

  describe('Why Choose Us Section', () => {
    it('renders section heading', () => {
      render(<Home />)
      expect(
        screen.getByRole('heading', { name: /why mandalay morning star\?/i })
      ).toBeInTheDocument()
    })

    it('renders all four value propositions', () => {
      render(<Home />)
      expect(screen.getByRole('heading', { name: /authentic recipes/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /flexible scheduling/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /real-time tracking/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /quality guaranteed/i })).toBeInTheDocument()
    })

    it('renders feature descriptions', () => {
      render(<Home />)
      expect(
        screen.getByText(/traditional burmese dishes prepared by experienced chefs/i)
      ).toBeInTheDocument()
      expect(
        screen.getByText(/track your driver's location and get accurate eta/i)
      ).toBeInTheDocument()
    })
  })

  describe('Coverage Section', () => {
    it('renders coverage section with heading', () => {
      render(<Home />)
      expect(
        screen.getByRole('heading', { name: /check delivery coverage/i })
      ).toBeInTheDocument()
    })

    it('has coverage anchor link', () => {
      render(<Home />)
      const section = screen.getByText(/check delivery coverage/i).closest('section')
      expect(section).toHaveAttribute('id', 'coverage')
    })

    it('renders coverage details list', () => {
      render(<Home />)
      expect(
        screen.getByText(/zip code county eligibility verification/i)
      ).toBeInTheDocument()
      expect(screen.getByText(/real-time google maps eta calculations/i)).toBeInTheDocument()
      expect(screen.getByText(/expansion waitlist for out-of-range areas/i)).toBeInTheDocument()
    })

    it('displays support email', () => {
      render(<Home />)
      const emails = screen.getAllByText(/support@morningstardelivery\.com/i)
      expect(emails.length).toBeGreaterThan(0)
    })
  })

  describe('How It Works Section', () => {
    it('renders section heading', () => {
      render(<Home />)
      expect(screen.getByRole('heading', { name: /how it works/i })).toBeInTheDocument()
    })

    it('has how-it-works anchor link', () => {
      render(<Home />)
      const section = screen.getByText(/how it works/i).closest('section')
      expect(section).toHaveAttribute('id', 'how-it-works')
    })

    it('renders all three steps', () => {
      render(<Home />)
      expect(screen.getByText(/choose your plan/i)).toBeInTheDocument()
      expect(screen.getByText(/complete onboarding/i)).toBeInTheDocument()
      expect(screen.getByText(/schedule & track/i)).toBeInTheDocument()
    })

    it('renders step descriptions', () => {
      render(<Home />)
      expect(
        screen.getByText(/subscribe to lock in your weekly delivery windows/i)
      ).toBeInTheDocument()
      expect(
        screen.getByText(/set up your profile, delivery address, and dietary preferences/i)
      ).toBeInTheDocument()
      expect(
        screen.getByText(/pick your delivery window and follow your driver in real-time/i)
      ).toBeInTheDocument()
    })

    it('renders CTAs in how it works section', () => {
      render(<Home />)
      expect(screen.getByRole('link', { name: /view pricing plans/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /start your subscription/i })).toBeInTheDocument()
    })
  })

  describe('Testimonials Section', () => {
    it('renders testimonials heading', () => {
      render(<Home />)
      expect(
        screen.getByRole('heading', { name: /what our customers say/i })
      ).toBeInTheDocument()
    })

    it('renders all three testimonials', () => {
      render(<Home />)
      expect(screen.getByText(/sarah chen/i)).toBeInTheDocument()
      expect(screen.getByText(/michael rodriguez/i)).toBeInTheDocument()
      expect(screen.getByText(/priya patel/i)).toBeInTheDocument()
    })

    it('renders testimonial quotes', () => {
      render(<Home />)
      expect(
        screen.getByText(/the mohinga is absolutely authentic/i)
      ).toBeInTheDocument()
      expect(
        screen.getByText(/i love the flexibility of choosing my delivery window/i)
      ).toBeInTheDocument()
      expect(
        screen.getByText(/finally, authentic burmese food delivered to my door/i)
      ).toBeInTheDocument()
    })

    it('renders testimonial locations', () => {
      render(<Home />)
      expect(screen.getByText(/san francisco, ca/i)).toBeInTheDocument()
      expect(screen.getByText(/oakland, ca/i)).toBeInTheDocument()
      expect(screen.getByText(/berkeley, ca/i)).toBeInTheDocument()
    })

    it('renders join community CTA', () => {
      render(<Home />)
      expect(screen.getByRole('link', { name: /join our community/i })).toBeInTheDocument()
    })
  })

  describe('Final CTA Section', () => {
    it('renders final CTA heading', () => {
      render(<Home />)
      expect(
        screen.getByRole('heading', {
          name: /ready to experience authentic burmese cuisine\?/i,
        })
      ).toBeInTheDocument()
    })

    it('renders final CTA buttons', () => {
      render(<Home />)
      const viewPlansLinks = screen.getAllByRole('link', { name: /view.*plans/i })
      expect(viewPlansLinks.length).toBeGreaterThan(0)

      expect(screen.getByRole('link', { name: /create account/i })).toBeInTheDocument()
    })
  })

  describe('Navigation Links', () => {
    it('has correct pricing links', () => {
      render(<Home />)
      const pricingLinks = screen.getAllByRole('link', { name: /view.*plan/i })
      pricingLinks.forEach((link) => {
        expect(link).toHaveAttribute('href', '/pricing')
      })
    })

    it('has correct signup links', () => {
      render(<Home />)
      const signupLinks = screen.getAllByRole('link', {
        name: /(start your subscription|join our community|create account)/i,
      })
      signupLinks.forEach((link) => {
        expect(link).toHaveAttribute('href', '/signup')
      })
    })

    it('has coverage anchor link', () => {
      render(<Home />)
      const coverageLink = screen.getByRole('link', { name: /check coverage/i })
      expect(coverageLink).toHaveAttribute('href', '#coverage')
    })
  })

  describe('Accessibility', () => {
    it('has main headings as h1', () => {
      render(<Home />)
      const h1 = screen.getByRole('heading', { level: 1 })
      expect(h1).toHaveTextContent(/authentic burmese cuisine/i)
    })

    it('has section headings as h2', () => {
      render(<Home />)
      const h2Headings = screen.getAllByRole('heading', { level: 2 })
      expect(h2Headings.length).toBeGreaterThan(0)
    })

    it('has proper aria-hidden on decorative icons', () => {
      render(<Home />)
      const { container } = render(<Home />)
      const decorativeIcons = container.querySelectorAll('[aria-hidden="true"]')
      expect(decorativeIcons.length).toBeGreaterThan(0)
    })

    it('has accessible email link', () => {
      render(<Home />)
      const emailLinks = screen.getAllByRole('link', {
        name: /support@morningstardelivery\.com/i,
      })
      expect(emailLinks.length).toBeGreaterThan(0)
      emailLinks.forEach((link) => {
        expect(link).toHaveAttribute('href', 'mailto:support@morningstardelivery.com')
      })
    })
  })

  describe('Responsive Design', () => {
    it('uses responsive spacing classes', () => {
      const { container } = render(<Home />)
      const mainDiv = container.querySelector('.space-y-24')
      expect(mainDiv).toBeInTheDocument()
    })

    it('uses responsive grid layouts', () => {
      const { container } = render(<Home />)
      const grids = container.querySelectorAll('[class*="grid"]')
      expect(grids.length).toBeGreaterThan(0)
    })
  })

  describe('Dark Mode Support', () => {
    it('has dark mode classes', () => {
      const { container } = render(<Home />)
      const darkModeElements = container.querySelectorAll('[class*="dark:"]')
      expect(darkModeElements.length).toBeGreaterThan(0)
    })
  })
})
