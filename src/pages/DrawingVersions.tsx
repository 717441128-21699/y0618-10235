import React from 'react';
import { Card, Button, Tag, Timeline, Space, Divider, Row, Col } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftOutlined,
  FileTextOutlined,
  UserOutlined,
  ClockCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { drawingApi } from '../api/client';
import type { Drawing, DrawingVersion } from '../../shared/index.js';

const DrawingVersions: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: drawing, isLoading } = useQuery({
    queryKey: ['drawing', id],
    queryFn: async () => {
      const res = await drawingApi.getDrawing(id!);
      return res.data.data;
    },
    enabled: !!id,
  });

  const { data: versions } = useQuery({
    queryKey: ['versions', id],
    queryFn: async () => {
      const res = await drawingApi.getVersions(id!);
      return res.data.data || [];
    },
    enabled: !!id,
  });

  if (isLoading || !drawing) {
    return <div className="flex items-center justify-center h-96">加载中...</div>;
  }

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/drawings')}
            className="bg-white"
          />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800">{drawing.name}</h1>
              <Tag color={statusColors[drawing.status] || 'default'}>
                {statusText[drawing.status] || drawing.status}
              </Tag>
            </div>
            <p className="text-slate-500 mt-1">版本历史 · {drawing.drawingNumber}</p>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="rounded-xl border-none">
          <Timeline
            mode="left"
            items={versions?.slice().reverse().map((version: DrawingVersion, index: number) => ({
              color: index === 0 ? 'blue' : 'gray',
              dot: index === 0 ? <FileTextOutlined className="text-blue-600" /> : <FileTextOutlined />,
              children: (
                <div className="pb-8">
                  <Card size="small" className="border border-slate-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          index === 0 ? 'bg-blue-100' : 'bg-slate-100'
                        }`}>
                          <FileTextOutlined className={index === 0 ? 'text-blue-600' : 'text-slate-500'} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-slate-800">版本 {version.version}</span>
                            {version.id === drawing.latestVersionId && (
                              <Tag color="blue" className="text-xs">最新版本</Tag>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                            <span className="flex items-center gap-1">
                              <UserOutlined /> {version.createdBy?.name}
                            </span>
                            <span className="flex items-center gap-1">
                              <ClockCircleOutlined /> {version.createdAt}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Space>
                        <Button
                          type="primary"
                          size="small"
                          icon={<EyeOutlined />}
                          onClick={() => navigate(`/drawings/${id}/preview`)}
                        >
                          查看预览
                        </Button>
                      </Space>
                    </div>
                    <Divider className="my-3" />
                    <div>
                      <p className="text-xs text-slate-500 mb-2">变更说明：</p>
                      <p className="text-sm text-slate-700">{version.changeDescription}</p>
                    </div>
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
                      <div className="text-xs">
                        <span className="text-slate-500">文件格式：</span>
                        <span className="text-slate-700 font-medium">{version.fileFormat?.toUpperCase()}</span>
                      </div>
                      <div className="text-xs">
                        <span className="text-slate-500">文件大小：</span>
                        <span className="text-slate-700 font-medium">{version.fileSize ? (version.fileSize / 1024 / 1024).toFixed(2) + ' MB' : '-'}</span>
                      </div>
                    </div>
                  </Card>
                </div>
              ),
            }))}
          />
        </Card>
      </motion.div>
    </div>
  );
};

export default DrawingVersions;
