import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CollapsibleSection } from '../../components/CollapsibleSection';

describe('CollapsibleSection', () => {
  const defaultProps = {
    id: 'test-section',
    title: 'Test Section',
    children: <div>Test content</div>
  };

  it('renders with title and content', () => {
    render(<CollapsibleSection {...defaultProps} />);
    
    expect(screen.getByText('Test Section')).toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('starts expanded by default', () => {
    render(<CollapsibleSection {...defaultProps} />);
    
    const header = screen.getByRole('button');
    expect(header).toHaveAttribute('aria-expanded', 'true');
    
    const content = screen.getByText('Test content');
    expect(content.closest('.collapsible-section__content')).toHaveAttribute('aria-hidden', 'false');
  });

  it('can start collapsed when isExpanded is false', () => {
    render(<CollapsibleSection {...defaultProps} isExpanded={false} />);
    
    const header = screen.getByRole('button');
    expect(header).toHaveAttribute('aria-expanded', 'false');
    
    const content = screen.getByText('Test content');
    expect(content.closest('.collapsible-section__content')).toHaveAttribute('aria-hidden', 'true');
  });

  it('toggles when header is clicked', () => {
    render(<CollapsibleSection {...defaultProps} />);
    
    const header = screen.getByRole('button');
    
    // Initially expanded
    expect(header).toHaveAttribute('aria-expanded', 'true');
    
    // Click to collapse
    fireEvent.click(header);
    expect(header).toHaveAttribute('aria-expanded', 'false');
    
    // Click to expand
    fireEvent.click(header);
    expect(header).toHaveAttribute('aria-expanded', 'true');
  });

  it('calls onToggle when provided', () => {
    const onToggle = jest.fn();
    render(
      <CollapsibleSection 
        {...defaultProps} 
        isExpanded={true}
        onToggle={onToggle} 
      />
    );
    
    const header = screen.getByRole('button');
    fireEvent.click(header);
    
    expect(onToggle).toHaveBeenCalledWith('test-section', false);
  });

  it('handles keyboard navigation', () => {
    render(<CollapsibleSection {...defaultProps} />);
    
    const header = screen.getByRole('button');
    
    // Initially expanded
    expect(header).toHaveAttribute('aria-expanded', 'true');
    
    // Press Enter to toggle
    fireEvent.keyDown(header, { key: 'Enter' });
    expect(header).toHaveAttribute('aria-expanded', 'false');
    
    // Press Space to toggle
    fireEvent.keyDown(header, { key: ' ' });
    expect(header).toHaveAttribute('aria-expanded', 'true');
  });

  it('does not toggle when disabled', () => {
    render(<CollapsibleSection {...defaultProps} disabled={true} />);
    
    const header = screen.getByRole('button');
    
    // Initially expanded
    expect(header).toHaveAttribute('aria-expanded', 'true');
    
    // Click should not toggle
    fireEvent.click(header);
    expect(header).toHaveAttribute('aria-expanded', 'true');
    
    // Keyboard should not toggle
    fireEvent.keyDown(header, { key: 'Enter' });
    expect(header).toHaveAttribute('aria-expanded', 'true');
  });

  it('applies custom className', () => {
    render(<CollapsibleSection {...defaultProps} className="custom-class" />);
    
    const section = screen.getByText('Test Section').closest('.collapsible-section');
    expect(section).toHaveClass('custom-class');
  });

  it('has proper accessibility attributes', () => {
    render(<CollapsibleSection {...defaultProps} />);
    
    const header = screen.getByRole('button');
    const content = screen.getByText('Test content').closest('.collapsible-section__content');
    
    expect(header).toHaveAttribute('aria-expanded');
    expect(header).toHaveAttribute('aria-controls', 'test-section-content');
    expect(content).toHaveAttribute('id', 'test-section-content');
    expect(content).toHaveAttribute('aria-hidden');
  });

  it('shows correct arrow direction', () => {
    render(<CollapsibleSection {...defaultProps} isExpanded={true} />);
    
    let arrow = screen.getByText('▼');
    expect(arrow).toHaveClass('collapsible-section__arrow--expanded');
    
    // Click to collapse
    const header = screen.getByRole('button');
    fireEvent.click(header);
    
    arrow = screen.getByText('▼');
    expect(arrow).not.toHaveClass('collapsible-section__arrow--expanded');
  });
});