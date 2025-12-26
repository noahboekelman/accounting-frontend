const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

interface RequestConfig extends RequestInit {
  skipAuth?: boolean;
  isRetry?: boolean;
  skipAuthRedirect?: boolean;
}

class HttpClient {
  private baseURL: string;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async refreshAccessToken(): Promise<boolean> {
    // If there's already a refresh in progress, return that promise
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${this.baseURL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include', // Important: send cookies
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          return false;
        }

        return true;
      } catch (error) {
        console.error('Token refresh failed:', error);
        return false;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  async request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const { skipAuth, isRetry, skipAuthRedirect, ...fetchConfig } = config;
    
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Merge with any existing headers
    if (fetchConfig.headers) {
      const headersInit = fetchConfig.headers;
      if (headersInit instanceof Headers) {
        headersInit.forEach((value, key) => {
          headers[key] = value;
        });
      } else if (Array.isArray(headersInit)) {
        headersInit.forEach(([key, value]) => {
          headers[key] = value;
        });
      } else {
        Object.assign(headers, headersInit);
      }
    }

    try {
      const response = await fetch(url, {
        ...fetchConfig,
        headers,
        credentials: 'include', // Important: send and receive cookies
      });

      // Handle 401 - Unauthorized (immediate redirect to login)
      if (response.status === 401 && !skipAuth) {
        if (!skipAuthRedirect && typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error('Authentication failed');
      }

      // Handle 422 - Check for expired signature
      if (response.status === 422 && !isRetry && !skipAuth) {
        try {
          const errorData = await response.json();
          if (errorData.detail === 'Signature has expired') {
            // Try to refresh the token
            const refreshed = await this.refreshAccessToken();
            
            if (refreshed) {
              // Retry the request with the new token (now in cookie)
              return this.request<T>(endpoint, { ...config, isRetry: true });
            } else {
              // Refresh failed, redirect to login (unless skipAuthRedirect is true)
              if (!skipAuthRedirect && typeof window !== 'undefined') {
                window.location.href = '/login';
              }
              throw new Error('Session expired');
            }
          }
          // If it's a different 422 error, throw it
          throw new Error(errorData.detail || `Validation error: ${response.status}`);
        } catch (error) {
          if (error instanceof Error) {
            throw error;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `HTTP error! status: ${response.status}`);
      }

      // Handle 204 No Content responses
      if (response.status === 204) {
        return undefined as T;
      }

      return response.json();
    } catch (error) {
      console.error('Request failed:', error);
      throw error;
    }
  }

  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  async patch<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

// Export a singleton instance
export const httpClient = new HttpClient();
export default httpClient;
