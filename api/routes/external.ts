import { Router, Response } from 'express';
import db from '../services/DatabaseService.js';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.js';
import type { ApiResponse, ExternalLink } from '../../shared/index.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/links', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { drawingId } = req.query;
    let links: ExternalLink[] = [];
    
    if (drawingId) {
      links = db.getExternalLinksByDrawing(drawingId as string);
    } else {
      links = db.getExternalLinks().map(l => ({
        ...l,
        drawing: db.getDrawingById(l.drawingId),
        version: l.versionId ? db.getVersionById(l.versionId) : undefined,
        accessLogs: db.getAccessLogsByLink(l.id),
      }));
    }
    
    res.json({
      success: true,
      data: links,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取外部链接列表失败',
    });
  }
});

router.post('/links', authenticateToken, requireRole('admin', 'project_manager'), async (req: AuthRequest, res: Response) => {
  try {
    const { drawingId, versionId, expiresAt, maxAccess } = req.body;
    
    if (!drawingId) {
      return res.status(400).json({
        success: false,
        error: '图纸ID不能为空',
      });
    }
    
    const drawing = db.getDrawingById(drawingId);
    if (!drawing) {
      return res.status(404).json({
        success: false,
        error: '图纸不存在',
      });
    }
    
    const defaultExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const link = db.createExternalLink({
      token: `ext_${uuidv4().replace(/-/g, '')}`,
      drawingId,
      versionId,
      expiresAt: expiresAt || defaultExpiresAt,
      maxAccess: maxAccess || 10,
      createdBy: req.user!.id,
      isActive: true,
      accessLogs: [],
    });
    
    res.status(201).json({
      success: true,
      data: link,
      message: '外部链接创建成功',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '创建外部链接失败',
    });
  }
});

router.put('/links/:id', authenticateToken, requireRole('admin', 'project_manager'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { expiresAt, maxAccess, isActive } = req.body;
    
    const updated = db.updateExternalLink(id, {
      expiresAt,
      maxAccess,
      isActive,
    });
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: '链接不存在',
      });
    }
    
    res.json({
      success: true,
      data: updated,
      message: '链接更新成功',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '更新链接失败',
    });
  }
});

router.get('/audit/access-logs', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { drawingId, userId, linkId } = req.query;
    let logs = db.getAccessLogs();
    
    if (drawingId) {
      logs = db.getAccessLogsByDrawing(drawingId as string);
    } else if (userId) {
      logs = db.getAccessLogsByUser(userId as string);
    } else if (linkId) {
      logs = db.getAccessLogsByLink(linkId as string);
    } else {
      logs = logs.map(l => ({
        ...l,
        user: l.userId ? db.getUserById(l.userId) : undefined,
        drawing: db.getDrawingById(l.drawingId),
      }));
    }
    
    res.json({
      success: true,
      data: logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取访问日志失败',
    });
  }
});

router.get('/:token', async (req, res: Response) => {
  try {
    const { token } = req.params;
    
    const link = db.getExternalLinkByToken(token);
    if (!link) {
      return res.status(404).json({
        success: false,
        error: '链接无效或已过期',
      });
    }
    
    const now = new Date();
    const expiresAt = new Date(link.expiresAt);
    if (now > expiresAt) {
      return res.status(403).json({
        success: false,
        error: '链接已过期',
      });
    }
    
    if (link.maxAccess > 0 && link.accessCount >= link.maxAccess) {
      return res.status(403).json({
        success: false,
        error: '链接访问次数已达上限',
      });
    }
    
    db.incrementLinkAccessCount(link.id);
    
    db.createAccessLog({
      linkId: link.id,
      drawingId: link.drawingId,
      action: 'external_view',
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    });
    
    res.json({
      success: true,
      data: {
        drawing: link.drawing,
        version: link.version || link.drawing?.latestVersion,
        expiresAt: link.expiresAt,
        remainingAccess: link.maxAccess - link.accessCount - 1,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取链接信息失败',
    });
  }
});

export default router;
