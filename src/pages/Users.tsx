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
  Switch,
  Avatar,
} from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PlusOutlined,
  EditOutlined,
  UserOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { userApi } from '../api/client';
import type { User } from '../../shared/index.js';

const { Option } = Select;

const roleNames: Record<string, string> = {
  admin: '系统管理员',
  project_manager: '项目负责人',
  designer: '设计师',
  reviewer: '审校员',
  viewer: '查看者',
};

const roleColors: Record<string, string> = {
  admin: 'red',
  project_manager: 'blue',
  designer: 'cyan',
  reviewer: 'orange',
  viewer: 'green',
};

const Users: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await userApi.getUsers();
      return res.data.data || [];
    },
  });

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await userApi.getRoles();
      return res.data.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await userApi.createUser(data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      message.success('用户创建成功');
      setModalVisible(false);
      form.resetFields();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || '创建失败');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; data: Partial<User> }) => {
      const res = await userApi.updateUser(data.id, data.data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      message.success('用户更新成功');
      setModalVisible(false);
      setEditingUser(null);
      form.resetFields();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || '更新失败');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (data: { id: string; isActive: boolean }) => {
      const res = await userApi.updateUser(data.id, { isActive: data.isActive });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      message.success('状态已更新');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || '更新失败');
    },
  });

  const handleCreate = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue(user);
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingUser) {
        updateMutation.mutate({ id: editingUser.id, data: values });
      } else {
        createMutation.mutate(values);
      }
    } catch (e) {
      console.error('Validation failed:', e);
    }
  };

  const handleToggleStatus = (user: User) => {
    toggleStatusMutation.mutate({ id: user.id, isActive: !user.isActive });
  };

  const columns = [
    {
      title: '用户信息',
      key: 'user',
      render: (_: any, record: User) => (
        <div className="flex items-center gap-3">
          <Avatar
            size={40}
            className="bg-gradient-to-br from-blue-500 to-blue-700 font-medium"
            icon={<UserOutlined />}
          >
            {record.name.charAt(0)}
          </Avatar>
          <div>
            <p className="font-medium text-slate-800">{record.name}</p>
            <p className="text-xs text-slate-500">{record.username} · {record.email}</p>
          </div>
        </div>
      ),
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={roleColors[role]}>{roleNames[role] || role}</Tag>
      ),
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      render: (dept: string) => dept || '-',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone: string) => phone || '-',
    },
    {
      title: '状态',
      key: 'status',
      render: (_: any, record: User) => (
        <Space>
          <Switch
            checked={record.isActive}
            onChange={() => handleToggleStatus(record)}
            checkedChildren="启用"
            unCheckedChildren="禁用"
          />
          <Tag color={record.isActive ? 'green' : 'default'}>
            {record.isActive ? '正常' : '禁用'}
          </Tag>
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: User) => (
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
        >
          编辑
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">用户管理</h1>
          <p className="text-slate-500 mt-1">管理系统用户及其权限角色</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新建用户
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-none rounded-xl">
          <Table
            columns={columns}
            dataSource={users}
            loading={isLoading}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </motion.div>

      <Modal
        title={editingUser ? '编辑用户' : '新建用户'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false);
          setEditingUser(null);
          form.resetFields();
        }}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        width={500}
      >
        <Form form={form} layout="vertical">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="username"
              label="用户名"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input placeholder="请输入用户名" />
            </Form.Item>
            <Form.Item
              name="name"
              label="姓名"
              rules={[{ required: true, message: '请输入姓名' }]}
            >
              <Input placeholder="请输入姓名" />
            </Form.Item>
          </div>
          {!editingUser && (
            <Form.Item
              name="password"
              label="初始密码"
              rules={[{ required: true, message: '请输入初始密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-slate-400" />}
                placeholder="请输入初始密码"
              />
            </Form.Item>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="role"
              label="角色"
              rules={[{ required: true, message: '请选择角色' }]}
            >
              <Select placeholder="请选择角色">
                {roles?.map((r: any) => (
                  <Option key={r.value} value={r.value}>{r.label}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="department"
              label="部门"
            >
              <Input placeholder="请输入部门" />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="email"
              label="邮箱"
              rules={[{ type: 'email', message: '请输入正确的邮箱' }]}
            >
              <Input placeholder="请输入邮箱" />
            </Form.Item>
            <Form.Item
              name="phone"
              label="手机号"
            >
              <Input placeholder="请输入手机号" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Users;
