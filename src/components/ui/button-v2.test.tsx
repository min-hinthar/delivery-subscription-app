import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ButtonV2 } from './button-v2'

describe('ButtonV2', () => {
  describe('Rendering', () => {
    it('renders button with text', () => {
      render(<ButtonV2>Click me</ButtonV2>)
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
    })

    it('renders with default variant', () => {
      render(<ButtonV2>Default</ButtonV2>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-gradient-to-r')
      expect(button).toHaveClass('from-[#D4A574]')
    })

    it('renders with destructive variant', () => {
      render(<ButtonV2 variant="destructive">Delete</ButtonV2>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('from-red-600')
    })

    it('renders with outline variant', () => {
      render(<ButtonV2 variant="outline">Outline</ButtonV2>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('border-2')
    })

    it('renders with secondary variant', () => {
      render(<ButtonV2 variant="secondary">Secondary</ButtonV2>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-gray-200')
    })

    it('renders with ghost variant', () => {
      render(<ButtonV2 variant="ghost">Ghost</ButtonV2>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('hover:bg-gray-100')
    })

    it('renders with link variant', () => {
      render(<ButtonV2 variant="link">Link</ButtonV2>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('underline-offset-4')
    })
  })

  describe('Sizes', () => {
    it('renders with default size', () => {
      render(<ButtonV2>Default</ButtonV2>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-11')
    })

    it('renders with sm size', () => {
      render(<ButtonV2 size="sm">Small</ButtonV2>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-9')
    })

    it('renders with lg size', () => {
      render(<ButtonV2 size="lg">Large</ButtonV2>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-12')
    })

    it('renders with icon size', () => {
      render(<ButtonV2 size="icon">🔍</ButtonV2>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-11 w-11')
    })
  })

  describe('Loading State', () => {
    it('shows loading spinner when loading', () => {
      render(<ButtonV2 loading>Loading</ButtonV2>)
      const spinner = screen.getByRole('button').querySelector('svg')

      expect(spinner).toBeInTheDocument()
      expect(spinner).toHaveClass('animate-spin')
    })

    it('is disabled when loading', () => {
      render(<ButtonV2 loading>Loading</ButtonV2>)
      const button = screen.getByRole('button')

      expect(button).toBeDisabled()
    })

    it('does not call onClick when loading', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()

      render(<ButtonV2 loading onClick={handleClick}>Loading</ButtonV2>)
      await user.click(screen.getByRole('button'))

      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('Interactions', () => {
    it('calls onClick when clicked', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()

      render(<ButtonV2 onClick={handleClick}>Click me</ButtonV2>)
      await user.click(screen.getByRole('button'))

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('does not call onClick when disabled', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()

      render(<ButtonV2 onClick={handleClick} disabled>Disabled</ButtonV2>)
      await user.click(screen.getByRole('button'))

      expect(handleClick).not.toHaveBeenCalled()
    })

    it('supports keyboard interaction (Enter)', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()

      render(<ButtonV2 onClick={handleClick}>Press me</ButtonV2>)
      const button = screen.getByRole('button')
      button.focus()
      await user.keyboard('{Enter}')

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('supports keyboard interaction (Space)', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()

      render(<ButtonV2 onClick={handleClick}>Press me</ButtonV2>)
      const button = screen.getByRole('button')
      button.focus()
      await user.keyboard(' ')

      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('Accessibility', () => {
    it('is disabled when disabled prop is true', () => {
      render(<ButtonV2 disabled>Disabled</ButtonV2>)
      expect(screen.getByRole('button')).toBeDisabled()
    })

    it('has correct type attribute', () => {
      render(<ButtonV2 type="submit">Submit</ButtonV2>)
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
    })

    it('defaults to button type', () => {
      render(<ButtonV2>Button</ButtonV2>)
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
    })

    it('has visible focus state', () => {
      render(<ButtonV2>Focus me</ButtonV2>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('focus-visible:outline-none')
      expect(button).toHaveClass('focus-visible:ring-2')
    })
  })

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      render(<ButtonV2 className="custom-class">Custom</ButtonV2>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })

    it('preserves default classes with custom className', () => {
      render(<ButtonV2 className="custom-class">Custom</ButtonV2>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
      expect(button).toHaveClass('inline-flex')
    })
  })

  describe('Motion Preferences', () => {
    it('respects prefers-reduced-motion', () => {
      render(<ButtonV2>No Motion</ButtonV2>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('motion-reduce:transition-none')
      expect(button).toHaveClass('motion-reduce:active:transform-none')
    })
  })
})
