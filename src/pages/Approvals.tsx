import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Space,
  Steps,
  Avatar,
  Drawer,
  Row,
  Col,
  Descriptions,
  Divider,
} from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PlusOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  FileTextOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { approvalApi, drawingApi, userApi } from '../api/client';
import { useAuthStore } from '../store/useAuthStore';
import type { Approval, Drawing, User, ApprovalStep } from '../../shared/index.js';

const { Step } = Steps;
const { Option } = Select;
const { TextArea } = Input;

const Approvals: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [form] = Form.useForm();
  const [signForm] = Form.useForm();
  const [rejectForm] = Form.useForm();
  const [showSignModal, setShowSignModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [currentStep, setCurrentStep] = useState<ApprovalStep | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: approvals, isLoading } = useQuery({
    queryKey: ['approvals'],
    queryFn: async () => {
      const res = await approvalApi.getApprovals();
      return res.data.data || [];
    },
  });

  const { data: drawings } = useQuery({
    queryKey: ['drawings'],
    queryFn: async () => {
      const res = await drawingApi.getDrawings();
      return res.data.data || [];
    },
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await userApi.getUsers();
      return res.data.data || [];
    },
  });

  const { data: approvalDetail } = useQuery({
    queryKey: ['approvalDetail', selectedApproval?.id],
    queryFn: async () => {
      if (!selectedApproval) return null;
      const res = await approvalApi.getApproval(selectedApproval.id);
      return res.data.data;
    },
    enabled: !!selectedApproval && drawerVisible,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await approvalApi.createApproval(data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      message.success('审批流程创建成功');
      setModalVisible(false);
      form.resetFields();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || '创建失败');
    },
  });

  const signMutation = useMutation({
    mutationFn: async (data: { approvalId: string; stepId: string; comment?: string; signature?: string }) => {
      const res = await approvalApi.signApproval(data.approvalId, data.stepId, { comment: data.comment, signature: data.signature });
      return res.data;
    },
    onSuccess: (result: any) => {
      const updatedApproval = result?.data;
      if (updatedApproval) {
        queryClient.setQueryData(['approvals'], (oldData: any) => {
          if (!oldData) return oldData;
          return oldData.map((a: Approval) => a.id === updatedApproval.id ? { ...a, ...updatedApproval } : a);
        });
        queryClient.setQueryData(['approvalDetail', updatedApproval.id], updatedApproval);
        if (selectedApproval?.id === updatedApproval.id) {
          setSelectedApproval({ ...selectedApproval, ...updatedApproval });
        }
      }
      queryClient.invalidateQueries({ queryKey: ['approvals', 'approvalDetail', 'drawings'] });
      if (updatedApproval?.status === 'approved') {
        message.success('全部审批通过！图纸状态已更新为可下发');
      } else {
        message.success('审批签字成功，已流转到下一步');
      }
      setShowSignModal(false);
      signForm.resetFields();
      setCurrentStep(null);
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || '签字失败');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (data: { id: string; comment: string }) => {
      const res = await approvalApi.rejectApproval(data.id, { comment: data.comment });
      return res.data;
    },
    onSuccess: (result: any) => {
      const updatedApproval = result?.data;
      if (updatedApproval) {
        queryClient.setQueryData(['approvals'], (oldData: any) => {
          if (!oldData) return oldData;
          return oldData.map((a: Approval) => a.id === updatedApproval.id ? { ...a, ...updatedApproval } : a);
        });
        queryClient.setQueryData(['approvalDetail', updatedApproval.id], updatedApproval);
        if (selectedApproval?.id === updatedApproval.id) {
          setSelectedApproval({ ...selectedApproval, ...updatedApproval });
        }
      }
      queryClient.invalidateQueries({ queryKey: ['approvals', 'approvalDetail', 'drawings'] });
      message.success('审批已驳回');
      setShowRejectModal(false);
      rejectForm.resetFields();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || '操作失败');
    },
  });

  const handleCreate = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const steps = values.approvers.map((approverId: string, index: number) => ({
        order: index + 1,
        approverId,
      }));
      createMutation.mutate({
        drawingId: values.drawingId,
        versionId: values.versionId,
        title: values.title,
        steps,
      });
    } catch (e) {
      console.error('Validation failed:', e);
    }
  };

  const handleViewDetail = (approval: Approval) => {
    setSelectedApproval(approval);
    setDrawerVisible(true);
  };

  const handleSign = (step: ApprovalStep) => {
    setCurrentStep(step);
    signForm.resetFields();
    setShowSignModal(true);
  };

  const handleReject = () => {
    rejectForm.resetFields();
    setShowRejectModal(true);
  };

  const handleSignSubmit = async () => {
    try {
      const values = await signForm.validateFields();
      if (selectedApproval && currentStep) {
        signMutation.mutate({
          approvalId: selectedApproval.id,
          stepId: currentStep.id,
          comment: values.comment,
          signature: user?.name,
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRejectSubmit = async () => {
    try {
      const values = await rejectForm.validateFields();
      if (selectedApproval) {
        rejectMutation.mutate({
          id: selectedApproval.id,
          comment: values.comment,
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'orange',
    approved: 'green',
    rejected: 'red',
  };

  const statusText: Record<string, string> = {
    pending: '审批中',
    approved: '已批准',
    rejected: '已驳回',
  };

  const stepStatusText: Record<string, string> = {
    pending: '待审批',
    approved: '已通过',
    rejected: '已驳回',
  };

  const columns = [
    {
      title: '审批标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Approval) => {
        const drawing = drawings?.find((d: Drawing) => d.id === record.drawingId);
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <FileTextOutlined className="text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-slate-800">{text}</p>
              <p className="text-xs text-slate-500">{drawing?.drawingNumber}</p>
            </div>
          </div>
        );
      },
    },
    {
      title: '图纸名称',
      key: 'drawing',
      render: (_: any, record: Approval) => {
        const drawing = drawings?.find((d: Drawing) => d.id === record.drawingId);
        return drawing?.name || '-';
      },
    },
    {
      title: '当前步骤',
      key: 'currentStep',
      render: (_: any, record: Approval) => {
        const pendingStep = record.steps?.find((s) => s.status === 'pending');
        const firstStep = record.steps?.find((s) => s.order === 1);
        if (record.status === 'approved') return '全部完成';
        if (record.status === 'rejected') return '已驳回';
        const stepToShow = pendingStep || firstStep;
        return stepToShow?.approver?.name || stepToShow?.reviewer?.name || '负责人';
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'}>
          {statusText[status] || status}
        </Tag>
      ),
    },
    {
      title: '创建人',
      key: 'createdBy',
      render: (_: any, record: Approval) => record.createdByUser?.name || record.createdBy || '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Approval) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            查看
          </Button>
        </Space>
      ),
    },
  ];

  const currentApproval = approvalDetail || selectedApproval;
  const drawing = drawings?.find((d: Drawing) => d.id === currentApproval?.drawingId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">审批会签</h1>
          <p className="text-slate-500 mt-1">管理图纸审批流程与会签记录</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          发起审批
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-none rounded-xl">
          <Table
            columns={columns}
            dataSource={approvals}
            loading={isLoading}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </motion.div>

      <Modal
        title="发起审批流程"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        confirmLoading={createMutation.isPending}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="审批标题"
            rules={[{ required: true, message: '请输入审批标题' }]}
          >
            <Input placeholder="如：机械装配图审批" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="drawingId"
                label="选择图纸"
                rules={[{ required: true, message: '请选择图纸' }]}
              >
                <Select placeholder="请选择图纸">
                  {drawings?.map((d: Drawing) => (
                    <Option key={d.id} value={d.id}>{d.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="versionId"
                label="选择版本"
                rules={[{ required: true, message: '请选择版本' }]}
              >
                <Select placeholder="请选择版本">
                  <Option value="v1">v1.0</Option>
                  <Option value="v2">v2.0</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="approvers"
            label="会签人员（按顺序审批）"
            rules={[{ required: true, message: '请选择至少一位审批人' }]}
          >
            <Select
              mode="multiple"
              placeholder="请依次选择审批人员"
              optionFilterProp="children"
            >
              {users?.map((u: User) => (
                <Option key={u.id} value={u.id}>{u.name}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="审批详情"
        width={700}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      >
        {currentApproval && (
          <div className="space-y-6">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="审批标题">{currentApproval.title}</Descriptions.Item>
              <Descriptions.Item label="图纸">{drawing?.name} ({drawing?.drawingNumber})</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusColors[currentApproval.status]}>
                  {statusText[currentApproval.status]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="创建人">{currentApproval.createdByUser?.name || currentApproval.createdBy || '用户'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{currentApproval.createdAt}</Descriptions.Item>
            </Descriptions>

            <div>
              <h4 className="font-medium mb-4">审批流程</h4>
              <Steps
                direction="vertical"
                current={currentApproval.steps?.filter((s) => s.status === 'approved').length || 0}
                status={currentApproval.status === 'rejected' ? 'error' : 'process'}
                items={currentApproval.steps?.map((step: ApprovalStep) => {
                  const approverName = step.approver?.name || step.reviewer?.name || '负责人';
                  const stepApproverId = step.approverId || step.reviewerId;
                  const isMyTurn = user?.id === stepApproverId;
                  const prevSteps = currentApproval.steps?.filter((s: ApprovalStep) => (s.order || s.stepNumber) < (step.order || step.stepNumber)) || [];
                  const allPrevApproved = prevSteps.every((s: ApprovalStep) => s.status === 'approved');
                  const isPending = step.status === 'pending';
                  const canSign = isPending && isMyTurn && allPrevApproved && 
                    (currentApproval.status === 'pending' || currentApproval.status === 'reviewing');
                  const showWaitingTip = isPending && (!allPrevApproved || !isMyTurn) && 
                    (currentApproval.status === 'pending' || currentApproval.status === 'reviewing');
                  let stepStatusIcon: 'finish' | 'process' | 'error' | 'wait' = 'wait';
                  if (step.status === 'approved') stepStatusIcon = 'finish';
                  else if (step.status === 'rejected') stepStatusIcon = 'error';
                  else if (canSign) stepStatusIcon = 'process';
                  return {
                    title: (
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{approverName}</span>
                          <Tag color="purple" className="!mb-0">
                            第 {step.order || step.stepNumber} 步
                          </Tag>
                        </div>
                        {canSign && (
                          <Space>
                            <Button
                              type="primary"
                              size="small"
                              icon={<CheckCircleOutlined />}
                              onClick={() => handleSign(step)}
                            >
                              签字批准
                            </Button>
                            <Button
                              danger
                              size="small"
                              icon={<CloseCircleOutlined />}
                              onClick={handleReject}
                            >
                              驳回
                            </Button>
                          </Space>
                        )}
                        {showWaitingTip && !isMyTurn && (
                          <Tag icon={<ClockCircleOutlined />} color="default">
                            等待中
                          </Tag>
                        )}
                        {showWaitingTip && isMyTurn && !allPrevApproved && (
                          <Tag icon={<ClockCircleOutlined />} color="orange">
                            前置步骤未完成
                          </Tag>
                        )}
                      </div>
                    ),
                    description: (
                      <div className="mt-2">
                        <p className="text-xs text-slate-500 mb-1">
                          状态：{stepStatusText[step.status]}
                          {canSign && <span className="text-blue-600 font-medium ml-2">→ 轮到您审批</span>}
                        </p>
                        {step.signedBy && (
                          <p className="text-xs text-slate-600 mt-1">
                            签字人：{step.signedBy || approverName} · {step.signedAt}
                          </p>
                        )}
                        {step.comment && (
                          <p className="text-sm text-slate-700 mt-2 p-2 bg-slate-50 rounded">
                            {step.comment}
                          </p>
                        )}
                      </div>
                    ),
                    status: stepStatusIcon,
                  };
                })}
              />
            </div>

            {currentApproval.status === 'approved' && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircleOutlined className="text-lg" />
                  <span className="font-medium">审批已完成，图纸可下发施工</span>
                </div>
              </div>
            )}

            {currentApproval.status === 'rejected' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <CloseCircleOutlined className="text-lg" />
                  <span className="font-medium">审批已驳回</span>
                </div>
              </div>
            )}

            <Space className="w-full justify-end">
              <Button onClick={() => navigate(`/drawings/${drawing?.id}/preview`)}>
                <EyeOutlined /> 查看图纸
              </Button>
            </Space>
          </div>
        )}
      </Drawer>

      <Modal
        title="审批签字"
        open={showSignModal}
        onOk={handleSignSubmit}
        onCancel={() => setShowSignModal(false)}
        confirmLoading={signMutation.isPending}
      >
        {currentStep && (
          <div className="mb-4">
            <p className="text-sm text-slate-500">
              确认批准：<span className="font-medium text-slate-700">{selectedApproval?.title}</span>
            </p>
          </div>
        )}
        <Form form={signForm} layout="vertical">
          <Form.Item
            name="comment"
            label="审批意见"
          >
            <TextArea rows={3} placeholder="请输入审批意见（可选）" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="驳回审批"
        open={showRejectModal}
        onOk={handleRejectSubmit}
        onCancel={() => setShowRejectModal(false)}
        confirmLoading={rejectMutation.isPending}
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item
            name="comment"
            label="驳回原因"
            rules={[{ required: true, message: '请输入驳回原因' }]}
          >
            <TextArea rows={4} placeholder="请详细说明驳回原因..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Approvals;
