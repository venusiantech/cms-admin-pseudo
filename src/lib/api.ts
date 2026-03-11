import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('admin_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const adminAPI = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  // ── Stats ─────────────────────────────────────────────────────────────────
  getStats: () => api.get('/admin/stats'),

  // ── Users ─────────────────────────────────────────────────────────────────
  getAllUsers: () => api.get('/admin/users'),
  updateUserRole: (userId: string, role: 'USER' | 'SUPER_ADMIN') =>
    api.patch(`/admin/users/${userId}/role`, { role }),
  deleteUser: (userId: string) => api.delete(`/admin/users/${userId}`),

  // ── AI Prompts ────────────────────────────────────────────────────────────
  getAllPrompts: (templateKey?: string) =>
    api.get('/admin/ai-prompts', { params: templateKey ? { templateKey } : {} }),
  createPrompt: (data: {
    promptKey: string;
    promptText: string;
    promptType: 'TEXT' | 'IMAGE';
    templateKey: string;
  }) => api.post('/admin/ai-prompts', data),
  updatePrompt: (id: string, data: { promptText?: string; promptType?: 'TEXT' | 'IMAGE' }) =>
    api.put(`/admin/ai-prompts/${id}`, data),
  deletePrompt: (id: string) => api.delete(`/admin/ai-prompts/${id}`),

  // ── Websites ──────────────────────────────────────────────────────────────
  getAllWebsites: () => api.get('/admin/websites'),
  getWebsite: (id: string) => api.get(`/admin/websites/${id}`),
  updateWebsiteSettings: (id: string, data: Record<string, any>) =>
    api.put(`/admin/websites/${id}/settings`, data),
  approveAds: (id: string, approved: boolean) =>
    api.put(`/admin/websites/${id}/approve-ads`, { approved }),

  // ── Domains ───────────────────────────────────────────────────────────────
  getAllDomains: () => api.get('/admin/domains'),
  getDomain: (id: string) => api.get(`/admin/domains/${id}`),
  deleteDomain: (id: string) => api.delete(`/admin/domains/${id}`),

  // ── Leads ─────────────────────────────────────────────────────────────────
  getAllLeads: () => api.get('/admin/leads'),
  deleteLead: (id: string) => api.delete(`/admin/leads/${id}`),

  // ── Storage ───────────────────────────────────────────────────────────────
  getStorageOverview: () => api.get('/admin/storage'),
  getWebsiteStorage: (websiteId: string) => api.get(`/admin/storage/${websiteId}`),
  deleteBlogSection: (sectionId: string) => api.delete(`/admin/storage/section/${sectionId}`),
  deleteBlock: (blockId: string) => api.delete(`/admin/storage/block/${blockId}`),
  deleteAllWebsiteContent: (websiteId: string) => api.delete(`/admin/storage/${websiteId}/all-content`),

  // ── Storage Provider ─────────────────────────────────────────────────────
  getStorageProvider: () => api.get<{ provider: 'railway' | 'cloudinary' }>('/admin/storage-provider'),
  setStorageProvider: (provider: 'railway' | 'cloudinary') =>
    api.put<{ provider: 'railway' | 'cloudinary' }>('/admin/storage-provider', { provider }),

  // ── AI Provider ──────────────────────────────────────────────────────────
  getAiProviders: () =>
    api.get<{ title: 'aaddyy' | 'gemini' | 'pexels'; blog: 'aaddyy' | 'gemini' | 'pexels'; image: 'aaddyy' | 'gemini' | 'pexels' }>(
      '/admin/ai-provider'
    ),
  setAiProvider: (task: 'title' | 'blog' | 'image', provider: 'aaddyy' | 'gemini' | 'pexels') =>
    api.put<{ title: 'aaddyy' | 'gemini' | 'pexels'; blog: 'aaddyy' | 'gemini' | 'pexels'; image: 'aaddyy' | 'gemini' | 'pexels' }>(
      '/admin/ai-provider',
      { task, provider }
    ),

  // ── Gemini Model ──────────────────────────────────────────────────────────
  getGeminiModel: () =>
    api.get<{
      current: string;
      models: { id: string; label: string; bestFor: string; quota: string }[];
    }>('/admin/ai-provider/gemini-model'),
  setGeminiModel: (model: string) =>
    api.put<{
      current: string;
      models: { id: string; label: string; bestFor: string; quota: string }[];
    }>('/admin/ai-provider/gemini-model', { model }),
};

export interface PlanPayload {
  name: string;
  price: number;
  creditsPerMonth: number;
  maxWebsites: number;
  isCustom?: boolean;
  stripePriceId?: string;
}

export const billingAPI = {
  getPlans: () => api.get('/admin/billing/plans'),
  createPlan: (data: PlanPayload) => api.post('/admin/billing/plans', data),
  updatePlan: (id: string, data: Partial<PlanPayload>) => api.put(`/admin/billing/plans/${id}`, data),
  deactivatePlan: (id: string) => api.delete(`/admin/billing/plans/${id}`),
  getUserSubscription: (userId: string) => api.get(`/admin/billing/users/${userId}/subscription`),
  assignSubscription: (userId: string, planId: string, amountUsd?: number) =>
    api.post(`/admin/billing/users/${userId}/subscription`, { planId, amountUsd }),
  getCustomPlanRequests: () => api.get('/admin/billing/custom-plan-requests'),
  updateCustomPlanRequest: (id: string, data: { status?: string; adminNote?: string }) =>
    api.patch(`/admin/billing/custom-plan-requests/${id}`, data),
  assignAdHocCustomPlan: (
    userId: string,
    data: { amountUsd: number; creditsPerMonth: number; maxWebsites: number; label?: string },
  ) => api.post(`/admin/billing/users/${userId}/custom-plan`, data),
};
