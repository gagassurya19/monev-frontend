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
  CP: {
    COURSES: '/api/v1/cp/courses',
    COURSE_ACTIVITIES: (courseId: number) => `/api/v1/cp/${courseId}/activities`,
    ACTIVITY_DETAIL: (courseId: number, activityId: number, activityType: string) => `/api/v1/cp/${courseId}/${activityType}/${activityId}`,
    ETL: {
      STATUS: '/api/v1/cp/etl/status',
      LOGS: '/api/v1/cp/etl/history',
      RUN: '/api/v1/cp/etl/run',
      RUN_INCREMENTAL: '/api/v1/cp/etl/run_incremental',
      CLEAR_STUCK: '/api/v1/cp/etl/clear_stuck',
      FORCE_CLEAR: '/api/v1/cp/etl/force_clear',
    },
  },
  SAS: {
    FILTER: {
      FAKULTAS: '/api/v1/sas/filter/fakultas',
      PROGRAM_STUDI: '/api/v1/sas/filter/prodi',
      MATA_KULIAH: '/api/v1/sas/filter/matkul',
    },
    ETL: {
      STATUS: '/api/v1/sas/etl/status',
      CHART_LOGS: '/api/v1/sas/etl/history',
      // 
      CHART_FETCH: '/api/v1/sas/etl/fetch',
      CHART_STREAM: '/api/v1/sas/etl/stream',
      CHART_CLEAR_STUCK: '/api/v1/sas/etl/clear-stuck',
    },
  },
  AUTH: {
    LOGIN_ADMIN: '/api/v1/auth/login-admin',
    VALIDATE_TOKEN: '/api/v1/auth/validate-token',
    USER_PROFILE: '/api/auth/user-profile',
    REFRESH_TOKEN: '/api/auth/refresh-token',
  },
  HEALTH: {
    DETAILED: '/health/detailed',
    BASIC: '/health',
  }
} as const; 