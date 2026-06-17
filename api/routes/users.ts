import { Router, Response } from 'express';
import db from '../services/DatabaseService.js';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.js';
import type { ApiResponse, User, Role } from '../../shared/index.js';
import bcrypt from 'bcryptjs';

const router = Router();

const roleNames: Record<Role, string> = {
  admin: '系统管理员',
  project_manager: '项目负责人',
  designer: '设计师',
  reviewer: '审校员',
  viewer: '查看者',
  external: '外部用户',
};

router.get('/', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { role, isActive } = req.query;
    let users = db.getUsers();
    
    if (role) {
      users = users.filter(u => u.role === role);
    }
    
    if (isActive !== undefined) {
      users = users.filter(u => u.isActive === (isActive === 'true'));
    }
    
    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取用户列表失败',
    });
  }
});

router.get('/roles', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const roles = Object.entries(roleNames).map(([key, name]) => ({
      value: key as Role,
      label: name,
    }));
    
    res.json({
      success: true,
      data: roles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取角色列表失败',
    });
  }
});

router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response<ApiResponse<User>>) => {
  try {
    const { id } = req.params;
    const user = db.getUserById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: '用户不存在',
      });
    }
    
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取用户详情失败',
    });
  }
});

router.post('/', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { username, name, email, role, password } = req.body;
    
    if (!username || !name || !email || !role) {
      return res.status(400).json({
        success: false,
        error: '必填项不能为空',
      });
    }
    
    const existing = db.getUserByUsername(username);
    if (existing) {
      return res.status(400).json({
        success: false,
        error: '用户名已存在',
      });
    }
    
    const hashedPassword = await bcrypt.hash(password || '123456', 10);
    
    const user = db.createUser({
      username,
      name,
      email,
      role,
      isActive: true,
    });
    
    res.status(201).json({
      success: true,
      data: user,
      message: '用户创建成功',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '创建用户失败',
    });
  }
});

router.put('/:id', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, role, isActive } = req.body;
    
    const existing = db.getUserById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: '用户不存在',
      });
    }
    
    const updated = db.updateUser(id, {
      name,
      email,
      role,
      isActive,
    });
    
    res.json({
      success: true,
      data: updated,
      message: '用户更新成功',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '更新用户失败',
    });
  }
});

export default router;
