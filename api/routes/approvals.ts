import { Router, Response } from 'express';
import db from '../services/DatabaseService.js';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.js';
import type { ApiResponse, Approval } from '../../shared/index.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { status, drawingId } = req.query;
    let approvals: Approval[] = [];
    
    if (req.user?.role === 'reviewer') {
      approvals = db.getApprovalsByReviewer(req.user.id);
    } else {
      approvals = db.getApprovals().map(a => ({
        ...a,
        drawing: db.getDrawingById(a.drawingId),
        version: db.getVersionById(a.versionId),
        createdByUser: db.getUserById(a.createdBy),
        steps: db.getApprovalStepsByApproval(a.id),
      }));
    }
    
    if (status) {
      approvals = approvals.filter(a => a.status === status);
    }
    
    if (drawingId) {
      approvals = approvals.filter(a => a.drawingId === drawingId);
    }
    
    res.json({
      success: true,
      data: approvals,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取审批列表失败',
    });
  }
});

router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response<ApiResponse<Approval>>) => {
  try {
    const { id } = req.params;
    const approval = db.getApprovalById(id);
    
    if (!approval) {
      return res.status(404).json({
        success: false,
        error: '审批不存在',
      });
    }
    
    res.json({
      success: true,
      data: approval,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取审批详情失败',
    });
  }
});

router.post('/', authenticateToken, requireRole('admin', 'project_manager'), async (req: AuthRequest, res: Response) => {
  try {
    const { drawingId, versionId, title, steps } = req.body;
    
    if (!drawingId || !versionId || !title || !steps || steps.length === 0) {
      return res.status(400).json({
        success: false,
        error: '必填项不能为空',
      });
    }
    
    const drawing = db.getDrawingById(drawingId);
    if (!drawing) {
      return res.status(404).json({
        success: false,
        error: '图纸不存在',
      });
    }
    
    const approvalId = 'appr-' + Date.now();
    
    const approvalSteps = steps.map((step: any, index: number) => ({
      id: `${approvalId}-step${index + 1}`,
      approvalId,
      stepNumber: index + 1,
      order: index + 1,
      role: step.role,
      reviewerId: step.reviewerId || step.approverId,
      approverId: step.approverId || step.reviewerId,
      status: 'pending' as const,
    }));
    
    approvalSteps.forEach(step => {
      const existing = db.updateApprovalStep(step.id, step);
      if (!existing) {
        db.createApprovalStep(step);
      }
    });
    
    const approval = db.createApproval({
      id: approvalId,
      drawingId,
      versionId,
      title,
      status: 'pending',
      currentStep: 0,
      createdBy: req.user!.id,
      steps: approvalSteps,
    });
    
    db.updateDrawing(drawingId, { status: 'reviewing' });
    
    res.status(201).json({
      success: true,
      data: approval,
      message: '审批发起成功',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '发起审批失败',
    });
  }
});

router.post('/:id/steps/:stepId/sign', authenticateToken, requireRole('admin', 'project_manager', 'reviewer'), async (req: AuthRequest, res: Response) => {
  try {
    const { id, stepId } = req.params;
    const { comment, signature } = req.body;
    
    const approval = db.getApprovalById(id);
    if (!approval) {
      return res.status(404).json({
        success: false,
        error: '审批不存在',
      });
    }
    
    const steps = db.getApprovalStepsByApproval(id);
    const currentStep = steps.find(s => s.id === stepId);
    
    if (!currentStep) {
      return res.status(404).json({
        success: false,
        error: '审批步骤不存在',
      });
    }
    
    const stepApproverId = currentStep.approverId || currentStep.reviewerId;
    if (stepApproverId && stepApproverId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: '无权限执行此审批，该步骤指定了其他审批人',
      });
    }
    
    const prevSteps = steps.filter(s => s.stepNumber < currentStep.stepNumber);
    const allPrevApproved = prevSteps.every(s => s.status === 'approved');
    
    if (!allPrevApproved) {
      return res.status(400).json({
        success: false,
        error: '请先完成前置审批步骤',
      });
    }
    
    const updatedStep = db.updateApprovalStep(stepId, {
      status: 'approved',
      comment,
      signature: signature || uuidv4(),
      signedBy: req.user!.name || req.user!.username,
      signedAt: new Date().toISOString(),
    });

    const nextStep = steps.find(s => s.stepNumber === currentStep.stepNumber + 1);
    const allApproved = steps.every(s => s.status === 'approved');

    let updatedApproval;
    if (allApproved) {
      db.updateApproval(id, {
        status: 'approved',
        currentStep: steps.length,
      });
      db.updateDrawing(approval.drawingId, { status: 'issued' });
    } else {
      db.updateApproval(id, {
        status: 'reviewing',
        currentStep: currentStep.stepNumber,
      });
    }
    
    const completeApproval = db.getApprovalById(id);
    
    res.json({
      success: true,
      data: completeApproval,
      message: '审批签字成功',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '审批签字失败',
    });
  }
});

router.post('/:id/reject', authenticateToken, requireRole('admin', 'project_manager', 'reviewer'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    
    const approval = db.getApprovalById(id);
    if (!approval) {
      return res.status(404).json({
        success: false,
        error: '审批不存在',
      });
    }
    
    const steps = db.getApprovalStepsByApproval(id);
    const currentPendingStep = steps.find(s => s.status === 'pending');
    
    if (currentPendingStep) {
      db.updateApprovalStep(currentPendingStep.id, {
        status: 'rejected',
        comment,
        signedAt: new Date().toISOString(),
      });
    }
    
    const updated = db.updateApproval(id, {
      status: 'rejected',
    });
    
    db.updateDrawing(approval.drawingId, { status: 'draft' });
    
    const completeApproval = db.getApprovalById(id);
    
    res.json({
      success: true,
      data: completeApproval,
      message: '审批已驳回',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '驳回审批失败',
    });
  }
});

export default router;
