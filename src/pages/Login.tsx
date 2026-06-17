import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined, FileTextOutlined } from '@ant-design/icons';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authApi } from '../api/client';
import { useAuthStore } from '../store/useAuthStore';
import type { LoginRequest } from '../../shared/index.js';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuthStore();
  const [form] = Form.useForm();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onFinish = async (values: LoginRequest) => {
    setLoading(true);
    try {
      const response = await authApi.login(values);
      const result = (await response).data;
      if (result.success && result.data) {
        login(result.data.token, result.data.user);
        message.success('登录成功！');
        navigate('/dashboard');
      } else {
        message.error(result.error || '登录失败');
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || '登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F3B86] via-[#1E5BC6] to-[#3A7BD5] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-300/10 rounded-full blur-3xl" />
      </div>

      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        <Card
          className="backdrop-blur-xl bg-white/95 rounded-2xl shadow-2xl border border-white/20 overflow-hidden"
          styles={{ body: { padding: '48px 40px' } }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="text-center mb-8"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
              <FileTextOutlined className="text-white text-4xl" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">工程图纸管理系统</h1>
            <p className="text-slate-500 text-sm">Engineering Drawing Control System</p>
          </motion.div>

          <Form
            form={form}
            name="login"
            onFinish={onFinish}
            initialValues={{ username: 'admin', password: '123456' }}
            size="large"
          >
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Form.Item
                name="username"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input
                  prefix={<UserOutlined className="text-slate-400" />}
                  placeholder="用户名"
                  className="h-12 rounded-lg"
                />
              </Form.Item>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Form.Item
                name="password"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-slate-400" />}
                  placeholder="密码"
                  className="h-12 rounded-lg"
                />
              </Form.Item>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 border-none font-medium text-base shadow-lg shadow-blue-500/30 rounded-lg"
                >
                  登 录
                </Button>
              </Form.Item>
            </motion.div>
          </Form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100"
          >
            <p className="text-xs text-slate-500 text-center mb-2">演示账号</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white rounded-lg p-2 text-center">
                <p className="font-medium text-slate-700">管理员</p>
                <p className="text-slate-500">admin / 123456</p>
              </div>
              <div className="bg-white rounded-lg p-2 text-center">
                <p className="font-medium text-slate-700">项目经理</p>
                <p className="text-slate-500">pm01 / 123456</p>
              </div>
            </div>
          </motion.div>
        </Card>

        <p className="text-center text-white/60 text-xs mt-6">
          © 2024 工程图纸版本管理系统 · 版权所有
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
