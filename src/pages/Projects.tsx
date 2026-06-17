import React, { useState } from 'react';
import { Card, Table, Button, Tag, Modal, Form, Input, message, Space, Popconfirm } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusOutlined, EditOutlined, DeleteOutlined, ProjectOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { projectApi, drawingApi } from '../api/client';
import type { Project, Drawing } from '../../shared/index.js';

const Projects: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await projectApi.getProjects();
      return res.data.data?.items || [];
    },
  });

  const { data: drawings } = useQuery({
    queryKey: ['drawings'],
    queryFn: async () => {
      const res = await drawingApi.getDrawings();
      return res.data.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Project>) => {
      const res = await projectApi.createProject(data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      message.success('项目创建成功');
      setModalVisible(false);
      form.resetFields();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || '创建失败');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; data: Partial<Project> }) => {
      const res = await projectApi.updateProject(data.id, data.data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      message.success('项目更新成功');
      setModalVisible(false);
      setEditingProject(null);
      form.resetFields();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || '更新失败');
    },
  });

  const handleCreate = () => {
    setEditingProject(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    form.setFieldsValue(project);
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingProject) {
        updateMutation.mutate({ id: editingProject.id, data: values });
      } else {
        createMutation.mutate(values);
      }
    } catch (e) {
      console.error('Validation failed:', e);
    }
  };

  const columns = [
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Project) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            <ProjectOutlined className="text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-slate-800">{text}</p>
            <p className="text-xs text-slate-500">{record.code}</p>
          </div>
        </div>
      ),
    },
    {
      title: '图纸数量',
      key: 'drawingCount',
      render: (_: any, record: Project) => {
        const count = drawings?.filter((d: Drawing) => d.projectId === record.id).length || 0;
        return <Tag color="blue">{count} 张</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'default'}>
          {status === 'active' ? '进行中' : '已完成'}
        </Tag>
      ),
    },
    {
      title: '开始日期',
      dataIndex: 'startDate',
      key: 'startDate',
    },
    {
      title: '负责人',
      dataIndex: 'manager',
      key: 'manager',
      render: (manager: string) => manager || '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Project) => (
        <Space>
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
          <h1 className="text-2xl font-bold text-slate-800">项目管理</h1>
          <p className="text-slate-500 mt-1">管理所有工程项目及其专业分类</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新建项目
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border-none"
      >
        <Card className="border-none rounded-xl">
          <Table
            columns={columns}
            dataSource={projects}
            loading={isLoading}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </motion.div>

      <Modal
        title={editingProject ? '编辑项目' : '新建项目'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false);
          setEditingProject(null);
          form.resetFields();
        }}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="项目名称"
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input placeholder="请输入项目名称" />
          </Form.Item>
          <Form.Item
            name="code"
            label="项目编号"
            rules={[{ required: true, message: '请输入项目编号' }]}
          >
            <Input placeholder="如：PROJ-2024-001" />
          </Form.Item>
          <Form.Item
            name="description"
            label="项目描述"
          >
            <Input.TextArea rows={3} placeholder="请输入项目描述" />
          </Form.Item>
          <Form.Item
            name="manager"
            label="项目负责人"
          >
            <Input placeholder="请输入负责人姓名" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Projects;
