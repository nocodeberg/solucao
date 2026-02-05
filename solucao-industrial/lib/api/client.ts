/**
 * Cliente da API Backend
 * Todas as chamadas ao banco de dados passam por aqui
 */

import type { Session, User } from '@supabase/supabase-js';
import type {
  Cargo,
  ConsumoAgua,
  Encargo,
  Employee,
  Group,
  LancamentoMO,
  Manutencao,
  Piece,
  ProductionLine,
  Profile,
} from '@/types/database.types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

type ApiMessageResponse = { message: string };

export type AuthLoginResponse = {
  user: User;
  profile: Profile;
  session: Session;
};

export type AuthMeResponse = {
  user: User;
  profile: Profile;
};

// Obter token do localStorage (client-side only)
const getToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
};

// Headers padrão
const getHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// Tratar respostas
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// =====================================================
// API CLIENT
// =====================================================

export const apiClient = {
  // GET
  get: async <T>(endpoint: string): Promise<T> => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse<T>(response);
  },

  // POST
  post: async <T>(endpoint: string, data?: unknown): Promise<T> => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<T>(response);
  },

  // PUT
  put: async <T>(endpoint: string, data: unknown): Promise<T> => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<T>(response);
  },

  // PATCH
  patch: async <T>(endpoint: string, data: unknown): Promise<T> => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<T>(response);
  },

  // DELETE
  delete: async <T>(endpoint: string): Promise<T> => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse<T>(response);
  },
};

// =====================================================
// API METHODS
// =====================================================

export const api = {
  // Auth
  auth: {
    login: (email: string, password: string) =>
      apiClient.post<AuthLoginResponse>('/auth/login', { email, password }),
    logout: () => apiClient.post<ApiMessageResponse>('/auth/logout'),
    me: () => apiClient.get<AuthMeResponse>('/auth/me'),
  },

  // Dashboard
  dashboard: {
    getStats: (params: { ano: number; mes?: number; showTotal?: boolean }) =>
      apiClient.get(`/dashboard/stats?ano=${params.ano}${params.mes ? `&mes=${params.mes}` : ''}${params.showTotal ? '&showTotal=true' : ''}`),
    getChartData: (ano: number) =>
      apiClient.get(`/dashboard/chart-data?ano=${ano}`),
  },

  // Employees
  employees: {
    list: (params?: { active?: boolean; cargo_id?: string; search?: string }) => {
      const query = new URLSearchParams();
      if (params?.active !== undefined) query.append('active', String(params.active));
      if (params?.cargo_id) query.append('cargo_id', params.cargo_id);
      if (params?.search) query.append('search', params.search);
      return apiClient.get<Employee[]>(`/employees?${query.toString()}`);
    },
    get: (id: string) => apiClient.get<Employee>(`/employees/${id}`),
    create: (data: unknown) => apiClient.post<Employee>('/employees', data),
    update: (id: string, data: unknown) => apiClient.put<Employee>(`/employees/${id}`, data),
    delete: (id: string) => apiClient.delete<ApiMessageResponse>(`/employees/${id}`),
  },

  // Production Lines
  productionLines: {
    list: () => apiClient.get<ProductionLine[]>('/production-lines'),
    create: (data: unknown) => apiClient.post<ProductionLine>('/production-lines', data),
    update: (id: string, data: unknown) => apiClient.put<ProductionLine>(`/production-lines/${id}`, data),
    delete: (id: string) => apiClient.delete<ApiMessageResponse>(`/production-lines/${id}`),
  },

  // Groups
  groups: {
    list: () => apiClient.get<Group[]>('/groups'),
    create: (data: unknown) => apiClient.post<Group>('/groups', data),
    update: (id: string, data: unknown) => apiClient.put<Group>(`/groups/${id}`, data),
    delete: (id: string) => apiClient.delete<ApiMessageResponse>(`/groups/${id}`),
  },

  // Pieces
  pieces: {
    list: () => apiClient.get<Piece[]>('/pieces'),
    create: (data: unknown) => apiClient.post<Piece>('/pieces', data),
  },

  // Manutenção
  manutencao: {
    list: () => apiClient.get<Manutencao[]>('/manutencao'),
    create: (data: unknown) => apiClient.post<Manutencao>('/manutencao', data),
  },

  // Consumo Água
  consumoAgua: {
    list: () => apiClient.get<ConsumoAgua[]>('/consumo-agua'),
    create: (data: unknown) => apiClient.post<ConsumoAgua>('/consumo-agua', data),
  },

  // Lançamento MO
  lancamentoMO: {
    list: () => apiClient.get<LancamentoMO[]>('/lancamento-mo'),
    create: (data: unknown) => apiClient.post<LancamentoMO>('/lancamento-mo', data),
  },

  // Encargos
  encargos: {
    list: () => apiClient.get<Encargo[]>('/encargos'),
    create: (data: unknown) => apiClient.post<Encargo>('/encargos', data),
    update: (id: string, data: unknown) => apiClient.put<Encargo>(`/encargos/${id}`, data),
    delete: (id: string) => apiClient.delete<ApiMessageResponse>(`/encargos/${id}`),
  },

  // Cargos
  cargos: {
    list: () => apiClient.get<Cargo[]>('/cargos'),
    create: (data: unknown) => apiClient.post<Cargo>('/cargos', data),
    update: (id: string, data: unknown) => apiClient.put<Cargo>(`/cargos/${id}`, data),
    delete: (id: string) => apiClient.delete<ApiMessageResponse>(`/cargos/${id}`),
  },
};

export default api;
