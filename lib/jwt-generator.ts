// JWT Token Generator for Browser Environment
// This creates JWT tokens compatible with backend structure

import { JWT_CONFIG } from './config';

export class JWTGenerator {
  /**
   * Base64url encoding for JWT (browser compatible)
   */
  private static base64urlEncode(str: string): string {
    // Convert to base64 first
    const base64 = btoa(str);
    
    // Replace characters according to JWT standard
    return base64
      .replace(/\+/g, '-')  // Replace + with -
      .replace(/\//g, '_')  // Replace / with _
      .replace(/=/g, '');   // Remove padding
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
    const payload = {
      id: parseInt(data.id) || 1,
      username: data.username,
      sub: data.username,
      name: data.name,
      kampus: data.kampus,
      fakultas: data.fakultas,
      prodi: data.prodi,
      admin: data.userRole === 'admin' ? 1 : 0,
      exp: now + (data.expirationMinutes * 60),
      iat: now
    };
    return this.base64urlEncode(JSON.stringify(payload));
  }

  /**
   * Create HMAC-SHA256 signature (browser compatible)
   */
  private static async createSignature(data: string, secret: string): Promise<string> {
    try {
      // Try to use Web Crypto API if available
      if (typeof crypto !== 'undefined' && crypto.subtle) {
        const encoder = new TextEncoder();
        const keyData = encoder.encode(secret);
        const messageData = encoder.encode(data);
        
        // Import key
        const key = await crypto.subtle.importKey(
          'raw',
          keyData,
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        );
        
        // Sign the data
        const signature = await crypto.subtle.sign('HMAC', key, messageData);
        
        // Convert to base64url
        const signatureArray = new Uint8Array(signature);
        const signatureBase64 = btoa(String.fromCharCode(...signatureArray));
        return this.base64urlEncode(signatureBase64);
      }
    } catch (error) {
      console.warn('Web Crypto API failed, using fallback:', error);
    }
    
    // Fallback: Simple hash function for compatibility
    let hash = 0;
    const combined = data + secret;
    
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Create a more predictable signature
    const hashString = Math.abs(hash).toString(36);
    return this.base64urlEncode(hashString);
  }

  /**
   * Generate JWT token that matches backend structure exactly
   */
  static async generateToken(data: any): Promise<string> {
    const header = this.createHeader();
    const payload = this.createPayload(data);
    const dataToSign = `${header}.${payload}`;
    
    const signature = await this.createSignature(dataToSign, JWT_CONFIG.SECRET_KEY);
    return `${header}.${payload}.${signature}`;
  }

  /**
   * Generate token URL for testing
   */
  static async generateTokenURL(data: any, baseURL?: string): Promise<string> {
    const token = await this.generateToken(data);
    const url = baseURL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    return `${url}/?token=${token}`;
  }

  /**
   * Display token information
   */
  static getTokenInfo(token: string): {
    header: any;
    payload: any;
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

  /**
   * Validate JWT token signature
   */
  static async validateToken(token: string): Promise<boolean> {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;

      const header = parts[0];
      const payload = parts[1];
      const signature = parts[2];

      const dataToSign = `${header}.${payload}`;
      const expectedSignature = await this.createSignature(dataToSign, JWT_CONFIG.SECRET_KEY);
      
      return signature === expectedSignature;
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  }

  /**
   * Get complete token validation info
   */
  static async getTokenValidationInfo(token: string): Promise<{
    isValid: boolean;
    header: any;
    payload: any;
    isExpired: boolean;
    expiresIn: number;
    signatureValid: boolean;
  } | null> {
    try {
      const tokenInfo = this.getTokenInfo(token);
      if (!tokenInfo) return null;

      const isValid = await this.validateToken(token);
      
      return {
        ...tokenInfo,
        isValid,
        signatureValid: isValid
      };
    } catch (error) {
      console.error('Error getting token validation info:', error);
      return null;
    }
  }
} 