import React, { useState } from 'react';
import { Card, Table, Button, Tag, Modal, Form, Input, Select, message, Space, Popconfirm, Upload, InputNumber, Row, Col } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, UploadOutlined, HistoryOutlined, FileTextOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { projectApi, drawingApi } from '../api/client';
import type { Drawing, Project, Discipline } from '../../shared/index.js';

const { Option } = Select;

const Drawings: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [versionModalVisible, setVersionModalVisible] = useState(false);
  const [editingDrawing, setEditingDrawing] = useState<Drawing | null>(null);
  const [selectedDrawing, setSelectedDrawing] = useState<Drawing | null>(null);
  const [form] = Form.useForm();
  const [versionForm] = Form.useForm();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    projectId: undefined as string | undefined,
    disciplineId: undefined as string | undefined,
    status: undefined as string | undefined,
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await projectApi.getProjects();
      return res.data.data?.items || [];
    },
  });

  const { data: disciplines } = useQuery({
    queryKey: ['disciplines', filters.projectId],
    queryFn: async () => {
      if (!filters.projectId) return [];
      const res = await projectApi.getDisciplines(filters.projectId);
      return res.data.data || [];
    },
    enabled: !!filters.projectId,
  });

  const { data: drawings, isLoading } = useQuery({
    queryKey: ['drawings', filters],
    queryFn: async () => {
      const res = await drawingApi.getDrawings(filters);
      return res.data.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await drawingApi.createDrawing(data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drawings'] });
      message.success('图纸创建成功');
      setModalVisible(false);
      form.resetFields();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || '创建失败');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; data: Partial<Drawing> }) => {
      const res = await drawingApi.updateDrawing(data.id, data.data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drawings'] });
      message.success('图纸更新成功');
      setModalVisible(false);
      setEditingDrawing(null);
      form.resetFields();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || '更新失败');
    },
  });

  const createVersionMutation = useMutation({
    mutationFn: async (data: { drawingId: string; data: any }) => {
      const res = await drawingApi.createVersion(data.drawingId, data.data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drawings'] });
      message.success('版本上传成功');
      setVersionModalVisible(false);
      setSelectedDrawing(null);
      versionForm.resetFields();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || '上传失败');
    },
  });

  const statusColors: Record<string, string> = {
    draft: 'default',
    pending_review: 'blue',
    in_approval: 'orange',
    approved: 'green',
    rejected: 'red',
    issued: 'cyan',
  };

  const statusText: Record<string, string> = {
    draft: '草稿',
    pending_review: '待审阅',
    in_approval: '审批中',
    approved: '已批准',
    rejected: '已驳回',
    issued: '已下发',
  };

  const handleCreate = () => {
    setEditingDrawing(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (drawing: Drawing) => {
    setEditingDrawing(drawing);
    form.setFieldsValue(drawing);
    setModalVisible(true);
  };

  const handleNewVersion = (drawing: Drawing) => {
    setSelectedDrawing(drawing);
    versionForm.resetFields();
    setVersionModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingDrawing) {
        updateMutation.mutate({ id: editingDrawing.id, data: values });
      } else {
        createMutation.mutate(values);
      }
    } catch (e) {
      console.error('Validation failed:', e);
    }
  };

  const handleVersionSubmit = async () => {
    try {
      const values = await versionForm.validateFields();
      if (selectedDrawing) {
        createVersionMutation.mutate({
          drawingId: selectedDrawing.id,
          data: {
            ...values,
            filePath: '/sample.pdf',
          },
        });
      }
    } catch (e) {
      console.error('Validation failed:', e);
    }
  };

  const columns = [
    {
      title: '图纸名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Drawing) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            <FileTextOutlined className="text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-slate-800">{text}</p>
            <p className="text-xs text-slate-500">{record.drawingNumber}</p>
          </div>
        </div>
      ),
    },
    {
      title: '所属项目',
      key: 'project',
      render: (_: any, record: Drawing) => {
        const project = projects?.find((p: Project) => p.id === record.projectId);
        return project?.name || '-';
      },
    },
    {
      title: '专业',
      key: 'discipline',
      render: (_: any, record: Drawing) => record.discipline?.name || '-',
    },
    {
      title: '当前版本',
      key: 'version',
      render: (_: any, record: Drawing) => record.latestVersion?.version || '-',
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
      render: (_: any, record: Drawing) => record.createdByUser?.name || record.createdBy || '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Drawing) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/drawings/${record.id}/preview`)}
          >
            预览
          </Button>
          <Button
            type="link"
            icon={<HistoryOutlined />}
            onClick={() => navigate(`/drawings/${record.id}/versions`)}
          >
            版本
          </Button>
          <Button
            type="link"
            icon={<UploadOutlined />}
            onClick={() => handleNewVersion(record)}
          >
            新版本
          </Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">图纸管理</h1>
          <p className="text-slate-500 mt-1">管理所有工程图纸及其版本历史</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新建图纸
        </Button>
      </div>

      <Card className="rounded-xl border-none mb-4">
        <Space wrap>
          <Select
            placeholder="选择项目"
            style={{ width: 200 }}
            allowClear
            value={filters.projectId}
            onChange={(value) => setFilters({ ...filters, projectId: value, disciplineId: undefined })}
          >
            {projects?.map((p: Project) => (
              <Option key={p.id} value={p.id}>{p.name}</Option>
            ))}
          </Select>
          <Select
            placeholder="选择专业"
            style={{ width: 200 }}
            allowClear
            value={filters.disciplineId}
            onChange={(value) => setFilters({ ...filters, disciplineId: value })}
            disabled={!filters.projectId}
          >
            {disciplines?.map((d: Discipline) => (
              <Option key={d.id} value={d.id}>{d.name}</Option>
            ))}
          </Select>
          <Select
            placeholder="选择状态"
            style={{ width: 150 }}
            allowClear
            value={filters.status}
            onChange={(value) => setFilters({ ...filters, status: value })}
          >
            <Option value="draft">草稿</Option>
            <Option value="pending_review">待审阅</Option>
            <Option value="in_approval">审批中</Option>
            <Option value="approved">已批准</Option>
            <Option value="rejected">已驳回</Option>
            <Option value="issued">已下发</Option>
          </Select>
          <Button onClick={() => setFilters({ projectId: undefined, disciplineId: undefined, status: undefined })}>
            重置
          </Button>
        </Space>
      </Card>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-none rounded-xl">
          <Table
            columns={columns}
            dataSource={drawings}
            loading={isLoading}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </motion.div>

      <Modal
        title={editingDrawing ? '编辑图纸' : '新建图纸'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false);
          setEditingDrawing(null);
          form.resetFields();
        }}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="图纸名称"
                rules={[{ required: true, message: '请输入图纸名称' }]}
              >
                <Input placeholder="请输入图纸名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="drawingNumber"
                label="图纸编号"
                rules={[{ required: true, message: '请输入图纸编号' }]}
              >
                <Input placeholder="如：DWG-MECH-2024-001" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="projectId"
                label="所属项目"
                rules={[{ required: true, message: '请选择项目' }]}
              >
                <Select placeholder="请选择项目">
                  {projects?.map((p: Project) => (
                    <Option key={p.id} value={p.id}>{p.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="disciplineId"
                label="专业分类"
                rules={[{ required: true, message: '请选择专业' }]}
              >
                <Select placeholder="请选择专业">
                  {disciplines?.map((d: Discipline) => (
                    <Option key={d.id} value={d.id}>{d.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="description"
            label="图纸描述"
          >
            <Input.TextArea rows={3} placeholder="请输入图纸描述" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="上传新版本"
        open={versionModalVisible}
        onOk={handleVersionSubmit}
        onCancel={() => {
          setVersionModalVisible(false);
          setSelectedDrawing(null);
          versionForm.resetFields();
        }}
        confirmLoading={createVersionMutation.isPending}
      >
        <Form form={versionForm} layout="vertical">
          <Form.Item
            name="version"
            label="版本号"
            rules={[{ required: true, message: '请输入版本号' }]}
          >
            <Input placeholder="如：v2.0" />
          </Form.Item>
          <Form.Item
            name="changeDescription"
            label="变更说明"
            rules={[{ required: true, message: '请输入变更说明' }]}
          >
            <Input.TextArea rows={4} placeholder="请详细描述本次修改内容" />
          </Form.Item>
          <Form.Item
            name="file"
            label="图纸文件"
            extra="支持PDF、DWG格式"
          >
            <Upload>
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Drawings;
