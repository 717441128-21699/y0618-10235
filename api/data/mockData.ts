import { v4 as uuidv4 } from 'uuid';
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
} from '../../shared/index.js';

const now = new Date();
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();

export const mockUsers: User[] = [
  {
    id: 'admin',
    username: 'admin',
    name: '系统管理员',
    email: 'admin@example.com',
    role: 'admin',
    isActive: true,
    createdAt: daysAgo(365),
  },
  {
    id: 'pm01',
    username: 'pm01',
    name: '张经理',
    email: 'pm01@example.com',
    role: 'project_manager',
    isActive: true,
    createdAt: daysAgo(300),
  },
  {
    id: 'designer01',
    username: 'designer01',
    name: '李设计',
    email: 'designer01@example.com',
    role: 'designer',
    isActive: true,
    createdAt: daysAgo(200),
  },
  {
    id: 'designer02',
    username: 'designer02',
    name: '王设计',
    email: 'designer02@example.com',
    role: 'designer',
    isActive: true,
    createdAt: daysAgo(180),
  },
  {
    id: 'reviewer01',
    username: 'reviewer01',
    name: '赵审校',
    email: 'reviewer01@example.com',
    role: 'reviewer',
    isActive: true,
    createdAt: daysAgo(250),
  },
  {
    id: 'reviewer02',
    username: 'reviewer02',
    name: '钱审校',
    email: 'reviewer02@example.com',
    role: 'reviewer',
    isActive: true,
    createdAt: daysAgo(220),
  },
  {
    id: 'viewer01',
    username: 'viewer01',
    name: '孙工',
    email: 'viewer01@example.com',
    role: 'viewer',
    isActive: true,
    createdAt: daysAgo(150),
  },
  {
    id: 'viewer02',
    username: 'viewer02',
    name: '周工',
    email: 'viewer02@example.com',
    role: 'viewer',
    isActive: true,
    createdAt: daysAgo(120),
  },
];

export const mockDepartments: Department[] = [
  { id: 'dept001', name: '生产部', code: 'PROD' },
  { id: 'dept002', name: '采购部', code: 'PURC' },
  { id: 'dept003', name: '质量部', code: 'QUAL' },
  { id: 'dept004', name: '施工部', code: 'CONS' },
  { id: 'dept005', name: '研发部', code: 'RND' },
];

export const mockProjects: Project[] = [
  {
    id: 'proj001',
    name: '智能制造车间项目',
    code: 'IMC-2024',
    description: '新建智能制造车间，包含生产线设计、自动化设备集成、智能仓储系统等。项目总投资2.5亿元，预计工期18个月。',
    status: 'active',
    ownerId: 'pm01',
    owner: mockUsers.find(u => u.id === 'pm01'),
    members: [
      { projectId: 'proj001', userId: 'pm01', user: mockUsers.find(u => u.id === 'pm01'), role: 'manager' },
      { projectId: 'proj001', userId: 'designer01', user: mockUsers.find(u => u.id === 'designer01'), role: 'member' },
      { projectId: 'proj001', userId: 'designer02', user: mockUsers.find(u => u.id === 'designer02'), role: 'member' },
      { projectId: 'proj001', userId: 'reviewer01', user: mockUsers.find(u => u.id === 'reviewer01'), role: 'member' },
      { projectId: 'proj001', userId: 'viewer01', user: mockUsers.find(u => u.id === 'viewer01'), role: 'member' },
    ],
    createdAt: daysAgo(180),
    updatedAt: daysAgo(1),
  },
  {
    id: 'proj002',
    name: '商业综合体建筑项目',
    code: 'CC-2024',
    description: '大型商业综合体，包含购物中心、甲级写字楼、五星级酒店、精装公寓等多功能建筑群。总建筑面积30万平方米。',
    status: 'active',
    ownerId: 'pm01',
    owner: mockUsers.find(u => u.id === 'pm01'),
    members: [
      { projectId: 'proj002', userId: 'pm01', user: mockUsers.find(u => u.id === 'pm01'), role: 'manager' },
      { projectId: 'proj002', userId: 'designer01', user: mockUsers.find(u => u.id === 'designer01'), role: 'member' },
      { projectId: 'proj002', userId: 'reviewer02', user: mockUsers.find(u => u.id === 'reviewer02'), role: 'member' },
      { projectId: 'proj002', userId: 'viewer02', user: mockUsers.find(u => u.id === 'viewer02'), role: 'member' },
    ],
    createdAt: daysAgo(90),
    updatedAt: daysAgo(3),
  },
  {
    id: 'proj003',
    name: '新能源汽车生产线',
    code: 'NEV-2024',
    description: '新能源汽车总装生产线设计与集成，包含焊接、涂装、总装三大工艺车间，设计年产能15万辆。',
    status: 'completed',
    ownerId: 'pm01',
    owner: mockUsers.find(u => u.id === 'pm01'),
    members: [
      { projectId: 'proj003', userId: 'pm01', user: mockUsers.find(u => u.id === 'pm01'), role: 'manager' },
      { projectId: 'proj003', userId: 'designer02', user: mockUsers.find(u => u.id === 'designer02'), role: 'member' },
    ],
    createdAt: daysAgo(365),
    updatedAt: daysAgo(30),
  },
];

