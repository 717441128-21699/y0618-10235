import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Select,
  Input,
  DatePicker,
} from 'antd';
import { useQuery } from '@tanstack/react-query';
import {
  HistoryOutlined,
  UserOutlined,
  FileTextOutlined,
  LinkOutlined,
  SearchOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { externalApi, drawingApi, userApi } from '../api/client';
import type { AccessLog, Drawing, User } from '../../shared/index.js';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

const AccessLogs: React.FC = () => {
  const [filters, setFilters] = useState({
    drawingId: undefined as string | undefined,
    userId: undefined as string | undefined,
    linkId: undefined as string | undefined,
    search: undefined as string | undefined,
  });

  const { data: logs, isLoading } = useQuery({
    queryKey: ['accessLogs', filters],
    queryFn: async () => {
      const res = await externalApi.getAccessLogs(filters);
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

  const { data: links } = useQuery({
    queryKey: ['externalLinks'],
    queryFn: async () => {
      const res = await externalApi.getLinks();
      return res.data.data || [];
    },
  });

  const columns = [
    {
      title: '访问时间',
      dataIndex: 'accessedAt',
      key: 'accessedAt',
      width: 180,
      render: (time: string) => (
        <span className="text-slate-600">{time}</span>
      ),
    },
    {
      title: '用户',
      key: 'user',
      render: (_: any, record: AccessLog) => {
        if (record.userId) {
          const user = users?.find((u: User) => u.id === record.userId);
          return (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <UserOutlined className="text-blue-600 text-sm" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">{user?.name || record.user?.name}</p>
                <p className="text-xs text-slate-400">内部用户</p>
              </div>
            </div>
          );
        } else {
          return (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                <LinkOutlined className="text-amber-600 text-sm" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">{record.externalViewer || '外部用户'}</p>
                <p className="text-xs text-slate-400">外部访问</p>
              </div>
            </div>
          );
        }
      },
    },
    {
      title: '访问图纸',
      key: 'drawing',
      render: (_: any, record: AccessLog) => {
        const drawing = drawings?.find((d: Drawing) => d.id === record.drawingId);
        if (!drawing) return '-';
        return (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center">
              <FileTextOutlined className="text-slate-500 text-sm" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">{drawing.name}</p>
              <p className="text-xs text-slate-400">{drawing.drawingNumber}</p>
            </div>
          </div>
        );
      },
    },
    {
      title: '访问类型',
      key: 'type',
      render: (_: any, record: AccessLog) => {
        if (record.linkId) {
          return <Tag color="orange">外部链接</Tag>;
        }
        return <Tag color="blue">内部访问</Tag>;
      },
    },
    {
      title: 'IP地址',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 140,
      render: (ip: string) => (
        <code className="bg-slate-100 px-2 py-1 rounded text-xs text-slate-600">{ip}</code>
      ),
    },
    {
      title: '设备信息',
      dataIndex: 'userAgent',
      key: 'userAgent',
      render: (ua: string) => (
        <span className="text-xs text-slate-500" title={ua}>
          {ua?.substring(0, 60)}...
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">访问审计</h1>
          <p className="text-slate-500 mt-1">查看系统所有访问记录与操作日志</p>
        </div>
        <Button icon={<DownloadOutlined />}>导出日志</Button>
      </div>

      <Card className="rounded-xl border-none">
        <Space wrap size="middle">
          <Input
            placeholder="搜索用户/IP..."
            prefix={<SearchOutlined className="text-slate-400" />}
            style={{ width: 200 }}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value || undefined })}
            allowClear
          />
          <Select
            placeholder="选择图纸"
            style={{ width: 200 }}
            allowClear
            value={filters.drawingId}
            onChange={(value) => setFilters({ ...filters, drawingId: value })}
          >
            {drawings?.map((d: Drawing) => (
              <Option key={d.id} value={d.id}>{d.name}</Option>
            ))}
          </Select>
          <Select
            placeholder="选择用户"
            style={{ width: 150 }}
            allowClear
            value={filters.userId}
            onChange={(value) => setFilters({ ...filters, userId: value })}
          >
            {users?.map((u: User) => (
              <Option key={u.id} value={u.id}>{u.name}</Option>
            ))}
          </Select>
          <RangePicker
            style={{ width: 280 }}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                console.log('Date filter:', dates);
              }
            }}
          />
          <Button onClick={() => setFilters({ drawingId: undefined, userId: undefined, linkId: undefined, search: undefined })}>
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
            dataSource={logs}
            loading={isLoading}
            rowKey="id"
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
            }}
            scroll={{ x: 1200 }}
          />
        </Card>
      </motion.div>

      <div className="grid grid-cols-4 gap-4">
        <Card size="small" className="border-none bg-blue-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <UserOutlined className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {logs?.filter((l: AccessLog) => l.userId).length || 0}
              </p>
              <p className="text-xs text-slate-500">内部访问</p>
            </div>
          </div>
        </Card>
        <Card size="small" className="border-none bg-amber-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <LinkOutlined className="text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {logs?.filter((l: AccessLog) => l.linkId).length || 0}
              </p>
              <p className="text-xs text-slate-500">外部访问</p>
            </div>
          </div>
        </Card>
        <Card size="small" className="border-none bg-green-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FileTextOutlined className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {new Set(logs?.map((l: AccessLog) => l.drawingId)).size || 0}
              </p>
              <p className="text-xs text-slate-500">访问图纸数</p>
            </div>
          </div>
        </Card>
        <Card size="small" className="border-none bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center">
              <HistoryOutlined className="text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{logs?.length || 0}</p>
              <p className="text-xs text-slate-500">总访问次数</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AccessLogs;
