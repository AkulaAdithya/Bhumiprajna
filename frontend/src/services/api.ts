/**
 * Bhumi Prajna - API Client Service
 * Centralized API communication layer using Axios.
 */

import axios, { AxiosError } from 'axios';
import type { AxiosInstance } from 'axios';
import type {
  LoginRequest, TokenResponse, User, UserCreate,
  DashboardStats, GeoState, GeoDistrict, StageDefinition,
} from '../types';

const API_BASE = '/api/v1';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE,
      headers: { 'Content-Type': 'application/json' },
    });

    // Attach JWT token to every request
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('pravaah_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle 401 → redirect to login
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('pravaah_token');
          localStorage.removeItem('pravaah_user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // ========== Auth ==========

  async login(data: LoginRequest): Promise<TokenResponse> {
    const res = await this.client.post<TokenResponse>('/auth/login', data);
    return res.data;
  }

  async getMe(): Promise<User> {
    const res = await this.client.get<User>('/auth/me');
    return res.data;
  }

  // ========== Admin ==========

  async createUser(data: UserCreate): Promise<User> {
    const res = await this.client.post<User>('/admin/users', data);
    return res.data;
  }

  async listUsers(params?: Record<string, string | number | boolean>): Promise<{ users: User[]; total: number }> {
    const res = await this.client.get('/admin/users', { params });
    return res.data;
  }

  async updateUser(userId: string, data: Partial<UserCreate & { is_active: boolean }>): Promise<User> {
    const res = await this.client.put<User>(`/admin/users/${userId}`, data);
    return res.data;
  }

  // ========== Dashboard ==========

  async getDashboardStats(): Promise<DashboardStats> {
    const res = await this.client.get<DashboardStats>('/dashboard/stats');
    return res.data;
  }

  // ========== Geography ==========

  async getStates(): Promise<GeoState[]> {
    const res = await this.client.get<GeoState[]>('/geo/states');
    return res.data;
  }

  async getDistricts(state?: string): Promise<GeoDistrict[]> {
    const res = await this.client.get<GeoDistrict[]>('/geo/districts', { params: state ? { state } : {} });
    return res.data;
  }

  // ========== Stages ==========

  async getStages(): Promise<StageDefinition[]> {
    const res = await this.client.get<StageDefinition[]>('/stages');
    return res.data;
  }

  // ========== Projects (stubs — implemented in M3) ==========

  async getProjects(params?: Record<string, string | number>): Promise<{ projects: any[]; total: number }> {
    const res = await this.client.get('/projects', { params });
    return res.data;
  }

  async getProject(id: string): Promise<any> {
    const res = await this.client.get(`/projects/${id}`);
    return res.data;
  }

  async createProject(data: any): Promise<any> {
    const res = await this.client.post('/projects', data);
    return res.data;
  }

  async updateProject(id: string, data: any): Promise<any> {
    const res = await this.client.put(`/projects/${id}`, data);
    return res.data;
  }

  async predictProject(id: string): Promise<any> {
    const res = await this.client.post(`/projects/${id}/predict`);
    return res.data;
  }

  async addSnapshot(id: string, data: any): Promise<any> {
    const res = await this.client.post(`/projects/${id}/snapshots`, data);
    return res.data;
  }

  async deleteProject(id: string): Promise<{ message: string }> {
    const res = await this.client.delete(`/projects/${id}`);
    return res.data;
  }


  // ========== Notifications ==========

  async getNotifications(params?: Record<string, string | number>): Promise<{ notifications: any[]; total: number; unread: number }> {
    const res = await this.client.get('/notifications', { params });
    return res.data;
  }

  async markNotificationRead(id: string): Promise<void> {
    await this.client.put(`/notifications/${id}/read`);
  }

  // ========== Audit ==========

  async getAuditLogs(params?: Record<string, string | number>): Promise<{ logs: any[]; total: number }> {
    const res = await this.client.get('/audit', { params });
    return res.data;
  }

  // ========== Analytics ==========

  async getAnalyticsOverview(): Promise<any> {
    const res = await this.client.get('/analytics/overview');
    return res.data;
  }

  async getAnalyticsTrends(days?: number): Promise<any> {
    const res = await this.client.get('/analytics/trends', { params: days ? { days } : {} });
    return res.data;
  }

  async getDistrictComparison(state?: string): Promise<any> {
    const res = await this.client.get('/analytics/district-comparison', { params: state ? { state } : {} });
    return res.data;
  }

  // ========== GIS ==========

  async getGISProjects(params?: Record<string, string | number>): Promise<any> {
    const res = await this.client.get('/gis/projects', { params });
    return res.data;
  }

  async getGISHeatmap(): Promise<any> {
    const res = await this.client.get('/gis/heatmap');
    return res.data;
  }

  // ========== Model Governance ==========

  async listModels(): Promise<any> {
    const res = await this.client.get('/models');
    return res.data;
  }

  async getModel(version: string): Promise<any> {
    const res = await this.client.get(`/models/${version}`);
    return res.data;
  }

  async approveModel(version: string): Promise<any> {
    const res = await this.client.post(`/models/${version}/approve`);
    return res.data;
  }

  async triggerStaleCheck(): Promise<any> {
    const res = await this.client.post('/models/stale-check');
    return res.data;
  }

  // ========== Health ==========

  async healthCheck(): Promise<{ status: string; app: string; version: string }> {
    const res = await this.client.get('/health');
    return res.data;

  }
}

export const api = new ApiService();