export const mockDisciplines: Discipline[] = [
  { id: 'mech-001', name: '机械', code: 'MECH', color: '#1E5BC6', icon: 'setting', projectId: 'proj001', sortOrder: 1 },
  { id: 'elec-001', name: '电气', code: 'ELEC', color: '#F59E0B', icon: 'zap', projectId: 'proj001', sortOrder: 2 },
  { id: 'arch-001', name: '建筑', code: 'ARCH', color: '#10B981', icon: 'building', projectId: 'proj001', sortOrder: 3 },
  { id: 'pipe-001', name: '给排水', code: 'PIPE', color: '#06B6D4', icon: 'droplets', projectId: 'proj001', sortOrder: 4 },
  { id: 'hvac-001', name: '暖通', code: 'HVAC', color: '#8B5CF6', icon: 'wind', projectId: 'proj001', sortOrder: 5 },
  { id: 'mech-002', name: '机械', code: 'MECH', color: '#1E5BC6', icon: 'setting', projectId: 'proj002', sortOrder: 1 },
  { id: 'elec-002', name: '电气', code: 'ELEC', color: '#F59E0B', icon: 'zap', projectId: 'proj002', sortOrder: 2 },
  { id: 'arch-002', name: '建筑', code: 'ARCH', color: '#10B981', icon: 'building', projectId: 'proj002', sortOrder: 3 },
  { id: 'pipe-002', name: '给排水', code: 'PIPE', color: '#06B6D4', icon: 'droplets', projectId: 'proj002', sortOrder: 4 },
  { id: 'hvac-002', name: '暖通', code: 'HVAC', color: '#8B5CF6', icon: 'wind', projectId: 'proj002', sortOrder: 5 },
];

const drawingNames = [
  { name: '总装生产线布局图', number: 'DWG-MECH-001' },
  { name: '机器人工作站详细设计', number: 'DWG-MECH-002' },
  { name: '输送系统装配图', number: 'DWG-MECH-003' },
  { name: '夹具设计图纸', number: 'DWG-MECH-004' },
  { name: '动力配电系统图', number: 'DWG-ELEC-001' },
  { name: 'PLC控制原理图', number: 'DWG-ELEC-002' },
  { name: '自动化仪表接线图', number: 'DWG-ELEC-003' },
  { name: '厂房建筑平面图', number: 'DWG-ARCH-001' },
  { name: '结构施工详图', number: 'DWG-ARCH-002' },
  { name: '消防系统设计图', number: 'DWG-PIPE-001' },
  { name: '给排水管网图', number: 'DWG-PIPE-002' },
  { name: '中央空调系统图', number: 'DWG-HVAC-001' },
  { name: '通风管道布局图', number: 'DWG-HVAC-002' },
];

export const mockDrawings: Drawing[] = [];
export const mockVersions: DrawingVersion[] = [];
export const mockAnnotations: Annotation[] = [];
export const mockAnnotationReplies: AnnotationReply[] = [];

