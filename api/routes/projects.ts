import { Router, Response } from 'express';
import db from '../services/DatabaseService.js';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.js';
import type { ApiResponse, Project, PaginationParams, PaginatedResponse } from '../../shared/index.js';

const router = Router();

router.get('/', authenticateToken, async (req: AuthRequest, res: Response<ApiResponse<PaginatedResponse<Project> >>) => {
  try {
    const { page = 1, pageSize = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query as PaginationParams;
    
    let projects = req.user?.role === 'admin' 
      ? db.getProjects()
      : db.getProjectsByUser(req.user!.id);
    
    if (search) {
      projects = projects.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    const result = db.paginate(projects, { page, pageSize, sortBy, sortOrder });
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取项目列表失败',
    });
  }
});

router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response<ApiResponse<Project>>) => {
  try {
    const { id } = req.params;
    const project = db.getProjectById(id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: '项目不存在',
      });
    }
    
    res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取项目详情失败',
    });
  }
});

router.post('/', authenticateToken, requireRole('admin', 'project_manager'), async (req: AuthRequest, res: Response<ApiResponse<Project>>) => {
  try {
    const { name, code, description, status } = req.body;
    
    if (!name || !code) {
      return res.status(400).json({
        success: false,
        error: '项目名称和编码不能为空',
      });
    }
    
    const project = db.createProject({
      name,
      code,
      description: description || '',
      status: status || 'active',
      ownerId: req.user!.id,
      members: [{
        projectId: '',
        userId: req.user!.id,
        role: 'manager',
        user: req.user,
      }],
    });
    
    const disciplines = [
      { name: '机械', code: 'MECH', color: '#1E5BC6', icon: 'setting', sortOrder: 1 },
      { name: '电气', code: 'ELEC', color: '#F59E0B', icon: 'zap', sortOrder: 2 },
      { name: '建筑', code: 'ARCH', color: '#10B981', icon: 'building', sortOrder: 3 },
      { name: '给排水', code: 'PIPE', color: '#06B6D4', icon: 'droplets', sortOrder: 4 },
      { name: '暖通', code: 'HVAC', color: '#8B5CF6', icon: 'wind', sortOrder: 5 },
    ];
    
    disciplines.forEach(d => {
      db.createDiscipline({
        ...d,
        projectId: project.id,
      });
    });
    
    res.status(201).json({
      success: true,
      data: project,
      message: '项目创建成功',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '创建项目失败',
    });
  }
});

router.put('/:id', authenticateToken, requireRole('admin', 'project_manager'), async (req: AuthRequest, res: Response<ApiResponse<Project>>) => {
  try {
    const { id } = req.params;
    const { name, code, description, status } = req.body;
    
    const existingProject = db.getProjectById(id);
    if (!existingProject) {
      return res.status(404).json({
        success: false,
        error: '项目不存在',
      });
    }
    
    if (req.user!.role !== 'admin' && existingProject.ownerId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: '无权限修改此项目',
      });
    }
    
    const updated = db.updateProject(id, {
      name,
      code,
      description,
      status,
    });
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: '更新项目失败',
      });
    }
    
    res.json({
      success: true,
      data: updated,
      message: '项目更新成功',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '更新项目失败',
    });
  }
});

router.get('/:id/disciplines', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const disciplines = db.getDisciplinesByProject(id);
    
    res.json({
      success: true,
      data: disciplines,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取专业分类失败',
    });
  }
});

export default router;
