// API Configuration
export const API_CONFIG = {
  // Base URL for your API - actual Celoe API endpoint
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8888/celoeapi/index.php',
  
  // Default pagination settings
  DEFAULT_PAGE_SIZE: 10,
  DEFAULT_ACTIVITIES_PAGE_SIZE: 20,
  
  // Request timeout (in milliseconds)
  REQUEST_TIMEOUT: 30000,
  
  // Token storage key
  TOKEN_STORAGE_KEY: 'auth_token',
} as const;

// Environment-specific configurations
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';

// API endpoints (for reference)
export const API_ENDPOINTS = {
  COURSES: '/api/courses',
  COURSE_ACTIVITIES: (courseId: number) => `/api/courses/${courseId}/activities`,
  ACTIVITY_STUDENTS: (activityId: number) => `/api/activities/${activityId}/students`,
  ETL: {
    STATUS: '/api/ETL/status',
    LOGS: '/api/ETL/logs',
    RUN: '/api/ETL/run',
    RUN_INCREMENTAL: '/api/ETL/run_incremental',
    CLEAR_STUCK: '/api/ETL/clear_stuck',
    FORCE_CLEAR: '/api/ETL/force_clear',
    DEBUG: '/api/ETL/debug',
  },
  AUTH: {
    VALIDATE_TOKEN: '/api/auth/validate-token',
    USER_PROFILE: '/api/auth/user-profile',
    REFRESH_TOKEN: '/api/auth/refresh-token',
  },
} as const; 