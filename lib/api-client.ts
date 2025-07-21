import { ApiResponse, ErrorResponse } from './types';
import { API_CONFIG } from './config';

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any,
    public status?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_CONFIG.BASE_URL) {
    this.baseURL = baseURL;
    this.initializeAuth();
  }

  // Initialize authentication from localStorage or URL
  private initializeAuth(): void {
    // Try to get token from URL first (for new sessions)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token');
      
      if (urlToken) {
        this.token = urlToken;
        localStorage.setItem(API_CONFIG.TOKEN_STORAGE_KEY, urlToken);
        // Remove token from URL for security
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        // Try to get token from localStorage
        this.token = localStorage.getItem(API_CONFIG.TOKEN_STORAGE_KEY);
      }
    }
  }

  // Set authentication token
  setToken(token: string): void {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem(API_CONFIG.TOKEN_STORAGE_KEY, token);
    }
  }

  // Get authentication token
  getToken(): string | null {
    return this.token;
  }

  // Clear authentication
  clearAuth(): void {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(API_CONFIG.TOKEN_STORAGE_KEY);
    }
  }

  // Build query string from parameters
  private buildQueryString(params: Record<string, any>): string {
    const filteredParams = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    
    return filteredParams.length > 0 ? `?${filteredParams.join('&')}` : '';
  }

  // Make authenticated API request
  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    queryParams?: Record<string, any>
  ): Promise<T> {
    const url = this.baseURL + endpoint + (queryParams ? this.buildQueryString(queryParams) : '');
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Handle network errors
      throw new ApiError(
        'NETWORK_ERROR',
        'Failed to connect to the server. Please check your internet connection.',
        error,
        0
      );
    }
  }

  // Handle error responses
  private async handleErrorResponse(response: Response): Promise<never> {
    let errorData: ErrorResponse;
    
    try {
      errorData = await response.json();
    } catch {
      // If response is not JSON, create a generic error
      // For 401 errors without proper JSON, don't clear auth unless it's clearly a token issue
      if (response.status === 401) {
        console.warn('401 error without JSON response, likely endpoint not available');
        throw new ApiError(
          'ENDPOINT_NOT_AVAILABLE',
          'Authentication failed or endpoint not available',
          { status: response.status, statusText: response.statusText },
          response.status
        );
      }
      
      throw new ApiError(
        'UNKNOWN_ERROR',
        `Request failed with status ${response.status}`,
        { status: response.status, statusText: response.statusText },
        response.status
      );
    }

    // Handle authentication errors
    if (response.status === 401) {
      // Only clear auth if it's definitely a token issue (not endpoint availability)
      const shouldClearAuth = errorData.error && (
        errorData.error.code === 'EXPIRED_TOKEN' || 
        errorData.error.code === 'INVALID_TOKEN' ||
        errorData.error.code === 'MALFORMED_TOKEN' ||
        (errorData.error.message && errorData.error.message.toLowerCase().includes('expired'))
      );
      
      if (shouldClearAuth) {
        console.warn('Token appears to be expired or invalid, clearing authentication');
        this.clearAuth();
      } else {
        console.warn('401 error but token may still be valid, not clearing auth:', errorData.error);
      }
      
      const authErrorMessages: Record<string, string> = {
        'INVALID_TOKEN': 'Authentication token is invalid. Please login again.',
        'EXPIRED_TOKEN': 'Authentication token has expired. Please login again.',
        'MISSING_TOKEN': 'Authentication required. Please login first.',
      };

      const message = authErrorMessages[errorData.error?.code] || 'Authentication failed or endpoint not available.';
      
      throw new ApiError(
        errorData.error?.code || 'AUTH_ERROR',
        message,
        errorData.error?.details,
        response.status
      );
    }

    // Handle other errors
    throw new ApiError(
      errorData.error.code,
      errorData.error.message,
      errorData.error.details,
      response.status
    );
  }

  // GET request helper
  async get<T>(endpoint: string, queryParams?: Record<string, any>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' }, queryParams);
  }

  // POST request helper
  async post<T>(endpoint: string, data?: any, queryParams?: Record<string, any>): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      },
      queryParams
    );
  }

  // PUT request helper
  async put<T>(endpoint: string, data?: any, queryParams?: Record<string, any>): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      },
      queryParams
    );
  }

  // DELETE request helper
  async delete<T>(endpoint: string, queryParams?: Record<string, any>): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' }, queryParams);
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();

// Export the ApiClient class for testing or custom instances
export { ApiClient }; 