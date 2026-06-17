import React from 'react';
import { Card, Row, Col, Statistic, List, Tag, Table, Progress } from 'antd';
import { useQuery } from '@tanstack/react-query';
import {
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  BellOutlined,
  ArrowUpOutlined,
  EyeOutlined,
  ProjectOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { projectApi, drawingApi, approvalApi, ecnApi } from '../api/client';
import type { Drawing, Approval, ECN, Project } from '../../shared/index.js';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const Dashboard: React.FC = () => {
  const { data: projects } = useQuery({
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

  const { data: approvals } = useQuery({
    queryKey: ['approvals'],
    queryFn: async () => {
      const res = await approvalApi.getApprovals();
      return res.data.data || [];
    },
  });

  const { data: ecns } = useQuery({
    queryKey: ['ecns'],
    queryFn: async () => {
      const res = await ecnApi.getECNs();
      return res.data.data || [];
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

  const statusDisciplineData = drawings?.reduce((acc: any[], d: Drawing) => {
    const existing = acc.find((item) => item.name === d.discipline?.name);
    if (existing) {
      existing.value++;
    } else {
      acc.push({ name: d.discipline?.name || '其他', value: 1 });
    }
    return acc;
  }, []) || [];

  const projectStatsData = projects?.slice(0, 6).map((p: Project) => ({
    name: p.name.length > 6 ? p.name.substring(0, 6) + '...' : p.name,
    drawings: (drawings?.filter((d: Drawing) => d.projectId === p.id) || []).length,
  })) || [];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const recentApprovals = approvals?.slice(0, 5).map((a: Approval) => ({
    ...a,
    drawing: drawings?.find((d: Drawing) => d.id === a.drawingId),
  })) || [];

  const recentECNs = ecns?.slice(0, 5) || [];

  const stats = [
    {
      title: '图纸总数',
      value: drawings?.length || 0,
      icon: <FileTextOutlined className="text-2xl" />,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      title: '审批中',
      value: approvals?.filter((a: Approval) => a.status === 'pending').length || 0,
      icon: <ClockCircleOutlined className="text-2xl" />,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
    },
    {
      title: '已批准',
      value: approvals?.filter((a: Approval) => a.status === 'approved').length || 0,
      icon: <CheckCircleOutlined className="text-2xl" />,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      title: '待处理ECN',
      value: ecns?.filter((e: ECN) => e.status === 'issued').length || 0,
      icon: <BellOutlined className="text-2xl" />,
      color: 'from-rose-500 to-rose-600',
      bgColor: 'bg-rose-50',
      iconBg: 'bg-rose-100',
      iconColor: 'text-rose-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">仪表盘</h1>
          <p className="text-slate-500 mt-1">系统概览与关键指标</p>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        {stats.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow border-none rounded-xl overflow-hidden">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-sm mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                      <ArrowUpOutlined />
                      <span>较上月 +12%</span>
                    </div>
                  </div>
                  <div className={`w-14 h-14 ${stat.iconBg} rounded-xl flex items-center justify-center ${stat.iconColor}`}>
                    {stat.icon}
                  </div>
                </div>
              </Card>
            </motion.div>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="项目图纸分布" className="rounded-xl border-none">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectStatsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94A3B8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94A3B8" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Bar dataKey="drawings" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="专业分类占比" className="rounded-xl border-none">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDisciplineData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {statusDisciplineData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title="最近审批"
            className="rounded-xl border-none"
            extra={<a className="text-blue-600 text-sm">查看全部</a>}
          >
            <List
              dataSource={recentApprovals}
              renderItem={(item: any) => (
                <List.Item className="px-0 py-3 border-b border-slate-100 last:border-0">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        <FileTextOutlined className="text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{item.title}</p>
                        <p className="text-xs text-slate-500">{item.drawing?.drawingNumber}</p>
                      </div>
                    </div>
                    <Tag color={statusColors[item.status] || 'default'}>
                      {statusText[item.status] || item.status}
                    </Tag>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title="最近ECN变更"
            className="rounded-xl border-none"
            extra={<a className="text-blue-600 text-sm">查看全部</a>}
          >
            <List
              dataSource={recentECNs}
              renderItem={(item: ECN) => (
                <List.Item className="px-0 py-3 border-b border-slate-100 last:border-0">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                        <WarningOutlined className="text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{item.ecnNumber}</p>
                        <p className="text-xs text-slate-500 line-clamp-1">{item.title}</p>
                      </div>
                    </div>
                    <Tag color={statusColors[item.status] || 'default'}>
                      {statusText[item.status] || item.status}
                    </Tag>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
