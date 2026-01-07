import React from 'react';
import './FeedbackModal.css';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  // Use the full Google Forms embed URL provided
  const FORM_EMBED_URL = "https://docs.google.com/forms/d/e/1FAIpQLSeeDEPDYY_kRYNEazEmkLeSBq10-b-iPxpixauft-LeRqYOcQ/viewform?embedded=true";

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    } else {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="feedback-modal-overlay" onClick={handleBackdropClick}>
      <div className="feedback-modal">
        <div className="feedback-modal__header">
          <h2>Send Feedback</h2>
          <button 
            className="feedback-modal__close-button"
            onClick={onClose}
            aria-label="Close feedback form"
          >
            ×
          </button>
        </div>
        <div className="feedback-modal__content">
          <iframe
            src={FORM_EMBED_URL}
            className="feedback-modal__iframe"
            frameBorder="0"
            marginHeight={0}
            marginWidth={0}
            title="Feedback Form"
          >
            Loading feedback form...
          </iframe>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;