import { Router, Response } from 'express';
import db from '../services/DatabaseService.js';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.js';
import type { ApiResponse, ECN } from '../../shared/index.js';

const router = Router();

router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;
    let ecns = db.getECNs();
    
    if (status) {
      ecns = ecns.filter(e => e.status === status);
    }
    
    res.json({
      success: true,
      data: ecns,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取ECN列表失败',
    });
  }
});

router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response<ApiResponse<ECN>>) => {
  try {
    const { id } = req.params;
    const ecn = db.getECNById(id);
    
    if (!ecn) {
      return res.status(404).json({
        success: false,
        error: 'ECN不存在',
      });
    }
    
    res.json({
      success: true,
      data: ecn,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取ECN详情失败',
    });
  }
});

router.post('/', authenticateToken, requireRole('admin', 'project_manager'), async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, reason, impact, drawingIds, departmentIds } = req.body;
    
    if (!title || !description || !reason) {
      return res.status(400).json({
        success: false,
        error: '必填项不能为空',
      });
    }
    
    const ecnNumber = `ECN-2024-${String(db.getECNs().length + 1).padStart(4, '0')}`;
    
    const ecn = db.createECN({
      ecnNumber,
      title,
      description,
      reason,
      impact: impact || '',
      status: 'draft',
      createdBy: req.user!.id,
      drawings: [],
      notifications: [],
    });
    
    if (drawingIds && drawingIds.length > 0) {
      drawingIds.forEach((drawingId: string) => {
        const drawing = db.getDrawingById(drawingId);
        if (drawing) {
          db.createECNDrawing({
            ecnId: ecn.id,
            drawingId,
            drawing,
            versionId: drawing.latestVersionId,
            version: drawing.latestVersion,
          });
        }
      });
    }
    
    if (departmentIds && departmentIds.length > 0) {
      departmentIds.forEach((departmentId: string) => {
        const dept = db.getDepartmentById(departmentId);
        if (dept) {
          db.createECNNotification({
            ecnId: ecn.id,
            departmentId,
            department: dept,
            acknowledged: false,
          });
        }
      });
    }
    
    const completeECN = db.getECNById(ecn.id);
    
    res.status(201).json({
      success: true,
      data: completeECN,
      message: 'ECN创建成功',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '创建ECN失败',
    });
  }
});

router.post('/:id/issue', authenticateToken, requireRole('admin', 'project_manager'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const updated = db.updateECN(id, { status: 'issued' });
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'ECN不存在',
      });
    }
    
    const completeECN = db.getECNById(id);
    
    res.json({
      success: true,
      data: completeECN,
      message: 'ECN已发布，通知已发送',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '发布ECN失败',
    });
  }
});

router.post('/:id/acknowledge', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { notificationId } = req.body;
    
    const ecn = db.getECNById(id);
    if (!ecn) {
      return res.status(404).json({
        success: false,
        error: 'ECN不存在',
      });
    }
    
    db.updateECNNotification(notificationId, {
      acknowledged: true,
      acknowledgedBy: req.user!.id,
      acknowledgedAt: new Date().toISOString(),
    });
    
    const notifications = db.getECNNotificationsByECN(id);
    const allAcknowledged = notifications.every(n => n.acknowledged);
    
    if (allAcknowledged) {
      db.updateECN(id, { status: 'acknowledged' });
    }
    
    const completeECN = db.getECNById(id);
    
    res.json({
      success: true,
      data: completeECN,
      message: '已确认收到ECN通知',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '确认ECN失败',
    });
  }
});

router.get('/departments/list', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const departments = db.getDepartments();
    res.json({
      success: true,
      data: departments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取部门列表失败',
    });
  }
});

export default router;
