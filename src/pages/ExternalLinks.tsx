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
  Drawer,
  Descriptions,
  InputNumber,
  DatePicker,
  Tooltip,
  List,
} from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PlusOutlined,
  LinkOutlined,
  CopyOutlined,
  EyeOutlined,
  FileTextOutlined,
  HistoryOutlined,
  StopOutlined,
  CheckCircleOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { externalApi, drawingApi } from '../api/client';
import type { ExternalLink, Drawing, AccessLog } from '../../shared/index.js';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

const ExternalLinks: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedLink, setSelectedLink] = useState<ExternalLink | null>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data: links, isLoading } = useQuery({
    queryKey: ['externalLinks'],
    queryFn: async () => {
      const res = await externalApi.getLinks();
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

  const { data: accessLogs } = useQuery({
    queryKey: ['accessLogs', selectedLink?.id],
    queryFn: async () => {
      if (!selectedLink) return [];
      const res = await externalApi.getAccessLogs({ linkId: selectedLink.id });
      return res.data.data || [];
    },
    enabled: !!selectedLink && drawerVisible,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await externalApi.createLink(data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['externalLinks'] });
      message.success('外部链接创建成功');
      setModalVisible(false);
      form.resetFields();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || '创建失败');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; data: Partial<ExternalLink> }) => {
      const res = await externalApi.updateLink(data.id, data.data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['externalLinks'] });
      message.success('链接已更新');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || '更新失败');
    },
  });

  const handleCreate = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const data: any = {
        drawingId: values.drawingId,
      };
      if (values.expiresAt) {
        data.expiresAt = values.expiresAt.format('YYYY-MM-DD HH:mm:ss');
      }
      if (values.maxAccess) {
        data.maxAccess = values.maxAccess;
      }
      createMutation.mutate(data);
    } catch (e) {
      console.error('Validation failed:', e);
    }
  };

  const handleViewDetail = (link: ExternalLink) => {
    setSelectedLink(link);
    setDrawerVisible(true);
  };

  const handleToggleStatus = (link: ExternalLink) => {
    updateMutation.mutate({
      id: link.id,
      data: { isActive: !link.isActive },
    });
  };

  const handleCopyLink = (link: ExternalLink) => {
    const fullUrl = `${window.location.origin}/external/${link.token}`;
    navigator.clipboard.writeText(fullUrl);
    message.success('链接已复制到剪贴板');
  };

  const isExpired = (link: ExternalLink) => {
    if (!link.expiresAt) return false;
    return dayjs(link.expiresAt).isBefore(dayjs());
  };

  const columns = [
    {
      title: '图纸名称',
      key: 'drawing',
      render: (_: any, record: ExternalLink) => {
        const drawing = drawings?.find((d: Drawing) => d.id === record.drawingId);
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <FileTextOutlined className="text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-slate-800">{drawing?.name || '-'}</p>
              <p className="text-xs text-slate-500">{drawing?.drawingNumber}</p>
            </div>
          </div>
        );
      },
    },
    {
      title: '访问码',
      dataIndex: 'token',
      key: 'token',
      render: (token: string) => (
        <code className="bg-slate-100 px-2 py-1 rounded text-xs">{token.substring(0, 8)}...</code>
      ),
    },
    {
      title: '访问次数',
      key: 'accessCount',
      render: (_: any, record: ExternalLink) => (
        <span>{record.accessCount || 0} / {record.maxAccess || '不限'}</span>
      ),
    },
    {
      title: '有效期',
      key: 'expiresAt',
      render: (_: any, record: ExternalLink) => {
        if (!record.expiresAt) return <Tag>永久有效</Tag>;
        if (isExpired(record)) return <Tag color="red">已过期</Tag>;
        return <Tag color="blue">{dayjs(record.expiresAt).format('YYYY-MM-DD HH:mm')}</Tag>;
      },
    },
    {
      title: '状态',
      key: 'status',
      render: (_: any, record: ExternalLink) => {
        if (!record.isActive) return <Tag color="default">已停用</Tag>;
        if (isExpired(record)) return <Tag color="red">已过期</Tag>;
        if (record.maxAccess && record.accessCount >= record.maxAccess) {
          return <Tag color="orange">次数耗尽</Tag>;
        }
        return <Tag color="green">有效</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ExternalLink) => (
        <Space>
          <Tooltip title="复制链接">
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={() => handleCopyLink(record)}
            />
          </Tooltip>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          <Button
            type="link"
            icon={record.isActive ? <StopOutlined /> : <CheckCircleOutlined />}
            className={record.isActive ? 'text-red-600' : 'text-green-600'}
            onClick={() => handleToggleStatus(record)}
          >
            {record.isActive ? '停用' : '启用'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">外部链接</h1>
          <p className="text-slate-500 mt-1">生成临时链接供外部合作方查阅图纸</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          生成链接
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-none rounded-xl">
          <Table
            columns={columns}
            dataSource={links}
            loading={isLoading}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </motion.div>

      <Modal
        title="生成外部链接"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        confirmLoading={createMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="drawingId"
            label="选择图纸"
            rules={[{ required: true, message: '请选择图纸' }]}
          >
            <Select placeholder="请选择要分享的图纸">
              {drawings?.map((d: Drawing) => (
                <Option key={d.id} value={d.id}>
                  {d.name} ({d.drawingNumber})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="expiresAt"
            label="有效期"
            extra="不设置则永久有效"
          >
            <DatePicker
              showTime
              style={{ width: '100%' }}
              placeholder="选择过期时间"
              minDate={dayjs()}
            />
          </Form.Item>
          <Form.Item
            name="maxAccess"
            label="最大访问次数"
            extra="不设置则不限次数"
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="输入最大访问次数" />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="外部链接详情"
        width={600}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      >
        {selectedLink && (
          <div className="space-y-6">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="图纸">
                {drawings?.find((d: Drawing) => d.id === selectedLink.drawingId)?.name}
              </Descriptions.Item>
              <Descriptions.Item label="访问链接">
                <div className="flex items-center gap-2">
                  <code className="bg-slate-100 px-2 py-1 rounded text-xs flex-1 truncate">
                    {`${window.location.origin}/external/${selectedLink.token}`}
                  </code>
                  <Button
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => handleCopyLink(selectedLink)}
                  />
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="访问次数">
                {selectedLink.accessCount || 0} / {selectedLink.maxAccess || '不限'}
              </Descriptions.Item>
              <Descriptions.Item label="有效期">
                {selectedLink.expiresAt
                  ? dayjs(selectedLink.expiresAt).format('YYYY-MM-DD HH:mm:ss')
                  : '永久有效'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {selectedLink.createdAt}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {!selectedLink.isActive
                  ? <Tag color="default">已停用</Tag>
                  : isExpired(selectedLink)
                    ? <Tag color="red">已过期</Tag>
                    : <Tag color="green">有效</Tag>}
              </Descriptions.Item>
            </Descriptions>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <HistoryOutlined className="text-blue-600" />
                <h4 className="font-medium">访问记录</h4>
              </div>
              <List
                dataSource={accessLogs}
                size="small"
                renderItem={(log: AccessLog) => (
                  <List.Item className="border-b border-slate-100 py-3">
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                        <UserOutlined className="text-slate-500 text-sm" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {log.externalViewer || '外部用户'}
                        </p>
                        <p className="text-xs text-slate-500">
                          IP: {log.ipAddress} · {log.userAgent?.substring(0, 50)}...
                        </p>
                      </div>
                      <span className="text-xs text-slate-400">{log.accessedAt}</span>
                    </div>
                  </List.Item>
                )}
              />
              {accessLogs?.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  暂无访问记录
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default ExternalLinks;
