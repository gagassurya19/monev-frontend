// JWT Token Generator for Testing
// This is a simplified implementation for frontend testing purposes only
// In production, tokens should be generated on the server-side

import { JWTPayload } from './types';

export class JWTGenerator {
  /**
   * Simple base64url encoding
   */
  private static base64urlEncode(str: string): string {
    return btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Create JWT header
   */
  private static createHeader(): string {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };
    return this.base64urlEncode(JSON.stringify(header));
  }

  /**
   * Create JWT payload
   */
  private static createPayload(data: any): string {
    const now = Math.floor(Date.now() / 1000);
    const payload: JWTPayload = {
      sub: data.username,
      name: data.name,
      kampus: data.kampus,
      fakultas: data.fakultas,
      prodi: data.prodi,
      admin: data.userRole === 'admin',
      exp: now + (data.expirationMinutes * 60), // Convert minutes to seconds
      iat: now
    };
    return this.base64urlEncode(JSON.stringify(payload));
  }

  /**
   * Simple HMAC SHA256 simulation (NOT SECURE - for testing only)
   * In production, use proper cryptographic libraries
   */
  private static createSignature(data: any, secret: string): string {
    // This is a simplified signature for testing purposes
    // In production, use proper HMAC SHA256
    let hash = 0;
    const combined = JSON.stringify(data) + secret;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return this.base64urlEncode(Math.abs(hash).toString(36));
  }

  /**
   * Generate a JWT token for testing
   * WARNING: This is for testing purposes only and is not cryptographically secure
   */
  static generateTestToken(data: any): string {
    const header = this.createHeader();
    const payload = this.createPayload(data);
    const signature = this.createSignature(data, 'SECRET123');
    return `${header}.${payload}.${signature}`;
  }

  /**
   * Generate token URL for testing
   */
  static generateTokenURL(data: any, baseURL?: string): string {
    const token = this.generateTestToken(data);
    const url = baseURL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    return `${url}/?token=${token}`;
  }

  /**
   * Display token information
   */
  static getTokenInfo(token: string): {
    header: any;
    payload: JWTPayload;
    isExpired: boolean;
    expiresIn: number;
  } | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      
      const now = Math.floor(Date.now() / 1000);
      const isExpired = payload.exp < now;
      const expiresIn = Math.max(0, payload.exp - now);

      return {
        header,
        payload,
        isExpired,
        expiresIn
      };
    } catch (error) {
      console.error('Error parsing token:', error);
      return null;
    }
  }
} 