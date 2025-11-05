// Mock module for test-date-filter
// This module was created to resolve TypeScript errors

export interface DateFilterOptions {
  startDate?: Date;
  endDate?: Date;
  dateRange?: 'today' | 'week' | 'month' | 'year';
}

export const createDateFilter = (options: DateFilterOptions = {}) => {
  // Mock implementation
  return {
    getFilterString: () => {
      if (options.dateRange) {
        return `dateRange:${options.dateRange}`;
      }
      return '';
    },
    isValid: () => true,
    ...options
  };
};

export default createDateFilter;