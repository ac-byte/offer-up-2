import React from 'react';
import './FeedbackButton.css';

interface FeedbackButtonProps {
  onClick: () => void;
}

export const FeedbackButton: React.FC<FeedbackButtonProps> = ({ onClick }) => {
  return (
    <button
      className="feedback-button"
      onClick={onClick}
      aria-label="Open feedback form"
      title="Send feedback"
    >
      💬
    </button>
  );
};

export default FeedbackButton;