drawingNames.forEach((d, idx) => {
  const disciplineId = mockDisciplines[idx % mockDisciplines.length].id;
  const projectId = disciplineId.includes('001') ? 'proj001' : 'proj002';
  const drawingId = `draw-${String(idx + 1).padStart(3, '0')}`;
  
  const statuses: Drawing['status'][] = ['draft', 'reviewing', 'approved', 'released'];
  const status = statuses[idx % statuses.length];
  
  for (let v = 1; v <= 4; v++) {
    const versionId = `ver-${drawingId}-${v}`;
    const changeTypes: DrawingVersion['changeType'][] = ['new', 'revision', 'correction', 'superseded'];
    const changeDescriptions = [
      '初始版本发布，完成整体方案设计',
      '根据评审意见优化布局，调整设备间距',
      '修正尺寸标注错误，更新技术要求',
      '设计变更，增加安全防护装置'
    ];
    
    const version: DrawingVersion = {
      id: versionId,
      drawingId,
      version: `v${v}.0`,
      major: v,
      minor: 0,
      filePath: `/uploads/${drawingId}_${v}.pdf`,
      fileName: `${d.name}_v${v}.pdf`,
      fileType: 'pdf',
      fileSize: Math.floor(Math.random() * 5000000) + 500000,
      changeDescription: changeDescriptions[v - 1] || '版本更新',
      changeType: changeTypes[v - 1] || 'revision',
      createdBy: v === 1 ? 'designer01' : (v % 2 === 0 ? 'designer01' : 'designer02'),
      createdByUser: mockUsers.find(u => u.id === (v === 1 ? 'designer01' : (v % 2 === 0 ? 'designer01' : 'designer02'))),
      createdAt: daysAgo(idx * 7 + v * 2),
      annotations: [],
    };
    mockVersions.push(version);
    
    if (v >= 2 && idx % 3 === 0) {
      const annotationTypes: Annotation['type'][] = ['rectangle', 'circle', 'arrow', 'text'];
      for (let a = 0; a < 3; a++) {
        const annotationId = `ann-${versionId}-${a}`;
        const annotation: Annotation = {
          id: annotationId,
          versionId,
          type: annotationTypes[a % annotationTypes.length],
          x: 100 + a * 150 + Math.random() * 50,
          y: 100 + a * 80 + Math.random() * 30,
          width: 80 + Math.random() * 40,
          height: 60 + Math.random() * 30,
          radius: 30 + Math.random() * 20,
          color: a === 0 ? '#EF4444' : (a === 1 ? '#F59E0B' : '#10B981'),
          comment: [
            '此处尺寸标注有误，请核实',
            '建议增加加强筋，提高结构强度',
            '已修改，请复核'
          ][a],
          status: a === 2 ? 'resolved' : (a === 1 ? 'open' : 'closed'),
          createdBy: a === 2 ? 'designer01' : 'reviewer01',
          createdByUser: mockUsers.find(u => u.id === (a === 2 ? 'designer01' : 'reviewer01')),
          createdAt: hoursAgo(a * 24 + idx * 2),
          replies: [],
        };
        
        if (a >= 1) {
          const reply: AnnotationReply = {
            id: `reply-${annotationId}-1`,
            annotationId,
            content: a === 1 ? '收到，已安排修改' : '修改正确，已确认',
            createdBy: a === 1 ? 'designer01' : 'reviewer01',
            createdByUser: mockUsers.find(u => u.id === (a === 1 ? 'designer01' : 'reviewer01')),
            createdAt: hoursAgo(a * 12),
          };
          mockAnnotationReplies.push(reply);
          annotation.replies = [reply];
        }
        
        mockAnnotations.push(annotation);
        version.annotations = version.annotations || [];
        version.annotations.push(annotation);
      }
    }
  }
  
  const latestVersionId = `ver-${drawingId}-4`;
  
  mockDrawings.push({
    id: drawingId,
    name: d.name,
    drawingNumber: d.number,
    projectId,
    disciplineId,
    discipline: mockDisciplines.find(disc => disc.id === disciplineId),
    latestVersionId,
    latestVersion: mockVersions.find(v => v.id === latestVersionId),
    status,
    createdBy: 'designer01',
    createdByUser: mockUsers.find(u => u.id === 'designer01'),
    createdAt: daysAgo(idx * 7 + 20),
    updatedAt: daysAgo(idx * 7 + 8),
  });
});

