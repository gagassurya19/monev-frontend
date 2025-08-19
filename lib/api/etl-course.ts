import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/config';
import { ETLStatus, ETLLog } from '@/lib/etl-types';

/**
 * Get ETL status from the API
 * @returns Promise<ETLStatus> - ETL status data
 */
export async function getETLStatus(): Promise<ETLStatus> {
  try {
    const response = await apiClient.get<ETLStatus>(API_ENDPOINTS.CP.ETL_MONEV.STATUS);
    return response;
  } catch (error) {
    console.error('Error fetching ETL status:', error);
    throw error;
  }
}

/**
 * Get ETL logs from the API
 * @param limit - Number of logs to fetch
 * @param page - Page number for pagination
 * @returns Promise<ETLLog[]> - Array of ETL logs
 */
export async function getETLLogs(limit: number, offset: number = 1): Promise<ETLLog[]> {
  try {
    const response = await apiClient.get<{ status: boolean; data: { logs: ETLLog[] } }>(
      API_ENDPOINTS.CP.ETL.LOGS,
      { limit, offset }
    );
    return response.data?.logs || [];
  } catch (error) {
    console.error('Error fetching ETL logs:', error);
    throw error;
  }
}

/**
 * Start full ETL process
 * @returns Promise<any> - Response from the API
 */
export async function startFullETL(): Promise<any> {
  try {
    const response = await apiClient.post(API_ENDPOINTS.CP.ETL.RUN);
    return response;
  } catch (error) {
    console.error('Error starting full ETL:', error);
    throw error;
  }
}

/**
 * Start incremental ETL process
 * @returns Promise<any> - Response from the API
 */
export async function startIncrementalETL(): Promise<any> {
  try {
    const response = await apiClient.post(API_ENDPOINTS.CP.ETL.RUN_INCREMENTAL);
    return response;
  } catch (error) {
    console.error('Error starting incremental ETL:', error);
    throw error;
  }
}

/**
 * Clear stuck ETL processes
 * @returns Promise<any> - Response from the API
 */
export async function clearStuckETL(): Promise<any> {
  try {
    const response = await apiClient.post(API_ENDPOINTS.CP.ETL.CLEAR_STUCK);
    return response;
  } catch (error) {
    console.error('Error clearing stuck ETL processes:', error);
    throw error;
  }
}

/**
 * Force clear all in-progress ETL processes
 * @returns Promise<any> - Response from the API
 */
export async function forceClearAllETL(): Promise<any> {
  try {
    const response = await apiClient.post(API_ENDPOINTS.CP.ETL.FORCE_CLEAR);
    return response;
  } catch (error) {
    console.error('Error force clearing all ETL processes:', error);
    throw error;
  }
}