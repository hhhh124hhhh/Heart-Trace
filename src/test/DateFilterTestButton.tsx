// Test component for date filtering functionality
import React from 'react';
import { createDateFilter } from './test-date-filter';

interface DateFilterTestButtonProps {
  label?: string;
  onClick?: () => void;
}

export const DateFilterTestButton: React.FC<DateFilterTestButtonProps> = ({
  label = 'Test Date Filter',
  onClick
}) => {
  const handleClick = () => {
    // Use environment variables safely with proper type checking
    const apiUrl = (import.meta as any).env?.VITE_APP_API_URL || 'http://localhost:3000/api';
    
    const dateFilter = createDateFilter({ dateRange: 'week' });
    console.log('Date filter created:', dateFilter.getFilterString());
    console.log('API URL:', apiUrl);
    
    if (onClick) {
      onClick();
    }
  };

  return (
    <button onClick={handleClick}>
      {label}
    </button>
  );
};

export default DateFilterTestButton;