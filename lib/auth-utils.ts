// Simple auth utility functions for debugging

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const token = localStorage.getItem('token');
    console.log('getStoredToken:', token ? `Token found (${token.length} chars)` : 'No token');
    return token;
  } catch (error) {
    console.error('Error getting stored token:', error);
    return null;
  }
}

export function setStoredToken(token: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('token', token);
    console.log('setStoredToken: Token stored successfully');
  } catch (error) {
    console.error('Error setting stored token:', error);
  }
}

export function removeStoredToken(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem('token');
    console.log('removeStoredToken: Token removed successfully');
  } catch (error) {
    console.error('Error removing stored token:', error);
  }
}

export function isValidToken(token: string | null): boolean {
  if (!token) return false;
  
  try {
    // Basic JWT validation - check if it has 3 parts separated by dots
    const parts = token.split('.');
    const isValid = parts.length === 3;
    console.log('isValidToken:', isValid);
    return isValid;
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
}