
/**
 * API Utilities
 *
 * Provides utilities for making API calls to the backend.
 * Automatically reads backend URL from app.json configuration.
 *
 * Features:
 * - Automatic backend URL configuration
 * - Error handling with proper logging
 * - Type-safe request/response handling
 * - Helper functions for common HTTP methods
 * - Automatic bearer token management for authenticated requests
 *
 * Usage:
 * 1. Import BACKEND_URL or helper functions
 * 2. Use apiCall() for basic requests
 * 3. Use apiGet(), apiPost(), etc. for convenience
 * 4. Use authenticatedApiCall() for requests requiring auth (token auto-retrieved)
 * 5. Backend URL is automatically configured in app.json when backend deploys
 */

import Constants from "expo-constants";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

/**
 * Backend URL is configured in app.json under expo.extra.backendUrl
 * It is set automatically when the backend is deployed
 */
export const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || "";
export const API_URL = BACKEND_URL; // Alias for compatibility

// Log backend URL for debugging
console.log("[API] Backend URL configured:", BACKEND_URL || "NOT CONFIGURED");

/**
 * Bearer token storage key
 * Must match the key used in lib/auth.ts for BetterAuth
 */
const BEARER_TOKEN_KEY = "indigo-habits_bearer_token";

/**
 * Check if backend is properly configured
 */
export const isBackendConfigured = (): boolean => {
  return !!BACKEND_URL && BACKEND_URL.length > 0;
};

/**
 * Get bearer token from platform-specific storage
 * Web: localStorage (BetterAuth stores it here)
 * Native: SecureStore (BetterAuth expo client stores it here)
 *
 * @returns Bearer token or null if not found
 */
export const getBearerToken = async (): Promise<string | null> => {
  try {
    if (Platform.OS === "web") {
      // BetterAuth stores the token with this key on web
      const token = localStorage.getItem(BEARER_TOKEN_KEY);
      if (token) return token;
      
      // Also check the better-auth session storage
      const sessionData = localStorage.getItem("better-auth.session_token");
      if (sessionData) return sessionData;
      
      return null;
    } else {
      // On native, BetterAuth expo client uses SecureStore with prefix
      const token = await SecureStore.getItemAsync(BEARER_TOKEN_KEY);
      if (token) return token;
      
      // Also check the better-auth prefixed key
      const sessionToken = await SecureStore.getItemAsync("indigo-habits.session_token");
      if (sessionToken) return sessionToken;
      
      return null;
    }
  } catch (error) {
    console.error("[API] Error retrieving bearer token:", error);
    return null;
  }
};

/**
 * Store bearer token in platform-specific storage
 */
export const setBearerToken = async (token: string): Promise<void> => {
  try {
    if (Platform.OS === "web") {
      localStorage.setItem(BEARER_TOKEN_KEY, token);
    } else {
      await SecureStore.setItemAsync(BEARER_TOKEN_KEY, token);
    }
  } catch (error) {
    console.error("[API] Error storing bearer token:", error);
  }
};

/**
 * Clear bearer token from storage
 */
export const clearBearerToken = async (): Promise<void> => {
  try {
    if (Platform.OS === "web") {
      localStorage.removeItem(BEARER_TOKEN_KEY);
    } else {
      await SecureStore.deleteItemAsync(BEARER_TOKEN_KEY);
    }
  } catch (error) {
    console.error("[API] Error clearing bearer token:", error);
  }
};

/**
 * Generic API call helper with error handling
 *
 * @param endpoint - API endpoint path (e.g., '/users', '/auth/login')
 * @param options - Fetch options (method, headers, body, etc.)
 * @returns Parsed JSON response
 * @throws Error if backend is not configured or request fails
 */
