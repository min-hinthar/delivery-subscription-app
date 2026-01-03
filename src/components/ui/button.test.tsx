import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './button'

describe('Button', () => {
  describe('Rendering', () => {
    it('renders button with text', () => {
      render(<Button>Click me</Button>)
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
    })

    it('renders with default variant', () => {
      render(<Button>Default Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-gradient-to-r')
    })

    it('renders with ghost variant', () => {
      render(<Button variant="ghost">Ghost Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-transparent')
    })

    it('renders with secondary variant', () => {
      render(<Button variant="secondary">Secondary Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-secondary')
    })

    it('renders with destructive variant', () => {
      render(<Button variant="destructive">Delete</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-destructive')
    })

    it('applies custom className', () => {
      render(<Button className="custom-class">Custom</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })

    it('supports size variants', () => {
      render(<Button size="sm">Small</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-9')
    })

    it('supports icon size', () => {
      render(
        <Button size="icon" aria-label="Icon button">
          ★
        </Button>,
      )
      const button = screen.getByRole('button', { name: /icon button/i })
      expect(button).toHaveClass('w-11')
    })
  })

  describe('Interactions', () => {
    it('calls onClick when clicked', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()

      render(<Button onClick={handleClick}>Click me</Button>)
      await user.click(screen.getByRole('button'))

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('does not call onClick when disabled', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()

      render(<Button onClick={handleClick} disabled>Disabled</Button>)
      await user.click(screen.getByRole('button'))

      expect(handleClick).not.toHaveBeenCalled()
    })

    it('disables interactions while loading', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()

      render(
        <Button loading onClick={handleClick}>
          Submit
        </Button>,
      )
      const button = screen.getByRole('button')
      await user.click(button)

      expect(handleClick).not.toHaveBeenCalled()
      expect(button).toBeDisabled()
      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })

    it('supports keyboard interaction (Enter)', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()

      render(<Button onClick={handleClick}>Press me</Button>)
      const button = screen.getByRole('button')
      button.focus()
      await user.keyboard('{Enter}')

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('supports keyboard interaction (Space)', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()

      render(<Button onClick={handleClick}>Press me</Button>)
      const button = screen.getByRole('button')
      button.focus()
      await user.keyboard(' ')

      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('Accessibility', () => {
    it('is disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>)
      expect(screen.getByRole('button')).toBeDisabled()
    })

    it('has correct type attribute', () => {
      render(<Button type="submit">Submit</Button>)
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
    })

    it('defaults to button type', () => {
      render(<Button>Button</Button>)
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
    })

    it('forwards ref correctly', () => {
      const ref = vi.fn()
      render(<Button ref={ref}>Button</Button>)
      expect(ref).toHaveBeenCalled()
    })

    it('has visible focus state', () => {
      render(<Button>Focus me</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('focus-visible:outline-none')
      expect(button).toHaveClass('focus-visible:ring-2')
    })
  })

  describe('Motion Preferences', () => {
    it('respects prefers-reduced-motion', () => {
      render(<Button>No Motion</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('motion-reduce:transition-none')
      expect(button).toHaveClass('motion-reduce:hover:transform-none')
    })
  })
})
