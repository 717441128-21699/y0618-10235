import {
  mockUsers,
  mockProjects,
  mockDisciplines,
  mockDrawings,
  mockVersions,
  mockAnnotations,
  mockAnnotationReplies,
  mockApprovals,
  mockApprovalSteps,
  mockECNs,
  mockECNDrawings,
  mockECNNotifications,
  mockDepartments,
  mockExternalLinks,
  mockAccessLogs,
} from '../data/mockData.js';
import type {
  User,
  Project,
  Discipline,
  Drawing,
  DrawingVersion,
  Annotation,
  AnnotationReply,
  Approval,
  ApprovalStep,
  ECN,
  ECNDrawing,
  ECNNotification,
  Department,
  ExternalLink,
  AccessLog,
  PaginationParams,
  PaginatedResponse,
} from '../../shared/index.js';
import { v4 as uuidv4 } from 'uuid';

class DatabaseService {
  private users: User[] = [...mockUsers];
  private projects: Project[] = [...mockProjects];
  private disciplines: Discipline[] = [...mockDisciplines];
  private drawings: Drawing[] = [...mockDrawings];
  private versions: DrawingVersion[] = [...mockVersions];
  private annotations: Annotation[] = [...mockAnnotations];
  private annotationReplies: AnnotationReply[] = [...mockAnnotationReplies];
  private approvals: Approval[] = [...mockApprovals];
  private approvalSteps: ApprovalStep[] = [...mockApprovalSteps];
  private ecns: ECN[] = [...mockECNs];
  private ecnDrawings: ECNDrawing[] = [...mockECNDrawings];
  private ecnNotifications: ECNNotification[] = [...mockECNNotifications];
  private departments: Department[] = [...mockDepartments];
  private externalLinks: ExternalLink[] = [...mockExternalLinks];
  private accessLogs: AccessLog[] = [...mockAccessLogs];

