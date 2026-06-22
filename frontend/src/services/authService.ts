/**
 * Auth Service — Login, logout, and session management.
 *
 * Talks to the backend AuthModule endpoints.
 * Stores JWT in localStorage via apiClient helpers.
 */

import { api, setToken, removeToken, isAuthenticated } from './apiClient';
import type { LoginRequest, LoginResponse, User } from '@/types';

// ─── Endpoints ───────────────────────────────────────────────
const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  PROFILE: '/auth/profile',
} as const;

// ─── Service ─────────────────────────────────────────────────
export const authService = {
  /**
   * Login with email + password. Returns user + stores JWT.
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const data = await api.post<LoginResponse>(AUTH_ENDPOINTS.LOGIN, credentials);
    setToken(data.access_token);
    return data;
  },

  /**
   * Register a new user account.
   */
  async register(credentials: LoginRequest): Promise<LoginResponse> {
    const data = await api.post<LoginResponse>(AUTH_ENDPOINTS.REGISTER, credentials);
    setToken(data.access_token);
    return data;
  },

  /**
   * Logout — removes JWT and redirects to login.
   */
  logout(): void {
    removeToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },

  /**
   * Get current user profile from token.
   */
  async getProfile(): Promise<User> {
    return api.get<User>(AUTH_ENDPOINTS.PROFILE);
  },

  /**
   * Create a new user (Admin only).
   */
  async createUser(data: {
    email: string;
    password: string;
    fullName: string;
    birthDate: string;
    barAssociation: string;
  }): Promise<User> {
    return api.post<User>('/auth/create-user', data);
  },

  /**
   * List all users (Admin only).
   */
  async listUsers(): Promise<User[]> {
    return api.get<User[]>('/auth/users');
  },

  /**
   * Update user details (Admin only).
   */
  async updateUser(userId: string, data: {
    email?: string;
    password?: string;
    fullName?: string;
    birthDate?: string;
    barAssociation?: string;
    isActive?: boolean;
  }): Promise<User> {
    return api.put<User>(`/auth/users/${userId}`, data);
  },

  /**
   * Delete a user (Admin only).
   */
  async deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
    return api.delete<{ success: boolean; message: string }>(`/auth/users/${userId}`);
  },

  /**
   * Log in directly as another user (Admin only).
   */
  async impersonate(userId: string): Promise<LoginResponse> {
    return api.post<LoginResponse>(`/auth/impersonate/${userId}`);
  },

  /**
   * Check if user is currently authenticated.
   */
  isAuthenticated,
};
