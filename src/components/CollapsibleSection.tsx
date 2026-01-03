import React, { useState } from 'react';
import './CollapsibleSection.css';

interface CollapsibleSectionProps {
  id: string;
  title: string;
  isExpanded?: boolean;
  onToggle?: (id: string, isExpanded: boolean) => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  id,
  title,
  isExpanded = true,
  onToggle,
  children,
  className = '',
  disabled = false
}) => {
  const [internalExpanded, setInternalExpanded] = useState(isExpanded);
  
  // Use controlled state if onToggle is provided, otherwise use internal state
  const expanded = onToggle ? isExpanded : internalExpanded;
  
  const handleToggle = () => {
    if (disabled) return;
    
    if (onToggle) {
      // Controlled component - notify parent
      onToggle(id, !expanded);
    } else {
      // Uncontrolled component - manage internal state
      setInternalExpanded(!expanded);
    }
  };

  const sectionClasses = [
    'collapsible-section',
    expanded ? 'collapsible-section--expanded' : 'collapsible-section--collapsed',
    disabled ? 'collapsible-section--disabled' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={sectionClasses}>
      <div 
        className="collapsible-section__header"
        onClick={handleToggle}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            handleToggle();
          }
        }}
        aria-expanded={expanded}
        aria-controls={`${id}-content`}
      >
        <div className="collapsible-section__title">
          {title}
        </div>
        <div className="collapsible-section__toggle">
          <span 
            className={`collapsible-section__arrow ${expanded ? 'collapsible-section__arrow--expanded' : ''}`}
            aria-hidden="true"
          >
            ▼
          </span>
        </div>
      </div>
      
      <div 
        id={`${id}-content`}
        className="collapsible-section__content"
        aria-hidden={!expanded}
      >
        <div className="collapsible-section__body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default CollapsibleSection;