export const apiCall = async <T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> => {
  if (!isBackendConfigured()) {
    throw new Error("Backend URL not configured. Please rebuild the app.");
  }

  const url = `${BACKEND_URL}${endpoint}`;
  console.log("[API] Calling:", url, options?.method || "GET");

  try {
    // Prepare headers - don't set Content-Type for FormData (browser will set it with boundary)
    const headers: Record<string, string> = { ...options?.headers } as Record<string, string>;
    const isFormData = options?.body instanceof FormData;
    
    if (!isFormData && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 204 No Content responses
    if (response.status === 204) {
      console.log("[API] Success: 204 No Content");
      return {} as T;
    }

    // Handle different response types
    const contentType = response.headers.get("content-type");
    let data;
    
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = text ? { message: text } : {};
    }

    if (!response.ok) {
      console.error("[API] Error response:", response.status, data);
      throw new Error(data.message || `API error: ${response.status}`);
    }

    console.log("[API] Success:", data);
    return data;
  } catch (error: any) {
    console.error("[API] Request failed:", error);
    
    // Provide more helpful error messages
    if (error.message === "Network request failed" || error.message === "Failed to fetch") {
      throw new Error("Network error. Please check your internet connection.");
    }
    
    throw error;
  }
};

/**
 * GET request helper
 */
export const apiGet = async <T = any>(endpoint: string): Promise<T> => {
  return apiCall<T>(endpoint, { method: "GET" });
};

/**
 * POST request helper
 */
export const apiPost = async <T = any>(
  endpoint: string,
  data: any
): Promise<T> => {
  return apiCall<T>(endpoint, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

/**
 * PUT request helper
 */
export const apiPut = async <T = any>(
  endpoint: string,
  data: any
): Promise<T> => {
  return apiCall<T>(endpoint, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

/**
 * PATCH request helper
 */
export const apiPatch = async <T = any>(
  endpoint: string,
  data: any
): Promise<T> => {
  return apiCall<T>(endpoint, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

/**
 * DELETE request helper
 */
export const apiDelete = async <T = any>(endpoint: string): Promise<T> => {
  return apiCall<T>(endpoint, { method: "DELETE" });
};

/**
 * Authenticated API call helper
 * On web: Uses cookies (BetterAuth default)
 * On native: Uses Bearer token from SecureStore
 *
 * @param endpoint - API endpoint path
 * @param options - Fetch options (method, headers, body, etc.)
 * @returns Parsed JSON response
 * @throws Error if token not found or request fails
 */
export const authenticatedApiCall = async <T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> => {
  // On web, BetterAuth uses cookies automatically
  if (Platform.OS === "web") {
    return apiCall<T>(endpoint, {
      ...options,
      credentials: "include", // Include cookies for authentication
      headers: {
        ...options?.headers,
      },
    });
  }

  // On native, use Bearer token
  const token = await getBearerToken();

  if (!token) {
    throw new Error("Authentication token not found. Please sign in.");
  }

  return apiCall<T>(endpoint, {
    ...options,
    headers: {
      ...options?.headers,
      Authorization: `Bearer ${token}`,
    },
  });
};

/**
 * Authenticated GET request
 */
export const authenticatedGet = async <T = any>(endpoint: string): Promise<T> => {
  return authenticatedApiCall<T>(endpoint, { method: "GET" });
};

/**
 * Authenticated POST request
 */
export const authenticatedPost = async <T = any>(
  endpoint: string,
  data?: any
): Promise<T> => {
  return authenticatedApiCall<T>(endpoint, {
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  });
};

/**
 * Authenticated PUT request
 */
export const authenticatedPut = async <T = any>(
  endpoint: string,
  data?: any
): Promise<T> => {
  return authenticatedApiCall<T>(endpoint, {
    method: "PUT",
    body: data ? JSON.stringify(data) : undefined,
  });
};

/**
 * Authenticated PATCH request
 */
export const authenticatedPatch = async <T = any>(
  endpoint: string,
  data?: any
): Promise<T> => {
  return authenticatedApiCall<T>(endpoint, {
    method: "PATCH",
    body: data ? JSON.stringify(data) : undefined,
  });
};

/**
 * Authenticated DELETE request
 */
export const authenticatedDelete = async <T = any>(endpoint: string): Promise<T> => {
  return authenticatedApiCall<T>(endpoint, { method: "DELETE" });
};
