// Export all API functions
export * from './courses';
export * from './activities';

// Export API client and types
export { apiClient, ApiClient, ApiError } from '../api-client';
export * from '../types';

// Utility functions for common API operations
export { useApiQuery, useApiMutation, useActivityStudents } from './hooks'; 