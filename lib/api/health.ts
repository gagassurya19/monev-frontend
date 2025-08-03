import { apiClient } from '../api-client';
import { API_ENDPOINTS } from '../config';

export interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  message?: string;
}

export interface MemoryUsage {
  rss: string;
  heapTotal: string;
  heapUsed: string;
  external: string;
}

export interface HealthChecks {
  database: HealthCheck;
  memory: HealthCheck & {
    usage: MemoryUsage;
  };
}

export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  service: string;
  version: string;
  environment: string;
  checks: HealthChecks;
}

/**
 * Get detailed health status of the backend service
 */
export const getHealthStatus = async (): Promise<HealthResponse> => {
  return apiClient.get<HealthResponse>(API_ENDPOINTS.HEALTH.DETAILED);
};

/**
 * Get basic health status
 */
export const getBasicHealth = async (): Promise<{ status: string }> => {
  return apiClient.get<{ status: string }>(API_ENDPOINTS.HEALTH.BASIC);
}; 