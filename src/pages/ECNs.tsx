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
  Row,
  Col,
  Descriptions,
  List,
  Avatar,
  Checkbox,
  Divider,
} from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PlusOutlined,
  BellOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  FileTextOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { ecnApi, drawingApi } from '../api/client';
import type { ECN, Drawing, Department, ECNNotification } from '../../shared/index.js';

const { Option } = Select;
const { TextArea } = Input;

const ECNs: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedECN, setSelectedECN] = useState<ECN | null>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data: ecns, isLoading } = useQuery({
    queryKey: ['ecns'],
    queryFn: async () => {
      const res = await ecnApi.getECNs();
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

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await ecnApi.getDepartments();
      return res.data.data || [];
    },
  });

  const { data: ecnDetail } = useQuery({
    queryKey: ['ecnDetail', selectedECN?.id],
    queryFn: async () => {
      if (!selectedECN) return null;
      const res = await ecnApi.getECN(selectedECN.id);
      return res.data.data;
    },
    enabled: !!selectedECN && drawerVisible,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await ecnApi.createECN(data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ecns'] });
      message.success('ECN创建成功');
      setModalVisible(false);
      form.resetFields();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || '创建失败');
    },
  });

  const issueMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await ecnApi.issueECN(id);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ecns', 'ecnDetail'] });
      message.success('ECN已发布');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || '发布失败');
    },
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async (data: { ecnId: string; notificationId: string }) => {
      const res = await ecnApi.acknowledgeECN(data.ecnId, data.notificationId);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ecns', 'ecnDetail'] });
      message.success('已确认回执');
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
      createMutation.mutate(values);
    } catch (e) {
      console.error('Validation failed:', e);
    }
  };

  const handleViewDetail = (ecn: ECN) => {
    setSelectedECN(ecn);
    setDrawerVisible(true);
  };

  const handleIssue = (id: string) => {
    issueMutation.mutate(id);
  };

  const handleAcknowledge = (ecnId: string, notificationId: string) => {
    acknowledgeMutation.mutate({ ecnId, notificationId });
  };

  const statusColors: Record<string, string> = {
    draft: 'default',
    issued: 'blue',
    acknowledged: 'green',
  };

  const statusText: Record<string, string> = {
    draft: '草稿',
    issued: '已发布',
    acknowledged: '已确认',
  };

  const currentECN = ecnDetail || selectedECN;
  const affectedDrawings = currentECN?.drawings?.map((d: any) => {
    const fullDrawing = drawings?.find((dwg: Drawing) => dwg.id === d.id);
    return fullDrawing || d;
  }) || [];

  const columns = [
    {
      title: 'ECN编号',
      dataIndex: 'ecnNumber',
      key: 'ecnNumber',
      render: (text: string, record: ECN) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
            <BellOutlined className="text-amber-600" />
          </div>
          <div>
            <p className="font-medium text-slate-800">{text}</p>
            <p className="text-xs text-slate-500">{record.title}</p>
          </div>
        </div>
      ),
    },
    {
      title: '关联图纸',
      key: 'drawings',
      render: (_: any, record: ECN) => (
        <Tag color="blue">{record.drawings?.length || 0} 张</Tag>
      ),
    },
    {
      title: '通知部门',
      key: 'departments',
      render: (_: any, record: ECN) => (
        <Tag color="green">{record.notifications?.length || 0} 个</Tag>
      ),
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
      render: (_: any, record: ECN) => record.createdByUser?.name || record.createdBy || '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ECN) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            查看
          </Button>
          {record.status === 'draft' && (
            <Button
              type="link"
              icon={<SendOutlined />}
              className="text-blue-600"
              onClick={() => handleIssue(record.id)}
            >
              发布
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">变更通知(ECN)</h1>
          <p className="text-slate-500 mt-1">管理工程变更通知，通知相关部门</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新建ECN
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-none rounded-xl">
          <Table
            columns={columns}
            dataSource={ecns}
            loading={isLoading}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </motion.div>

      <Modal
        title="新建变更通知(ECN)"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        confirmLoading={createMutation.isPending}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="ECN标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="请输入ECN标题" />
          </Form.Item>
          <Form.Item
            name="description"
            label="变更说明"
            rules={[{ required: true, message: '请输入变更说明' }]}
          >
            <TextArea rows={4} placeholder="请详细描述变更内容..." />
          </Form.Item>
          <Form.Item
            name="drawingIds"
            label="关联图纸"
            rules={[{ required: true, message: '请选择关联图纸' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择受影响的图纸"
              optionFilterProp="children"
            >
              {drawings?.map((d: Drawing) => (
                <Option key={d.id} value={d.id}>{d.name} ({d.drawingNumber})</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="departmentIds"
            label="通知部门"
            rules={[{ required: true, message: '请选择通知部门' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择需要通知的部门"
              optionFilterProp="children"
            >
              {departments?.map((d: Department) => (
                <Option key={d.id} value={d.id}>{d.name}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="ECN详情"
        width={700}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      >
        {currentECN && (
          <div className="space-y-6">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="ECN编号">{currentECN.ecnNumber}</Descriptions.Item>
              <Descriptions.Item label="标题">{currentECN.title}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusColors[currentECN.status]}>
                  {statusText[currentECN.status]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="创建人">{currentECN.createdByUser?.name || currentECN.createdBy || '用户'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{currentECN.createdAt}</Descriptions.Item>
              <Descriptions.Item label="变更说明">
                {currentECN.description}
              </Descriptions.Item>
            </Descriptions>

            <div>
              <h4 className="font-medium mb-3">关联图纸</h4>
              <List
                dataSource={affectedDrawings}
                renderItem={(drawing: Drawing) => (
                  <List.Item className="px-0 border-b border-slate-100 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-50 rounded flex items-center justify-center">
                        <FileTextOutlined className="text-blue-600 text-sm" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{drawing.name}</p>
                        <p className="text-xs text-slate-500">{drawing.drawingNumber}</p>
                      </div>
                      <Tag color={drawing.status === 'approved' ? 'green' : 'orange'}>
                        {drawing.latestVersion?.version || '-'}
                      </Tag>
                    </div>
                  </List.Item>
                )}
              />
            </div>

            <div>
              <h4 className="font-medium mb-3">通知回执</h4>
              <List
                dataSource={currentECN.notifications}
                renderItem={(notification: ECNNotification) => (
                  <List.Item className="px-0 border-b border-slate-100 py-3">
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-8 h-8 bg-green-50 rounded flex items-center justify-center">
                        <BellOutlined className="text-green-600 text-sm" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{notification.department?.name}</p>
                        <p className="text-xs text-slate-500">
                          {notification.acknowledgedBy
                            ? `已确认：${notification.acknowledgedBy} · ${notification.acknowledgedAt}`
                            : '待确认'}
                        </p>
                      </div>
                      {notification.acknowledgedBy ? (
                        <Tag color="green">已确认</Tag>
                      ) : (
                        <Button
                          type="primary"
                          size="small"
                          icon={<CheckCircleOutlined />}
                          onClick={() => handleAcknowledge(currentECN.id, notification.id)}
                        >
                          确认回执
                        </Button>
                      )}
                    </div>
                  </List.Item>
                )}
              />
            </div>

            {currentECN.status === 'draft' && (
              <Button
                type="primary"
                block
                icon={<SendOutlined />}
                onClick={() => handleIssue(currentECN.id)}
                loading={issueMutation.isPending}
              >
                发布ECN
              </Button>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default ECNs;