export const mockApprovals: Approval[] = [];
export const mockApprovalSteps: ApprovalStep[] = [];

const approvalTitles = [
  '总装生产线图纸会签审批',
  '电气系统图纸审批',
  '建筑结构图会审',
  '消防系统图纸审批',
  '暖通系统设计审批',
];

approvalTitles.forEach((title, idx) => {
  const approvalId = `appr-${String(idx + 1).padStart(3, '0')}`;
  const drawing = mockDrawings[idx * 2];
  const statuses: Approval['status'][] = ['pending', 'reviewing', 'approved', 'rejected', 'approved'];
  const status = statuses[idx];
  
  const steps: ApprovalStep[] = [
    {
      id: `${approvalId}-step1`,
      approvalId,
      stepNumber: 1,
      role: '机械专业负责人',
      reviewerId: 'reviewer01',
      reviewer: mockUsers.find(u => u.id === 'reviewer01'),
      status: status === 'rejected' ? 'rejected' : (idx > 0 ? 'approved' : 'pending'),
      comment: status === 'rejected' ? '设计方案存在安全隐患，请重新设计' : (idx > 0 ? '图纸设计合理，同意通过' : undefined),
      signature: idx > 0 && status !== 'rejected' ? 'reviewer01_signature' : undefined,
      signedAt: idx > 0 && status !== 'rejected' ? hoursAgo(idx * 48 + 24) : undefined,
    },
    {
      id: `${approvalId}-step2`,
      approvalId,
      stepNumber: 2,
      role: '电气专业负责人',
      reviewerId: 'reviewer02',
      reviewer: mockUsers.find(u => u.id === 'reviewer02'),
      status: status === 'rejected' ? 'pending' : (idx > 1 ? 'approved' : 'pending'),
      comment: idx > 1 && status !== 'rejected' ? '电气参数正确，符合规范' : undefined,
      signature: idx > 1 && status !== 'rejected' ? 'reviewer02_signature' : undefined,
      signedAt: idx > 1 && status !== 'rejected' ? hoursAgo(idx * 24 + 12) : undefined,
    },
    {
      id: `${approvalId}-step3`,
      approvalId,
      stepNumber: 3,
      role: '建筑专业负责人',
      reviewerId: 'reviewer01',
      reviewer: mockUsers.find(u => u.id === 'reviewer01'),
      status: status === 'approved' && idx > 2 ? 'approved' : 'pending',
      comment: idx > 2 && status === 'approved' ? '结构设计合理，同意会签' : undefined,
      signature: idx > 2 && status === 'approved' ? 'reviewer01_signature' : undefined,
      signedAt: idx > 2 && status === 'approved' ? hoursAgo(idx * 12) : undefined,
    },
  ];
  
  mockApprovalSteps.push(...steps);
  
  let currentStep = 0;
  for (let i = 0; i < steps.length; i++) {
    if (steps[i].status === 'approved') {
      currentStep = i + 1;
    } else {
      break;
    }
  }
  
  mockApprovals.push({
    id: approvalId,
    drawingId: drawing.id,
    drawing,
    versionId: drawing.latestVersionId,
    version: drawing.latestVersion,
    title,
    status,
    currentStep,
    createdBy: 'pm01',
    createdByUser: mockUsers.find(u => u.id === 'pm01'),
    createdAt: daysAgo(idx * 5 + 10),
    steps,
  });
});

export const mockECNs: ECN[] = [];
export const mockECNDrawings: ECNDrawing[] = [];
export const mockECNNotifications: ECNNotification[] = [];

const ecnData = [
  {
    title: '总装线安全防护装置变更',
    description: '根据最新安全规范要求，在总装线关键工位增加安全防护装置，包括安全光栅、急停按钮、防护围栏等。',
    reason: '国家安全规范更新，原设计不符合最新要求',
    impact: '影响生产线布局，需要调整设备位置，预计延期5天',
  },
  {
    title: '电气控制系统升级',
    description: 'PLC控制器型号更新，需要重新设计控制原理图和接线图，优化控制程序。',
    reason: '原型号停产，需更换为新型号',
    impact: '电气图纸需全部更新，软件需要重新调试',
  },
  {
    title: '建筑结构荷载调整',
    description: '根据实际设备重量，调整二层楼板荷载设计，增加配筋率。',
    reason: '实际设备重量超出原设计值',
    impact: '结构图纸需修改，可能影响施工进度',
  },
];

