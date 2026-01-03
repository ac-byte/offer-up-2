import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { AdminFooter } from '../../components/AdminFooter'

describe('AdminFooter', () => {
  it('renders with collapsed state by default', () => {
    render(<AdminFooter />)
    
    // Should show the toggle button
    expect(screen.getByRole('button', { name: /show admin controls/i })).toBeInTheDocument()
    
    // Should not show admin content initially
    expect(screen.queryByText('Administrative Controls')).not.toBeInTheDocument()
  })

  it('expands and shows admin content when toggle button is clicked', () => {
    render(<AdminFooter />)
    
    const toggleButton = screen.getByRole('button', { name: /show admin controls/i })
    fireEvent.click(toggleButton)
    
    // Should show admin content after clicking
    expect(screen.getByText('Administrative Controls')).toBeInTheDocument()
    expect(screen.getByText('Debug and testing tools for development')).toBeInTheDocument()
    
    // Button text should change
    expect(screen.getByRole('button', { name: /hide admin controls/i })).toBeInTheDocument()
  })

  it('collapses admin content when toggle button is clicked again', () => {
    render(<AdminFooter />)
    
    const toggleButton = screen.getByRole('button', { name: /show admin controls/i })
    
    // Expand first
    fireEvent.click(toggleButton)
    expect(screen.getByText('Administrative Controls')).toBeInTheDocument()
    
    // Collapse again
    const hideButton = screen.getByRole('button', { name: /hide admin controls/i })
    fireEvent.click(hideButton)
    
    // Should hide admin content
    expect(screen.queryByText('Administrative Controls')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /show admin controls/i })).toBeInTheDocument()
  })

  it('renders children content when expanded', () => {
    const testContent = <div data-testid="test-content">Test Admin Content</div>
    
    render(<AdminFooter>{testContent}</AdminFooter>)
    
    const toggleButton = screen.getByRole('button', { name: /show admin controls/i })
    fireEvent.click(toggleButton)
    
    // Should render the children content
    expect(screen.getByTestId('test-content')).toBeInTheDocument()
    expect(screen.getByText('Test Admin Content')).toBeInTheDocument()
  })

  it('has proper accessibility attributes', () => {
    render(<AdminFooter />)
    
    const toggleButton = screen.getByRole('button', { name: /show admin controls/i })
    
    // Should have proper aria-label
    expect(toggleButton).toHaveAttribute('aria-label', 'Show admin controls')
    
    // After expanding
    fireEvent.click(toggleButton)
    const hideButton = screen.getByRole('button', { name: /hide admin controls/i })
    expect(hideButton).toHaveAttribute('aria-label', 'Hide admin controls')
  })
})