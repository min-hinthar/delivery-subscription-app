import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InputField } from './input-field'
import { Mail } from 'lucide-react'

describe('InputField', () => {
  describe('Rendering', () => {
    it('renders input with label', () => {
      render(<InputField label="Email" />)
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    })

    it('renders without label', () => {
      render(<InputField placeholder="Enter text" />)
      expect(screen.getByPlaceholderText(/enter text/i)).toBeInTheDocument()
    })

    it('shows required indicator when required', () => {
      render(<InputField label="Email" required />)
      expect(screen.getByText('*')).toBeInTheDocument()
      expect(screen.getByText('*')).toHaveAttribute('aria-label', 'required')
    })

    it('renders with left icon', () => {
      render(<InputField leftIcon={<Mail data-testid="left-icon" />} />)
      expect(screen.getByTestId('left-icon')).toBeInTheDocument()
    })

    it('renders with helper text', () => {
      render(<InputField helperText="We'll never share your email" />)
      expect(screen.getByText(/never share/i)).toBeInTheDocument()
    })
  })

  describe('Validation States', () => {
    it('shows error state', () => {
      render(<InputField label="Email" error="Email is required" />)
      const input = screen.getByLabelText(/email/i)

      expect(input).toHaveClass('border-red-500')
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      expect(input).toHaveAttribute('aria-invalid', 'true')
    })

    it('shows success state', () => {
      render(<InputField label="Email" success />)
      const input = screen.getByLabelText(/email/i)

      expect(input).toHaveClass('border-green-500')
      expect(screen.getByLabelText(/success/i)).toBeInTheDocument()
    })

    it('error takes precedence over success', () => {
      render(<InputField label="Email" error="Invalid" success />)
      const input = screen.getByLabelText(/email/i)

      expect(input).toHaveClass('border-red-500')
      expect(screen.getByText(/invalid/i)).toBeInTheDocument()
    })
  })

  describe('Interactions', () => {
    it('calls onChange when typing', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()

      render(<InputField onChange={handleChange} />)
      const input = screen.getByRole('textbox')

      await user.type(input, 'test')

      expect(handleChange).toHaveBeenCalled()
    })

    it('can be disabled', () => {
      render(<InputField disabled />)
      const input = screen.getByRole('textbox')

      expect(input).toBeDisabled()
      expect(input).toHaveClass('disabled:opacity-50')
    })
  })

  describe('Accessibility', () => {
    it('associates label with input', () => {
      render(<InputField label="Email Address" />)
      const input = screen.getByLabelText(/email address/i)
      expect(input).toBeInTheDocument()
    })

    it('uses aria-describedby for helper text', () => {
      render(<InputField label="Email" helperText="Helper text" />)
      const input = screen.getByLabelText(/email/i)

      expect(input).toHaveAttribute('aria-describedby')
    })

    it('uses aria-describedby for error', () => {
      render(<InputField label="Email" error="Error message" />)
      const input = screen.getByLabelText(/email/i)

      expect(input).toHaveAttribute('aria-describedby')
      expect(input).toHaveAttribute('aria-invalid', 'true')
    })

    it('error has role="alert"', () => {
      render(<InputField error="Error message" />)
      const errorMessage = screen.getByRole('alert')

      expect(errorMessage).toHaveTextContent(/error message/i)
    })
  })

  describe('Layout', () => {
    it('applies padding for left icon', () => {
      render(<InputField leftIcon={<Mail />} />)
      const input = screen.getByRole('textbox')

      expect(input).toHaveClass('pl-10')
    })

    it('applies padding for right content', () => {
      render(<InputField error="Error" />)
      const input = screen.getByRole('textbox')

      expect(input).toHaveClass('pr-10')
    })

    it('applies custom className', () => {
      render(<InputField className="custom-class" />)
      const input = screen.getByRole('textbox')

      expect(input).toHaveClass('custom-class')
    })
  })

  describe('Dark Mode', () => {
    it('has dark mode classes', () => {
      render(<InputField />)
      const input = screen.getByRole('textbox')

      expect(input).toHaveClass('dark:bg-gray-900')
      expect(input).toHaveClass('dark:border-gray-700')
      expect(input).toHaveClass('dark:text-gray-100')
    })
  })
})
