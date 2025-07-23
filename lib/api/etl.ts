import { apiClient } from '../api-client';
import { API_ENDPOINTS, API_CONFIG } from '../config';
import {
  ETLStartResponse,
  ETLLogsResponse,
  ETLClearStuckResponse,
  ETLStreamData,
} from '../types';

/**
 * Start ETL chart process
 * @returns Promise<ETLStartResponse>
 */
export async function startETLChart(): Promise<ETLStartResponse> {
  try {
    const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.ETL.CHART_FETCH}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer default-webhook-token-change-this'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error starting ETL chart process:', error);
    throw error;
  }
}

/**
 * Get ETL chart logs with pagination
 * @param params - Query parameters for pagination
 * @returns Promise<ETLLogsResponse>
 */
export async function getETLChartLogs(params: {
  limit?: number;
  offset?: number;
} = {}): Promise<ETLLogsResponse> {
  try {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());

    const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.ETL.CHART_LOGS}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer default-webhook-token-change-this'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching ETL chart logs:', error);
    throw error;
  }
}

/**
 * Fetch ETL chart process (alternative endpoint)
 * @returns Promise<ETLStartResponse>
 */
export async function fetchETLChart(): Promise<ETLStartResponse> {
  try {
    const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.ETL.CHART_FETCH}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer default-webhook-token-change-this'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching ETL chart process:', error);
    throw error;
  }
}

/**
 * Stream ETL chart logs in real-time
 * @param logId - The log ID to stream
 * @param onMessage - Callback function to handle incoming messages
 * @param onError - Callback function to handle errors
 * @param onOpen - Callback function to handle connection open
 * @returns Function to close the stream
 */
export async function streamETLChartLogs(
  logId: string,
  onMessage: (data: string) => void,
  onError: (error: Error) => void,
  onOpen: () => void
): Promise<() => void> {
  const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.ETL.CHART_STREAM}?log_id=${logId}`;
  
  const abortController = new AbortController();
  let isStreaming = false;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer default-webhook-token-change-this',
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache'
      },
      signal: abortController.signal
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    onOpen();
    isStreaming = true;

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No response body reader available');
    }

    let buffer = ''; // Buffer untuk handle partial chunks

    const readStream = async () => {
      try {
        while (isStreaming && !abortController.signal.aborted) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          
          // Process complete lines (ending with \n\n)
          const events = buffer.split('\n\n');
          buffer = events.pop() || ''; // Keep incomplete event in buffer

          for (const event of events) {
            if (!event.trim()) continue;
            
            const lines = event.split('\n');
            let data = '';
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                data = line.substring(6).trim();
                break;
              }
            }
            
            if (data && data !== '[DONE]') {
              try {
                // Validate JSON before sending
                const parsed = JSON.parse(data);
                onMessage(data);
                
                // Handle disconnect message
                if (parsed.type === 'disconnected') {
                  isStreaming = false;
                  break;
                }
              } catch (parseError) {
                console.warn('Failed to parse SSE data:', data, parseError);
              }
            }
          }
        }
      } catch (error) {
        if (!abortController.signal.aborted && isStreaming) {
          onError(error as Error);
        }
      } finally {
        isStreaming = false;
        try {
          reader.releaseLock();
        } catch (e) {
          // Ignore release errors
        }
      }
    };

    readStream();

    // Return cleanup function
    return () => {
      isStreaming = false;
      abortController.abort();
    };

  } catch (error) {
    isStreaming = false;
    onError(error as Error);
    return () => {};
  }
}

/**
 * Clear stuck ETL chart processes
 * @returns Promise<ETLClearStuckResponse>
 */
export async function clearStuckETLChart(): Promise<ETLClearStuckResponse> {
  try {
    const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.ETL.CHART_CLEAR_STUCK}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer default-webhook-token-change-this',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error clearing stuck ETL chart processes:', error);
    throw error;
  }
} 