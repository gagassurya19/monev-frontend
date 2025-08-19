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
      STATUS: '/api/v1/celoeapi/cp/etl/status',
      LOGS: '/api/v1/celoeapi/cp/etl/logs',
      RUN: '/api/v1/celoeapi/cp/etl/run',
      CLEAN: '/api/v1/celoeapi/cp/etl/clean',
    },
    ETL_MONEV: {
      RUN: '/api/v1/etl-cp/run',
      HISTORY: '/api/v1/etl-cp/history',
      STATUS: '/api/v1/etl-cp/status',
      TRIGGER: '/api/v1/etl-cp/test-api',
    },
    ETL_CP: {
      RUN: '/api/v1/etl-cp/run',
      HISTORY: '/api/v1/etl-cp/history',
      STATUS: '/api/v1/etl-cp/status',
      TEST_API: '/api/v1/etl-cp/test-api',
    }
  },
  SAS: {
    FILTER: {
      FAKULTAS: '/api/v1/sas/filter/fakultas',
      PROGRAM_STUDI: '/api/v1/sas/filter/prodi',
      MATA_KULIAH: '/api/v1/sas/filter/matkul',
    },
    DATA: {
      CATEGORY_SUBJECT: '/api/v1/sas/data/category-subject',
    },
    ETL: {
      STATUS: '/api/v1/sas/etl/status',
      LOGS_SUBJECT_CATEGORIES_FETCH: '/api/v1/sas/etl/history',
      LOGS_REALTIME: '/api/v1/sas-etl/logs/{log}/realtime',
      CHART_FETCH: '/api/v1/sas/etl/fetch',
      CHART_CLEAR_STUCK: '/api/v1/sas/etl/clear-stuck',
    },
    FETCH: {
      SUBJECT_CATEGORIES: '/api/v1/sas-etl/category-subject/run',
      LOGS_SUBJECT_CATEGORIES_FETCH: '/api/v1/sas-etl/category-subject/logs',
      LOGS_DETAIL_SUBJECT_CATEGORIES: '/api/v1/sas-etl/logs/{logId}',
      LOGS_REALTIME_SUBJECT_CATEGORIES: '/api/v1/sas-etl/logs/{logId}/realtime',
    }
  },
  AUTH: {
    LOGIN_ADMIN: '/api/v1/auth/login-admin',
    VALIDATE_TOKEN: '/api/v1/auth/validate-token',
    USER_PROFILE: '/api/auth/user-profile',
    REFRESH_TOKEN: '/api/auth/refresh-token',
  },
  HEALTH: {
    DETAILED: '/api/v1/health/detailed',
    BASIC: '/api/v1/health',
  }
} as const; 