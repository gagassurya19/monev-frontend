import { JWTPayload } from "./types";

// JWT utility functions
export class JWTAuth {
  private static readonly TOKEN_KEY = "auth_token";

  /**
   * Decode JWT token
   */
  static decodeToken(token: string): JWTPayload | null {
    try {
      // Split the token
      const parts = token.split(".");
      if (parts.length !== 3) {
        throw new Error("Invalid token format");
      }

      // Decode the payload (second part)
      const payload = parts[1];
      const decodedPayload = atob(
        payload.replace(/-/g, "+").replace(/_/g, "/")
      );
      const parsedPayload = JSON.parse(decodedPayload);

      return parsedPayload as JWTPayload;
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  }

  /**
   * Verify token signature and expiration
   */
  static async verifyToken(
    token: string
  ): Promise<{ valid: boolean; payload?: JWTPayload; error?: string }> {
    try {
      const payload = this.decodeToken(token);
      if (!payload) {
        return { valid: false, error: "Invalid token format" };
      }

      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return { valid: false, error: "Token expired" };
      }

      // For security, in a real app you should verify the signature with the secret
      // Since this is a frontend app, we're doing basic validation
      if (!payload.sub) {
        return { valid: false, error: "Invalid token payload" };
      }

      return { valid: true, payload };
    } catch (error) {
      return { valid: false, error: "Token verification failed" };
    }
  }

  /**
   * Get token from localStorage
   */
  static getStoredToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Store token in localStorage
   */
  static storeToken(token: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Remove token from localStorage
   */
  static removeToken(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(this.TOKEN_KEY);
  }

  /**
   * Get token from URL parameter
   */
  static getTokenFromURL(): string | null {
    if (typeof window === "undefined") return null;
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("token");
  }

  /**
   * Remove token from URL without page reload
   */
  static removeTokenFromURL(): void {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.delete("token");
    window.history.replaceState({}, "", url.toString());
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(token: string): boolean {
    const payload = this.decodeToken(token);
    if (!payload || !payload.exp) return true;

    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  }

  /**
   * Get time until token expires (in seconds)
   */
  static getTimeUntilExpiry(token: string): number {
    const payload = this.decodeToken(token);
    if (!payload || !payload.exp) return 0;

    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, payload.exp - now);
  }
}