  paginate<T>(items: T[], params: PaginationParams): PaginatedResponse<T> {
    const { page = 1, pageSize = 10, sortBy, sortOrder } = params;
    let result = [...items];

    if (sortBy) {
      result.sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[sortBy];
        const bVal = (b as Record<string, unknown>)[sortBy];
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortOrder === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
        }
        return 0;
      });
    }

    const total = result.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedItems = result.slice(start, end);

    return {
      items: paginatedItems,
      total,
      page,
      pageSize,
    };
  }

  findById<T extends { id: string }>(collection: T[], id: string): T | undefined {
    return collection.find(item => item.id === id);
  }

  filterByField<T>(collection: T[], field: keyof T, value: unknown): T[] {
    return collection.filter(item => item[field] === value);
  }

  create<T extends { id: string }>(collection: T[], data: Omit<T, 'id'>): T {
    const newItem = {
      ...data,
      id: uuidv4(),
    } as T;
    collection.push(newItem);
    return newItem;
  }

  update<T extends { id: string }>(collection: T[], id: string, data: Partial<T>): T | undefined {
    const index = collection.findIndex(item => item.id === id);
    if (index !== -1) {
      collection[index] = { ...collection[index], ...data };
      return collection[index];
    }
    return undefined;
  }

  delete<T extends { id: string }>(collection: T[], id: string): boolean {
    const index = collection.findIndex(item => item.id === id);
    if (index !== -1) {
      collection.splice(index, 1);
      return true;
    }
    return false;
  }

  getUsers(): User[] { return this.users; }
  getUserById(id: string): User | undefined { return this.findById(this.users, id); }
  getUserByUsername(username: string): User | undefined { return this.users.find(u => u.username === username); }
  createUser(data: Omit<User, 'id' | 'createdAt'>): User {
    return this.create(this.users, { ...data, createdAt: new Date().toISOString() });
  }
  updateUser(id: string, data: Partial<User>): User | undefined { return this.update(this.users, id, data); }

  getProjects(): Project[] { return this.projects; }
  getProjectById(id: string): Project | undefined { return this.findById(this.projects, id); }
  getProjectsByUser(userId: string): Project[] {
    return this.projects.filter(p =>
      p.ownerId === userId || p.members.some(m => m.userId === userId)
    );
  }
  createProject(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Project {
    return this.create(this.projects, {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  updateProject(id: string, data: Partial<Project>): Project | undefined {
    return this.update(this.projects, id, { ...data, updatedAt: new Date().toISOString() });
  }

  getDisciplines(): Discipline[] { return this.disciplines; }
  getDisciplineById(id: string): Discipline | undefined { return this.findById(this.disciplines, id); }
  getDisciplinesByProject(projectId: string): Discipline[] {
    return this.filterByField(this.disciplines, 'projectId', projectId).sort((a, b) => a.sortOrder - b.sortOrder);
  }
  createDiscipline(data: Omit<Discipline, 'id'>): Discipline {
    return this.create(this.disciplines, data);
  }
  updateDiscipline(id: string, data: Partial<Discipline>): Discipline | undefined {
    return this.update(this.disciplines, id, data);
  }

  getDrawings(): Drawing[] { return this.drawings; }
  getDrawingById(id: string): Drawing | undefined {
    const drawing = this.findById(this.drawings, id);
    if (drawing) {
      return {
        ...drawing,
        discipline: this.getDisciplineById(drawing.disciplineId),
        latestVersion: this.getVersionById(drawing.latestVersionId),
        createdByUser: this.getUserById(drawing.createdBy),
      };
    }
    return undefined;
  }
  getDrawingsByProject(projectId: string): Drawing[] {
    return this.filterByField(this.drawings, 'projectId', projectId).map(d => ({
      ...d,
      discipline: this.getDisciplineById(d.disciplineId),
      latestVersion: this.getVersionById(d.latestVersionId),
    }));
  }
  getDrawingsByDiscipline(disciplineId: string): Drawing[] {
    return this.filterByField(this.drawings, 'disciplineId', disciplineId).map(d => ({
      ...d,
      discipline: this.getDisciplineById(d.disciplineId),
      latestVersion: this.getVersionById(d.latestVersionId),
    }));
  }
  createDrawing(data: Omit<Drawing, 'id' | 'createdAt' | 'updatedAt'>): Drawing {
    return this.create(this.drawings, {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  updateDrawing(id: string, data: Partial<Drawing>): Drawing | undefined {
    return this.update(this.drawings, id, { ...data, updatedAt: new Date().toISOString() });
  }

  getVersions(): DrawingVersion[] { return this.versions; }
  getVersionById(id: string): DrawingVersion | undefined {
    const version = this.findById(this.versions, id);
    if (version) {
      return {
        ...version,
        createdByUser: this.getUserById(version.createdBy),
        annotations: this.getAnnotationsByVersion(version.id),
      };
    }
    return undefined;
  }
  getVersionsByDrawing(drawingId: string): DrawingVersion[] {
    return this.filterByField(this.versions, 'drawingId', drawingId)
      .sort((a, b) => b.major - a.major || b.minor - a.minor)
      .map(v => ({
        ...v,
        createdByUser: this.getUserById(v.createdBy),
        annotations: this.getAnnotationsByVersion(v.id),
      }));
  }
  createVersion(data: Partial<DrawingVersion> & Omit<DrawingVersion, 'id' | 'createdAt'> & { id?: string }): DrawingVersion {
    return this.create(this.versions, {
      ...data,
      createdAt: new Date().toISOString(),
    });
  }

  getAnnotations(): Annotation[] { return this.annotations; }
  getAnnotationById(id: string): Annotation | undefined {
    const annotation = this.findById(this.annotations, id);
    if (annotation) {
      return {
        ...annotation,
        createdByUser: this.getUserById(annotation.createdBy),
        replies: this.getAnnotationRepliesByAnnotation(annotation.id),
      };
    }
    return undefined;
  }
  getAnnotationsByVersion(versionId: string): Annotation[] {
    return this.filterByField(this.annotations, 'versionId', versionId).map(a => ({
      ...a,
      createdByUser: this.getUserById(a.createdBy),
      replies: this.getAnnotationRepliesByAnnotation(a.id),
    }));
  }
  createAnnotation(data: Omit<Annotation, 'id' | 'createdAt' | 'replies'>): Annotation {
    return this.create(this.annotations, {
      ...data,
      createdAt: new Date().toISOString(),
      replies: [],
    });
  }
  updateAnnotation(id: string, data: Partial<Annotation>): Annotation | undefined {
    return this.update(this.annotations, id, data);
  }
  createAnnotationReply(data: Omit<AnnotationReply, 'id' | 'createdAt'>): AnnotationReply {
    return this.create(this.annotationReplies, {
      ...data,
      createdAt: new Date().toISOString(),
    });
  }
  getAnnotationRepliesByAnnotation(annotationId: string): AnnotationReply[] {
    return this.filterByField(this.annotationReplies, 'annotationId', annotationId).map(r => ({
      ...r,
      createdByUser: this.getUserById(r.createdBy),
    }));
  }

  getApprovals(): Approval[] { return this.approvals; }
  getApprovalById(id: string): Approval | undefined {
    const approval = this.findById(this.approvals, id);
    if (approval) {
      return {
        ...approval,
        drawing: this.getDrawingById(approval.drawingId),
        version: this.getVersionById(approval.versionId),
        createdByUser: this.getUserById(approval.createdBy),
        steps: this.getApprovalStepsByApproval(approval.id),
      };
    }
    return undefined;
  }
  getApprovalsByDrawing(drawingId: string): Approval[] {
    return this.filterByField(this.approvals, 'drawingId', drawingId).map(a => ({
      ...a,
      drawing: this.getDrawingById(a.drawingId),
      version: this.getVersionById(a.versionId),
      createdByUser: this.getUserById(a.createdBy),
      steps: this.getApprovalStepsByApproval(a.id),
    }));
  }
  getApprovalsByReviewer(reviewerId: string): Approval[] {
    return this.approvals.filter(a =>
      a.steps.some(s => s.reviewerId === reviewerId || s.approverId === reviewerId)
    ).map(a => ({
      ...a,
      drawing: this.getDrawingById(a.drawingId),
      version: this.getVersionById(a.versionId),
      createdByUser: this.getUserById(a.createdBy),
      steps: this.getApprovalStepsByApproval(a.id),
    }));
  }
  createApproval(data: Partial<Approval> & Omit<Approval, 'id' | 'createdAt'> & { id?: string }): Approval {
    return this.create(this.approvals, {
      ...data,
      createdAt: new Date().toISOString(),
    });
  }
  updateApproval(id: string, data: Partial<Approval>): Approval | undefined {
    return this.update(this.approvals, id, data);
  }
  getApprovalStepsByApproval(approvalId: string): ApprovalStep[] {
    return this.filterByField(this.approvalSteps, 'approvalId', approvalId)
      .sort((a, b) => a.stepNumber - b.stepNumber)
      .map(s => ({
        ...s,
        order: s.order || s.stepNumber,
        reviewer: s.reviewerId ? this.getUserById(s.reviewerId) : undefined,
        approver: s.approverId ? this.getUserById(s.approverId) : (s.reviewerId ? this.getUserById(s.reviewerId) : undefined),
      }));
  }
  updateApprovalStep(stepId: string, data: Partial<ApprovalStep>): ApprovalStep | undefined {
    return this.update(this.approvalSteps, stepId, data);
  }

  createApprovalStep(data: Omit<ApprovalStep, 'id'>): ApprovalStep {
    return this.create(this.approvalSteps, data);
  }

  createECNDrawing(data: ECNDrawing): ECNDrawing {
    this.ecnDrawings.push(data);
    return data;
  }

  createECNNotification(data: Omit<ECNNotification, 'id'>): ECNNotification {
    return this.create(this.ecnNotifications, data);
  }

  getECNs(): ECN[] {
    return this.ecns
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(e => ({
        ...e,
        createdByUser: this.getUserById(e.createdBy),
        drawings: this.getECNDrawingsByECN(e.id),
        notifications: this.getECNNotificationsByECN(e.id),
      }));
  }
  getECNById(id: string): ECN | undefined {
    const ecn = this.findById(this.ecns, id);
    if (ecn) {
      return {
        ...ecn,
        createdByUser: this.getUserById(ecn.createdBy),
        drawings: this.getECNDrawingsByECN(ecn.id),
        notifications: this.getECNNotificationsByECN(ecn.id),
      };
    }
    return undefined;
  }
  createECN(data: Omit<ECN, 'id' | 'createdAt'>): ECN {
    return this.create(this.ecns, {
      ...data,
      createdAt: new Date().toISOString(),
    });
  }
  updateECN(id: string, data: Partial<ECN>): ECN | undefined {
    return this.update(this.ecns, id, data);
  }
  getECNDrawingsByECN(ecnId: string): ECNDrawing[] {
    return this.filterByField(this.ecnDrawings, 'ecnId', ecnId).map(d => ({
      ...d,
      drawing: this.getDrawingById(d.drawingId),
      version: this.getVersionById(d.versionId),
    }));
  }
  getECNNotificationsByECN(ecnId: string): ECNNotification[] {
    return this.filterByField(this.ecnNotifications, 'ecnId', ecnId).map(n => ({
      ...n,
      department: this.getDepartmentById(n.departmentId)!,
    }));
  }
  updateECNNotification(id: string, data: Partial<ECNNotification>): ECNNotification | undefined {
    return this.update(this.ecnNotifications, id, data);
  }

  getDepartments(): Department[] { return this.departments; }
  getDepartmentById(id: string): Department | undefined { return this.findById(this.departments, id); }

  getExternalLinks(): ExternalLink[] { return this.externalLinks; }
  getExternalLinkById(id: string): ExternalLink | undefined {
    const link = this.findById(this.externalLinks, id);
    if (link) {
      return {
        ...link,
        drawing: this.getDrawingById(link.drawingId),
        version: link.versionId ? this.getVersionById(link.versionId) : undefined,
        accessLogs: this.getAccessLogsByLink(link.id),
      };
    }
    return undefined;
  }
  getExternalLinkByToken(token: string): ExternalLink | undefined {
    const link = this.externalLinks.find(l => l.token === token && l.isActive);
    if (link) {
      return {
        ...link,
        drawing: this.getDrawingById(link.drawingId),
        version: link.versionId ? this.getVersionById(link.versionId) : undefined,
        accessLogs: this.getAccessLogsByLink(link.id),
      };
    }
    return undefined;
  }
  getExternalLinksByDrawing(drawingId: string): ExternalLink[] {
    return this.filterByField(this.externalLinks, 'drawingId', drawingId).map(l => ({
      ...l,
      drawing: this.getDrawingById(l.drawingId),
      version: l.versionId ? this.getVersionById(l.versionId) : undefined,
      accessLogs: this.getAccessLogsByLink(l.id),
    }));
  }
  createExternalLink(data: Omit<ExternalLink, 'id' | 'createdAt' | 'accessCount'>): ExternalLink {
    return this.create(this.externalLinks, {
      ...data,
      createdAt: new Date().toISOString(),
      accessCount: 0,
    });
  }
  updateExternalLink(id: string, data: Partial<ExternalLink>): ExternalLink | undefined {
    return this.update(this.externalLinks, id, data);
  }
  incrementLinkAccessCount(linkId: string): void {
    const link = this.findById(this.externalLinks, linkId);
    if (link) {
      link.accessCount++;
    }
  }

  getAccessLogsByDrawing(drawingId: string): AccessLog[] {
    return this.filterByField(this.accessLogs, 'drawingId', drawingId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(l => ({
        ...l,
        accessedAt: l.accessedAt || l.createdAt,
        externalViewer: l.externalViewer || (l.userId ? undefined : '外部访客'),
        user: l.userId ? this.getUserById(l.userId) : undefined,
        drawing: this.getDrawingById(l.drawingId),
      }));
  }
  getAccessLogsByLink(linkId: string): AccessLog[] {
    return this.filterByField(this.accessLogs, 'linkId', linkId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(l => ({
        ...l,
        accessedAt: l.accessedAt || l.createdAt,
        externalViewer: l.externalViewer || '外部访客',
        user: l.userId ? this.getUserById(l.userId) : undefined,
        drawing: this.getDrawingById(l.drawingId),
      }));
  }
  getAccessLogsByUser(userId: string): AccessLog[] {
    return this.filterByField(this.accessLogs, 'userId', userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(l => ({
        ...l,
        accessedAt: l.accessedAt || l.createdAt,
        user: this.getUserById(l.userId),
        drawing: this.getDrawingById(l.drawingId),
      }));
  }
  getAccessLogs(): AccessLog[] {
    return this.accessLogs
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(l => ({
        ...l,
        accessedAt: l.accessedAt || l.createdAt,
        externalViewer: l.externalViewer || (l.userId ? undefined : '外部访客'),
        user: l.userId ? this.getUserById(l.userId) : undefined,
        drawing: this.getDrawingById(l.drawingId),
      }));
  }
  createAccessLog(data: Omit<AccessLog, 'id' | 'createdAt'> & { accessedAt?: string; externalViewer?: string }): AccessLog {
    const now = new Date().toISOString();
    return this.create(this.accessLogs, {
      ...data,
      createdAt: now,
      accessedAt: data.accessedAt || now,
      externalViewer: data.userId ? undefined : (data.externalViewer || '外部访客'),
    });
  }
}

export const db = new DatabaseService();
export default db;
