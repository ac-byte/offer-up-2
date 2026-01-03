import React, { useState } from 'react'
import './AdminFooter.css'

interface AdminFooterProps {
  children?: React.ReactNode
}

export const AdminFooter: React.FC<AdminFooterProps> = ({ children }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <div className="admin-footer">
      <div className="admin-footer-toggle">
        <button 
          className="admin-toggle-button"
          onClick={toggleExpanded}
          aria-label={isExpanded ? 'Hide admin controls' : 'Show admin controls'}
        >
          <span className="admin-toggle-icon">
            {isExpanded ? '▼' : '▲'}
          </span>
          <span className="admin-toggle-text">
            {isExpanded ? 'Hide Admin Tools' : 'Show Admin Tools'}
          </span>
        </button>
      </div>
      
      {isExpanded && (
        <div className="admin-footer-content">
          <div className="admin-content-header">
            <h4>Administrative Controls</h4>
            <p>Debug and testing tools for development</p>
          </div>
          <div className="admin-controls">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}