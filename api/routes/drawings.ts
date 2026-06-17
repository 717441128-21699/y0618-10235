import { Router, Response } from 'express';
import db from '../services/DatabaseService.js';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.js';
import type { ApiResponse, Drawing, DrawingVersion, Annotation } from '../../shared/index.js';

const router = Router();

router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, disciplineId, search, status } = req.query;
    
    let drawings: Drawing[] = [];
    
    if (projectId) {
      drawings = db.getDrawingsByProject(projectId as string);
    } else if (disciplineId) {
      drawings = db.getDrawingsByDiscipline(disciplineId as string);
    } else {
      drawings = db.getDrawings().map(d => ({
        ...d,
        discipline: db.getDisciplineById(d.disciplineId),
        latestVersion: db.getVersionById(d.latestVersionId),
      }));
    }
    
    if (search) {
      const searchLower = (search as string).toLowerCase();
      drawings = drawings.filter(d =>
        d.name.toLowerCase().includes(searchLower) ||
        d.drawingNumber.toLowerCase().includes(searchLower)
      );
    }
    
    if (status) {
      drawings = drawings.filter(d => d.status === status);
    }
    
    res.json({
      success: true,
      data: drawings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取图纸列表失败',
    });
  }
});

router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response<ApiResponse<Drawing>>) => {
  try {
    const { id } = req.params;
    const drawing = db.getDrawingById(id);
    
    if (!drawing) {
      return res.status(404).json({
        success: false,
        error: '图纸不存在',
      });
    }
    
    res.json({
      success: true,
      data: drawing,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取图纸详情失败',
    });
  }
});

router.post('/', authenticateToken, requireRole('admin', 'project_manager', 'designer'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, drawingNumber, projectId, disciplineId, fileName, fileType, fileSize, changeDescription } = req.body;
    
    if (!name || !drawingNumber || !projectId || !disciplineId) {
      return res.status(400).json({
        success: false,
        error: '必填项不能为空',
      });
    }
    
    const initialVersionId = 'ver-' + Date.now();
    
    const drawing = db.createDrawing({
      name,
      drawingNumber,
      projectId,
      disciplineId,
      latestVersionId: initialVersionId,
      status: 'draft',
      createdBy: req.user!.id,
    });
    
    db.createVersion({
      id: initialVersionId,
      drawingId: drawing.id,
      version: 'v1.0',
      major: 1,
      minor: 0,
      filePath: fileName || `/uploads/${drawing.id}_1.pdf`,
      fileName: fileName || `${name}_v1.0.pdf`,
      fileType: fileType || 'pdf',
      fileSize: fileSize || 0,
      changeDescription: changeDescription || '初始版本',
      changeType: 'new',
      createdBy: req.user!.id,
    });
    
    res.status(201).json({
      success: true,
      data: drawing,
      message: '图纸创建成功',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '创建图纸失败',
    });
  }
});

router.put('/:id', authenticateToken, requireRole('admin', 'project_manager', 'designer'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, drawingNumber, status } = req.body;
    
    const existing = db.getDrawingById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: '图纸不存在',
      });
    }
    
    const updated = db.updateDrawing(id, { name, drawingNumber, status });
    
    res.json({
      success: true,
      data: updated,
      message: '图纸更新成功',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '更新图纸失败',
    });
  }
});

router.get('/:id/versions', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const versions = db.getVersionsByDrawing(id);
    
    res.json({
      success: true,
      data: versions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取版本历史失败',
    });
  }
});

router.post('/:id/versions', authenticateToken, requireRole('admin', 'project_manager', 'designer'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { changeDescription, changeType, fileName, fileType, fileSize } = req.body;
    
    const drawing = db.getDrawingById(id);
    if (!drawing) {
      return res.status(404).json({
        success: false,
        error: '图纸不存在',
      });
    }
    
    const versions = db.getVersionsByDrawing(id);
    const latestVersion = versions[0];
    const newMajor = latestVersion ? latestVersion.major : 1;
    const newMinor = latestVersion ? latestVersion.minor + 1 : 0;
    const versionStr = `v${newMajor}.${newMinor}`;
    
    const version = db.createVersion({
      id: 'ver-' + Date.now(),
      drawingId: id,
      version: versionStr,
      major: newMajor,
      minor: newMinor,
      filePath: `/uploads/${id}_${newMajor}.${newMinor}.pdf`,
      fileName: fileName || `${drawing.name}_${versionStr}.pdf`,
      fileType: fileType || 'pdf',
      fileSize: fileSize || 0,
      changeDescription: changeDescription || '版本更新',
      changeType: changeType || 'revision',
      createdBy: req.user!.id,
    });
    
    db.updateDrawing(id, { latestVersionId: version.id, status: 'draft' });
    
    res.status(201).json({
      success: true,
      data: version,
      message: '版本上传成功',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '上传新版本失败',
    });
  }
});

router.get('/versions/:id', authenticateToken, async (req: AuthRequest, res: Response<ApiResponse<DrawingVersion>>) => {
  try {
    const { id } = req.params;
    const version = db.getVersionById(id);
    
    if (!version) {
      return res.status(404).json({
        success: false,
        error: '版本不存在',
      });
    }
    
    res.json({
      success: true,
      data: version,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取版本详情失败',
    });
  }
});

router.get('/versions/:id/annotations', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const annotations = db.getAnnotationsByVersion(id);
    
    res.json({
      success: true,
      data: annotations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取标注列表失败',
    });
  }
});

router.post('/versions/:id/annotations', authenticateToken, requireRole('admin', 'project_manager', 'designer', 'reviewer'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { type, x, y, width, height, radius, color, comment } = req.body;
    
    const annotation = db.createAnnotation({
      versionId: id,
      type,
      x,
      y,
      width,
      height,
      radius,
      color: color || '#EF4444',
      comment,
      status: 'open',
      createdBy: req.user!.id,
    });
    
    res.status(201).json({
      success: true,
      data: annotation,
      message: '标注添加成功',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '添加标注失败',
    });
  }
});

router.put('/annotations/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body;
    
    const updated = db.updateAnnotation(id, { status, comment });
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: '标注不存在',
      });
    }
    
    res.json({
      success: true,
      data: updated,
      message: '标注更新成功',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '更新标注失败',
    });
  }
});

router.post('/annotations/:id/replies', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    
    const reply = db.createAnnotationReply({
      annotationId: id,
      content,
      createdBy: req.user!.id,
    });
    
    res.status(201).json({
      success: true,
      data: reply,
      message: '回复添加成功',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '添加回复失败',
    });
  }
});

export default router;
