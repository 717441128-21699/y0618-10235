export type Role = 'admin' | 'project_manager' | 'designer' | 'reviewer' | 'viewer' | 'external';

export type ProjectStatus = 'active' | 'completed' | 'archived';
export type DrawingStatus = 'draft' | 'reviewing' | 'approved' | 'released';
export type ApprovalStatus = 'pending' | 'reviewing' | 'approved' | 'rejected';
export type ECNStatus = 'draft' | 'issued' | 'acknowledged';
export type AnnotationStatus = 'open' | 'resolved' | 'closed';
export type AnnotationType = 'rectangle' | 'circle' | 'arrow' | 'text';
export type ChangeType = 'new' | 'revision' | 'correction' | 'superseded';
export type FileType = 'pdf' | 'dwg' | 'dxf';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  description: string;
  status: ProjectStatus;
  ownerId: string;
  owner?: User;
  members: ProjectMember[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  projectId: string;
  userId: string;
  user?: User;
  role: 'manager' | 'member';
}

export interface Discipline {
  id: string;
  name: string;
  code: string;
  color: string;
  icon: string;
  projectId: string;
  sortOrder: number;
}

export interface Drawing {
  id: string;
  name: string;
  drawingNumber: string;
  projectId: string;
  disciplineId: string;
  discipline?: Discipline;
  latestVersionId: string;
  latestVersion?: DrawingVersion;
  status: DrawingStatus;
  createdBy: string;
  createdByUser?: User;
  createdAt: string;
  updatedAt: string;
}

export interface DrawingVersion {
  id: string;
  drawingId: string;
  version: string;
  major: number;
  minor: number;
  filePath: string;
  fileName: string;
  fileType: FileType;
  fileSize: number;
  changeDescription: string;
  changeType: ChangeType;
  createdBy: string;
  createdByUser?: User;
  createdAt: string;
  annotations?: Annotation[];
}

export interface Annotation {
  id: string;
  versionId: string;
  type: AnnotationType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  color: string;
  comment: string;
  status: AnnotationStatus;
  createdBy: string;
  createdByUser?: User;
  createdAt: string;
  replies: AnnotationReply[];
}

export interface AnnotationReply {
  id: string;
  annotationId: string;
  content: string;
  createdBy: string;
  createdByUser?: User;
  createdAt: string;
}

export interface Approval {
  id: string;
  drawingId: string;
  drawing?: Drawing;
  versionId: string;
  version?: DrawingVersion;
  title: string;
  status: ApprovalStatus;
  currentStep: number;
  createdBy: string;
  createdByUser?: User;
  createdAt: string;
  steps: ApprovalStep[];
}

export interface ApprovalStep {
  id: string;
  approvalId: string;
  stepNumber: number;
  order: number;
  role: string;
  reviewerId?: string;
  approverId?: string;
  reviewer?: User;
  approver?: User;
  status: 'pending' | 'approved' | 'rejected';
  comment?: string;
  signature?: string;
  signedBy?: string;
  signedAt?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
}

export interface ECN {
  id: string;
  ecnNumber: string;
  title: string;
  description: string;
  reason: string;
  impact: string;
  status: ECNStatus;
  createdBy: string;
  createdByUser?: User;
  createdAt: string;
  drawings: ECNDrawing[];
  notifications: ECNNotification[];
}

export interface ECNDrawing {
  ecnId: string;
  drawingId: string;
  drawing?: Drawing;
  versionId: string;
  version?: DrawingVersion;
}

export interface ECNNotification {
  id: string;
  ecnId: string;
  departmentId: string;
  department: Department;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

export interface ExternalLink {
  id: string;
  token: string;
  drawingId: string;
  drawing?: Drawing;
  versionId?: string;
  version?: DrawingVersion;
  expiresAt: string;
  accessCount: number;
  maxAccess: number;
  createdBy: string;
  createdAt: string;
  isActive: boolean;
  accessLogs: AccessLog[];
}

export interface AccessLog {
  id: string;
  linkId?: string;
  userId?: string;
  user?: User;
  drawingId: string;
  drawing?: Drawing;
  action: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
