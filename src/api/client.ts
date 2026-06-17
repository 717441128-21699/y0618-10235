import axios from 'axios';
import type {
  User,
  LoginRequest,
  LoginResponse,
  ApiResponse,
  Project,
  Drawing,
  DrawingVersion,
  Annotation,
  AnnotationReply,
  Approval,
  ECN,
  ExternalLink,
  AccessLog,
  Department,
  PaginatedResponse,
} from '../../shared/index.js';

const API_BASE_URL = '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<ApiResponse<LoginResponse>>('/auth/login', data),

  logout: () =>
    apiClient.post<ApiResponse<void>>('/auth/logout'),

  getCurrentUser: () =>
    apiClient.get<ApiResponse<User>>('/auth/me'),
};

export const projectApi = {
  getProjects: (params?: { page?: number; pageSize?: number; search?: string }) =>
    apiClient.get<ApiResponse<PaginatedResponse<Project>>>('/projects', { params }),

  getProject: (id: string) =>
    apiClient.get<ApiResponse<Project>>(`/projects/${id}`),

  createProject: (data: Partial<Project>) =>
    apiClient.post<ApiResponse<Project>>('/projects', data),

  updateProject: (id: string, data: Partial<Project>) =>
    apiClient.put<ApiResponse<Project>>(`/projects/${id}`, data),

  getDisciplines: (projectId: string) =>
    apiClient.get<ApiResponse<Discipline[]>>(`/projects/${projectId}/disciplines`),
};

export const drawingApi = {
  getDrawings: (params?: { projectId?: string; disciplineId?: string; search?: string; status?: string }) =>
    apiClient.get<ApiResponse<Drawing[]>>('/drawings', { params }),

  getDrawing: (id: string) =>
    apiClient.get<ApiResponse<Drawing>>(`/drawings/${id}`),

  createDrawing: (data: Partial<Drawing> & { changeDescription?: string }) =>
    apiClient.post<ApiResponse<Drawing>>('/drawings', data),

  updateDrawing: (id: string, data: Partial<Drawing>) =>
    apiClient.put<ApiResponse<Drawing>>(`/drawings/${id}`, data),

  getVersions: (drawingId: string) =>
    apiClient.get<ApiResponse<DrawingVersion[]>>(`/drawings/${drawingId}/versions`),

  createVersion: (drawingId: string, data: Partial<DrawingVersion>) =>
    apiClient.post<ApiResponse<DrawingVersion>>(`/drawings/${drawingId}/versions`, data),

  getVersion: (id: string) =>
    apiClient.get<ApiResponse<DrawingVersion>>(`/drawings/versions/${id}`),

  getAnnotations: (versionId: string) =>
    apiClient.get<ApiResponse<Annotation[]>>(`/drawings/versions/${versionId}/annotations`),

  createAnnotation: (versionId: string, data: Partial<Annotation>) =>
    apiClient.post<ApiResponse<Annotation>>(`/drawings/versions/${versionId}/annotations`, data),

  updateAnnotation: (id: string, data: Partial<Annotation>) =>
    apiClient.put<ApiResponse<Annotation>>(`/drawings/annotations/${id}`, data),

  createAnnotationReply: (id: string, data: { content: string }) =>
    apiClient.post<ApiResponse<AnnotationReply>>(`/drawings/annotations/${id}/replies`, data),
};

export const approvalApi = {
  getApprovals: (params?: { status?: string; drawingId?: string }) =>
    apiClient.get<ApiResponse<Approval[]>>('/approvals', { params }),

  getApproval: (id: string) =>
    apiClient.get<ApiResponse<Approval>>(`/approvals/${id}`),

  createApproval: (data: { drawingId: string; versionId: string; title: string; steps: any[] }) =>
    apiClient.post<ApiResponse<Approval>>('/approvals', data),

  signApproval: (approvalId: string, stepId: string, data: { comment?: string; signature?: string }) =>
    apiClient.post<ApiResponse<any>>(`/approvals/${approvalId}/steps/${stepId}/sign`, data),

  rejectApproval: (id: string, data: { comment: string }) =>
    apiClient.post<ApiResponse<Approval>>(`/approvals/${id}/reject`, data),
};

export const ecnApi = {
  getECNs: (params?: { status?: string }) =>
    apiClient.get<ApiResponse<ECN[]>>('/ecns', { params }),

  getECN: (id: string) =>
    apiClient.get<ApiResponse<ECN>>(`/ecns/${id}`),

  createECN: (data: Partial<ECN> & { drawingIds?: string[]; departmentIds?: string[] }) =>
    apiClient.post<ApiResponse<ECN>>('/ecns', data),

  issueECN: (id: string) =>
    apiClient.post<ApiResponse<ECN>>(`/ecns/${id}/issue`),

  acknowledgeECN: (id: string, notificationId: string) =>
    apiClient.post<ApiResponse<any>>(`/ecns/${id}/acknowledge`, { notificationId }),

  getDepartments: () =>
    apiClient.get<ApiResponse<Department[]>>('/ecns/departments/list'),
};

export const externalApi = {
  getLinks: (params?: { drawingId?: string }) =>
    apiClient.get<ApiResponse<ExternalLink[]>>('/links', { params }),

  createLink: (data: { drawingId: string; versionId?: string; expiresAt?: string; maxAccess?: number }) =>
    apiClient.post<ApiResponse<ExternalLink>>('/links', data),

  updateLink: (id: string, data: Partial<ExternalLink>) =>
    apiClient.put<ApiResponse<ExternalLink>>(`/links/${id}`, data),

  getExternalDrawing: (token: string) =>
    apiClient.get<ApiResponse<any>>(`/${token}`),

  getAccessLogs: (params?: { drawingId?: string; userId?: string; linkId?: string }) =>
    apiClient.get<ApiResponse<AccessLog[]>>('/audit/access-logs', { params }),
};

export const userApi = {
  getUsers: (params?: { role?: string; isActive?: boolean }) =>
    apiClient.get<ApiResponse<User[]>>('/users', { params }),

  getRoles: () =>
    apiClient.get<ApiResponse<{ value: string; label: string }[]>>('/users/roles'),

  getUser: (id: string) =>
    apiClient.get<ApiResponse<User>>(`/users/${id}`),

  createUser: (data: Partial<User> & { password?: string }) =>
    apiClient.post<ApiResponse<User>>('/users', data),

  updateUser: (id: string, data: Partial<User>) =>
    apiClient.put<ApiResponse<User>>(`/users/${id}`, data),
};

export default apiClient;
