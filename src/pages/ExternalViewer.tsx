import React, { useState } from 'react';
import {
  Card,
  Button,
  Tag,
  Space,
  Select,
  message,
  Spin,
  Result,
  Row,
  Col,
  Descriptions,
  List,
  Avatar,
  Comment,
} from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  CommentOutlined,
  FileTextOutlined,
  UserOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { externalApi } from '../api/client';
import type { Drawing, DrawingVersion, Annotation, AnnotationReply } from '../../shared/index.js';

const { Option } = Select;

const ExternalViewer: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [zoom, setZoom] = useState(1);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);

  const { data: externalData, isLoading, error } = useQuery({
    queryKey: ['externalDrawing', token],
    queryFn: async () => {
      if (!token) throw new Error('缺少访问令牌');
      const res = await externalApi.getExternalDrawing(token);
      return res.data;
    },
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (error || !externalData?.success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl rounded-2xl">
          <Result
            status="404"
            title="链接无效或已过期"
            subTitle={externalData?.error || '该链接可能已过期、已被禁用或访问次数已达上限，请联系相关负责人获取新的链接。'}
            extra={
              <Button type="primary" onClick={() => navigate('/login')}>
                返回登录
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  const data = externalData.data;
  const drawing = data?.drawing as Drawing;
  const version = data?.version as DrawingVersion;
  const annotations = data?.annotations as Annotation[] || [];

  if (!drawing) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Result
          status="warning"
          title="图纸信息加载失败"
          extra={<Button type="primary" onClick={() => window.location.reload()}>重新加载</Button>}
        />
      </div>
    );
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
    <div className="min-h-screen bg-slate-100">
      <div className="bg-white border-b border-slate-200 shadow-sm px-6 py-4">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
              <FileTextOutlined className="text-white text-2xl" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-slate-800">{drawing.name}</h1>
                <Tag color={statusColors[drawing.status] || 'default'}>
                  {statusText[drawing.status] || drawing.status}
                </Tag>
              </div>
              <p className="text-sm text-slate-500">{drawing.drawingNumber} · {drawing.discipline?.name}</p>
            </div>
          </div>
          <Space>
            <Button
              icon={<ZoomOutOutlined />}
              onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
            />
            <span className="text-sm font-medium">{Math.round(zoom * 100)}%</span>
            <Button
              icon={<ZoomInOutlined />}
              onClick={() => setZoom(Math.min(2, zoom + 0.1))}
            />
          </Space>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm overflow-hidden"
        >
          <Row gutter={0}>
            <Col span={18} className="border-r border-slate-200">
              <div
                className="relative bg-slate-100 overflow-auto"
                style={{ height: 'calc(100vh - 180px)' }}
              >
                <div
                  className="relative"
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top left',
                    width: '800px',
                    height: '1000px',
                  }}
                >
                  <div className="absolute inset-0 bg-white border border-slate-200">
                    <svg className="w-full h-full" viewBox="0 0 800 1000">
                      <rect width="800" height="1000" fill="white" />
                      <defs>
                        <pattern id="grid-ext" width="50" height="50" patternUnits="userSpaceOnUse">
                          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#E2E8F0" strokeWidth="0.5" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid-ext)" />

                      <rect x="50" y="50" width="700" height="900" fill="none" stroke="#94A3B8" strokeWidth="1" />
                      <rect x="60" y="60" width="680" height="800" fill="none" stroke="#CBD5E1" strokeWidth="0.5" />

                      <rect x="100" y="150" width="250" height="150" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="2" />
                      <rect x="400" y="150" width="250" height="150" fill="#F0FDF4" stroke="#10B981" strokeWidth="2" />
                      <rect x="100" y="400" width="550" height="200" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2" />
                      <circle cx="225" cy="225" r="50" fill="none" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="5,3" />
                      <circle cx="525" cy="225" r="60" fill="none" stroke="#10B981" strokeWidth="1.5" />
                      <line x1="100" y1="650" x2="650" y2="650" stroke="#64748B" strokeWidth="1" />
                      <line x1="100" y1="700" x2="650" y2="700" stroke="#64748B" strokeWidth="1" />

                      <text x="225" y="230" textAnchor="middle" fill="#1E40AF" fontSize="14" fontWeight="bold">
                        主视图 A-A
                      </text>
                      <text x="525" y="230" textAnchor="middle" fill="#166534" fontSize="14" fontWeight="bold">
                        侧视图 B-B
                      </text>
                      <text x="375" y="505" textAnchor="middle" fill="#92400E" fontSize="14" fontWeight="bold">
                        俯视图 - 装配关系示意
                      </text>

                      <g stroke="#94A3B8" strokeWidth="0.5">
                        <line x1="80" y1="150" x2="80" y2="300" />
                        <line x1="75" y1="150" x2="85" y2="150" />
                        <line x1="75" y1="300" x2="85" y2="300" />
                        <text x="70" y="230" textAnchor="middle" fill="#64748B" fontSize="10" transform="rotate(-90, 70, 230)">
                          150
                        </text>
                      </g>
                      <g stroke="#94A3B8" strokeWidth="0.5">
                        <line x1="100" y1="610" x2="650" y2="610" />
                        <line x1="100" y1="605" x2="100" y2="615" />
                        <line x1="650" y1="605" x2="650" y2="615" />
                        <text x="375" y="600" textAnchor="middle" fill="#64748B" fontSize="10">
                          550
                        </text>
                      </g>

                      <rect x="600" y="880" width="140" height="60" fill="#F8FAFC" stroke="#CBD5E1" />
                      <text x="670" y="905" textAnchor="middle" fill="#334155" fontSize="12" fontWeight="bold">
                        {drawing.drawingNumber}
                      </text>
                      <text x="670" y="925" textAnchor="middle" fill="#64748B" fontSize="10">
                        {version?.version || 'v1.0'}
                      </text>
                    </svg>
                  </div>

                  {annotations.map((annotation: Annotation) => (
                    <div
                      key={annotation.id}
                      className="absolute"
                      style={{
                        left: annotation.x,
                        top: annotation.y,
                        width: annotation.width,
                        height: annotation.height,
                      }}
                    >
                      <div
                        className={`w-full h-full border-2 rounded ${
                          annotation.status === 'resolved'
                            ? 'border-green-500 bg-green-500/10'
                            : 'border-red-500 bg-red-500/10'
                        }`}
                      />
                      <div
                        className={`absolute -top-6 -left-1 px-2 py-0.5 rounded text-xs font-medium text-white ${
                          annotation.status === 'resolved' ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      >
                        <CommentOutlined className="mr-1" />
                        {annotation.author?.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Col>

            <Col span={6}>
              <div className="p-4 space-y-4" style={{ height: 'calc(100vh - 180px)', overflowY: 'auto' }}>
                {version && (
                  <Card size="small" className="border-none bg-slate-50">
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="版本">{version.version}</Descriptions.Item>
                      <Descriptions.Item label="创建人">{version.createdBy?.name}</Descriptions.Item>
                      <Descriptions.Item label="创建时间">{version.createdAt}</Descriptions.Item>
                      <Descriptions.Item label="文件格式">{version.fileFormat?.toUpperCase()}</Descriptions.Item>
                    </Descriptions>
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <p className="text-xs text-slate-500 mb-2">变更说明：</p>
                      <p className="text-sm text-slate-700">{version.changeDescription}</p>
                    </div>
                  </Card>
                )}

                <Card
                  title={
                    <div className="flex items-center gap-2">
                      <CommentOutlined />
                      <span>审阅标注</span>
                      <Tag color="blue" className="ml-auto">{annotations.length}</Tag>
                    </div>
                  }
                  className="border-none"
                  size="small"
                >
                  <List
                    dataSource={annotations}
                    size="small"
                    renderItem={(annotation: Annotation) => (
                      <List.Item className="px-0 py-3 border-b border-slate-100 last:border-0">
                        <div className="w-full">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Avatar size={20} className="bg-blue-500 text-xs">
                                {annotation.author?.name?.charAt(0)}
                              </Avatar>
                              <span className="text-xs font-medium">{annotation.author?.name}</span>
                              <Tag
                                color={annotation.status === 'resolved' ? 'green' : 'red'}
                                className="ml-1"
                                style={{ fontSize: '10px', padding: '0 4px' }}
                              >
                                {annotation.status === 'resolved' ? '已解决' : '待处理'}
                              </Tag>
                            </div>
                          </div>
                          <p className="text-xs text-slate-600 mb-2">{annotation.content}</p>
                          {annotation.replies && annotation.replies.length > 0 && (
                            <div className="ml-4 space-y-2 mt-2 pt-2 border-t border-slate-100">
                              {annotation.replies.map((reply: AnnotationReply) => (
                                <Comment
                                  key={reply.id}
                                  author={<span className="text-xs font-medium text-blue-600">{reply.author?.name}</span>}
                                  content={<p className="text-xs text-slate-600">{reply.content}</p>}
                                  datetime={<span className="text-xs text-slate-400">{reply.createdAt}</span>}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </List.Item>
                    )}
                  />
                  {annotations.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      暂无审阅标注
                    </div>
                  )}
                </Card>
              </div>
            </Col>
          </Row>
        </motion.div>

        <div className="mt-4 text-center text-xs text-slate-400">
          <LockOutlined className="mr-1" />
          您正在通过外部链接浏览图纸，本页面为只读模式。
        </div>
      </div>
    </div>
  );
};

export default ExternalViewer;
