import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../services/DatabaseService.js';
import { generateToken, authenticateToken, AuthRequest } from '../middleware/auth.js';
import type { LoginRequest, LoginResponse, ApiResponse, User } from '../../shared/index.js';

const router = Router();

const mockPasswordHash = bcrypt.hashSync('123456', 10);

router.post('/login', async (req: AuthRequest, res: Response<ApiResponse<LoginResponse>>) => {
  try {
    const { username, password } = req.body as LoginRequest;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: '用户名和密码不能为空',
      });
    }

    const user = db.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: '用户名或密码错误',
      });
    }

    const isValid = await bcrypt.compare(password, mockPasswordHash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: '用户名或密码错误',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: '账号已被禁用',
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      data: {
        token,
        user,
      },
      message: '登录成功',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '登录失败，请稍后重试',
    });
  }
});

router.post('/logout', authenticateToken, (req: AuthRequest, res: Response<ApiResponse<void>>) => {
  res.json({
    success: true,
    message: '登出成功',
  });
});

router.get('/me', authenticateToken, (req: AuthRequest, res: Response<ApiResponse<User>>) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: '未认证',
    });
  }

  const user = db.getUserById(req.user.id);
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
});

export default router;
