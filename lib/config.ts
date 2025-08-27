// API Configuration
export const API_CONFIG = {
  // Base URL for your API - all endpoints use localhost:3001
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001',
  
  // Default pagination settings
  DEFAULT_PAGE_SIZE: 10,
  DEFAULT_ACTIVITIES_PAGE_SIZE: 20,
  
  // Request timeout (in milliseconds)
  REQUEST_TIMEOUT: 30000,
  
  // Token storage key
  TOKEN_STORAGE_KEY: 'auth_token',
} as const;

// JWT Configuration
export const JWT_CONFIG = {
  SECRET_KEY: process.env.JWT_SECRET || 'SECRET123',
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
      ORCHESTRATE: '/api/v1/etl-cp/orchestrate',
    }
  },
  SAS: {
    FILTER: {
      FAKULTAS: '/api/v1/sas-category-subject/filter/fakultas',
      PROGRAM_STUDI: '/api/v1/sas-category-subject/filter/prodi',
      MATA_KULIAH: '/api/v1/sas-category-subject/filter/matkul',
    },
    DATA: {
      CATEGORY_SUBJECT: '/api/v1/sas/data/category-subject',
    },
    SUMMARY: {
      CHART: '/api/v1/sas/summary/chart',
      STATS: '/api/v1/sas/summary/stats',
      TABLE: '/api/v1/sas/summary/table',
    },
    ETL: {
      STATUS: '/api/v1/etl-sas/status',
      LOGS_SUBJECT_CATEGORIES_FETCH: '/api/v1/sas/etl/history',
      LOGS_REALTIME: '/api/v1/sas-etl/logs/{log}/realtime',
      CHART_FETCH: '/api/v1/sas/etl/fetch',
      CHART_CLEAR_STUCK: '/api/v1/sas/etl/clear-stuck',
    },
    ETL_CELOEAPI: {
      STATUS: '/api/v1/celoeapi/sas/etl/status',
      RUN: '/api/v1/celoeapi/sas/etl/run',
      CLEAN: '/api/v1/celoeapi/sas/etl/clean',
      LOGS: '/api/v1/celoeapi/sas/etl/logs',
      EXPORT: '/api/v1/celoeapi/sas/etl/export',
    },
    FETCH: {
      SUBJECT_CATEGORIES: '/api/v1/sas-category-subject/category-subject/run',
      LOGS_SUBJECT_CATEGORIES_FETCH: '/api/v1/sas-category-subject/category-subject/logs',
      LOGS_DETAIL_SUBJECT_CATEGORIES: '/api/v1/sas-category-subject/logs/{logId}',
      LOGS_REALTIME_SUBJECT_CATEGORIES: '/api/v1/sas-category-subject/logs/{logId}/realtime',
    },
    ETL_MONEV: {
      RUN: '/api/v1/etl-sas/run',
      HISTORY: '/api/v1/etl-sas/history',
      STATUS: '/api/v1/etl-sas/status',
      TEST_API: '/api/v1/etl-sas/test-api',
      ORCHESTRATE: '/api/v1/etl-sas/orchestrate',
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