ecnData.forEach((ecn, idx) => {
  const ecnId = `ecn-${String(idx + 1).padStart(3, '0')}`;
  const statuses: ECN['status'][] = ['issued', 'acknowledged', 'draft'];
  const status = statuses[idx];
  
  const ecnDrawings: ECNDrawing[] = [];
  for (let d = 0; d < 2; d++) {
    const drawing = mockDrawings[idx * 2 + d];
    ecnDrawings.push({
      ecnId,
      drawingId: drawing.id,
      drawing,
      versionId: drawing.latestVersionId,
      version: drawing.latestVersion,
    });
  }
  mockECNDrawings.push(...ecnDrawings);
  
  const notifications: ECNNotification[] = mockDepartments.slice(0, 3).map((dept, dIdx) => ({
    id: `${ecnId}-notif-${dIdx}`,
    ecnId,
    departmentId: dept.id,
    department: dept,
    acknowledged: status === 'acknowledged' || (dIdx === 0 && status === 'issued'),
    acknowledgedBy: (status === 'acknowledged' || (dIdx === 0 && status === 'issued')) ? 'viewer01' : undefined,
    acknowledgedAt: (status === 'acknowledged' || (dIdx === 0 && status === 'issued')) ? hoursAgo(idx * 24 + dIdx * 12) : undefined,
  }));
  mockECNNotifications.push(...notifications);
  
  mockECNs.push({
    id: ecnId,
    ecnNumber: `ECN-2024-${String(idx + 1).padStart(4, '0')}`,
    title: ecn.title,
    description: ecn.description,
    reason: ecn.reason,
    impact: ecn.impact,
    status,
    createdBy: 'pm01',
    createdByUser: mockUsers.find(u => u.id === 'pm01'),
    createdAt: daysAgo(idx * 10 + 5),
    drawings: ecnDrawings,
    notifications,
  });
});

export const mockExternalLinks: ExternalLink[] = [];
export const mockAccessLogs: AccessLog[] = [];

const linkData = [
  { drawingIdx: 0, maxAccess: 10, expiresDays: 7 },
  { drawingIdx: 4, maxAccess: 5, expiresDays: 3 },
  { drawingIdx: 7, maxAccess: 20, expiresDays: 14 },
];

linkData.forEach((link, idx) => {
  const linkId = `link-${String(idx + 1).padStart(3, '0')}`;
  const drawing = mockDrawings[link.drawingIdx];
  const expiresAt = new Date(now.getTime() + link.expiresDays * 24 * 60 * 60 * 1000).toISOString();
  
  const accessLogs: AccessLog[] = [];
  const accessCount = Math.floor(Math.random() * 5) + 1;
  for (let l = 0; l < accessCount; l++) {
    const log: AccessLog = {
      id: `log-${linkId}-${l}`,
      linkId,
      drawingId: drawing.id,
      drawing,
      action: 'view',
      ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      createdAt: hoursAgo(l * 6 + idx * 12),
    };
    accessLogs.push(log);
    mockAccessLogs.push(log);
  }
  
  mockExternalLinks.push({
    id: linkId,
    token: `ext_${uuidv4().replace(/-/g, '')}`,
    drawingId: drawing.id,
    drawing,
    versionId: drawing.latestVersionId,
    version: drawing.latestVersion,
    expiresAt,
    accessCount,
    maxAccess: link.maxAccess,
    createdBy: 'pm01',
    createdAt: daysAgo(idx * 3 + 2),
    isActive: true,
    accessLogs,
  });
});

for (let i = 0; i < 20; i++) {
  const drawing = mockDrawings[i % mockDrawings.length];
  const user = mockUsers[i % mockUsers.length];
  mockAccessLogs.push({
    id: `log-internal-${i}`,
    userId: user.id,
    user,
    drawingId: drawing.id,
    drawing,
    action: ['view', 'download', 'preview', 'comment'][i % 4],
    ipAddress: `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    createdAt: hoursAgo(i * 3 + 1),
  });
}
