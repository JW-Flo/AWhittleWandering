import React from 'react';

interface ErrorMessageProps {
  message: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  return (
    <div className="error-container">
      <div className="error-icon">⚠️</div>
      <p>{message}</p>
    </div>
  );
};

export default ErrorMessage;
