import React, { useState, useRef, useEffect } from 'react';
import {
  Card,
  Button,
  Tag,
  Space,
  Select,
  Modal,
  Form,
  Input,
  List,
  Avatar,
  message,
  Divider,
  Popconfirm,
  Row,
  Col,
} from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  CommentOutlined,
  CheckCircleOutlined,
  HighlightOutlined,
  DeleteOutlined,
  EditOutlined,
  SendOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { drawingApi } from '../api/client';
import { useAuthStore } from '../store/useAuthStore';
import type { Drawing, DrawingVersion, Annotation, AnnotationReply } from '../../shared/index.js';

const { Option } = Select;
const { TextArea } = Input;

const DrawingPreview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentAnnotation, setCurrentAnnotation] = useState<any>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null);
  const [showAnnotationModal, setShowAnnotationModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [tempShape, setTempShape] = useState<any>(null);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);

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

  const { data: versionData } = useQuery({
    queryKey: ['version', selectedVersion],
    queryFn: async () => {
      const res = await drawingApi.getVersion(selectedVersion!);
      return res.data.data;
    },
    enabled: !!selectedVersion,
  });

  const { data: annotationsData } = useQuery({
    queryKey: ['annotations', selectedVersion],
    queryFn: async () => {
      const res = await drawingApi.getAnnotations(selectedVersion!);
      return res.data.data || [];
    },
    enabled: !!selectedVersion,
  });

  useEffect(() => {
    if (versions && versions.length > 0 && !selectedVersion) {
      const latest = versions.find((v: DrawingVersion) => v.id === drawing?.latestVersionId);
      setSelectedVersion(latest?.id || versions[0].id);
    }
  }, [versions, drawing, selectedVersion]);

  useEffect(() => {
    if (annotationsData) {
      setAnnotations(annotationsData);
    }
  }, [annotationsData]);

  const createAnnotationMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await drawingApi.createAnnotation(selectedVersion!, data);
      return res.data;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['annotations', selectedVersion] });
      message.success('标注添加成功');
      setShowAnnotationModal(false);
      form.resetFields();
      setTempShape(null);
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || '添加失败');
    },
  });

  const createReplyMutation = useMutation({
    mutationFn: async (data: { id: string; content: string }) => {
      const res = await drawingApi.createAnnotationReply(data.id, { content: data.content });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['annotations', selectedVersion] });
      message.success('回复成功');
      setShowReplyModal(false);
    },
  });

  const resolveAnnotationMutation = useMutation({
    mutationFn: async (annotationId: string) => {
      const res = await drawingApi.updateAnnotation(annotationId, { status: 'resolved' });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['annotations', selectedVersion] });
      message.success('标注已标记为已解决');
    },
  });

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    setDrawStart({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !drawStart) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    setTempShape({
      x: Math.min(drawStart.x, x),
      y: Math.min(drawStart.y, y),
      width: Math.abs(x - drawStart.x),
      height: Math.abs(y - drawStart.y),
    });
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !drawStart || !tempShape) return;
    if (tempShape.width < 10 || tempShape.height < 10) {
      setTempShape(null);
      setDrawStart(null);
      return;
    }
    setCurrentAnnotation({
      x: tempShape.x,
      y: tempShape.y,
      width: tempShape.width,
      height: tempShape.height,
    });
    setShowAnnotationModal(true);
    setIsDrawing(false);
    setDrawStart(null);
  };

  const handleSubmitAnnotation = async () => {
    try {
      const values = await form.validateFields();
      createAnnotationMutation.mutate({
        ...currentAnnotation,
        content: values.content,
        type: 'rectangle',
        color: '#EF4444',
      });
    } catch (e) {
      console.error('Validation failed:', e);
    }
  };

  const handleReply = async (annotationId: string, content: string) => {
    createReplyMutation.mutate({ id: annotationId, content });
  };

  const handleResolve = (annotationId: string) => {
    resolveAnnotationMutation.mutate(annotationId);
  };

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

  if (isLoading || !drawing) {
    return <div className="flex items-center justify-center h-96">加载中...</div>;
  }

  const currentVersion = versions?.find((v: DrawingVersion) => v.id === selectedVersion);

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
            <p className="text-slate-500 mt-1">{drawing.drawingNumber} · {drawing.discipline?.name}</p>
          </div>
        </div>
        <Space>
          <Select
            value={selectedVersion}
            style={{ width: 150 }}
            onChange={setSelectedVersion}
          >
            {versions?.map((v: DrawingVersion) => (
              <Option key={v.id} value={v.id}>
                {v.version} {v.id === drawing.latestVersionId ? '(最新)' : ''}
              </Option>
            ))}
          </Select>
          <Button
            icon={<ZoomOutOutlined />}
            onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
          />
          <span className="text-sm font-medium">{Math.round(zoom * 100)}%</span>
          <Button
            icon={<ZoomInOutlined />}
            onClick={() => setZoom(Math.min(3, zoom + 0.1))}
          />
          <Button
            type={isDrawing ? 'primary' : 'default'}
            icon={<HighlightOutlined />}
            onClick={() => {
              setIsDrawing(!isDrawing);
              setTempShape(null);
              setDrawStart(null);
            }}
          >
            {isDrawing ? '取消标注' : '添加标注'}
          </Button>
        </Space>
      </div>

      {currentVersion && (
        <Card className="rounded-xl border-none">
          <Row gutter={16}>
            <Col span={16}>
              <div
                ref={containerRef}
                className="relative bg-slate-100 rounded-lg overflow-auto"
                style={{ height: '70vh' }}
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
                        <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#E2E8F0" strokeWidth="0.5" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />

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
                        {currentVersion.version}
                      </text>
                    </svg>
                  </div>

                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 cursor-crosshair"
                    width={800}
                    height={1000}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={() => {
                      setTempShape(null);
                      setDrawStart(null);
                    }}
                  />

                  <svg className="absolute inset-0 pointer-events-none" width={800} height={1000}>
                    {tempShape && (
                      <rect
                        x={tempShape.x}
                        y={tempShape.y}
                        width={tempShape.width}
                        height={tempShape.height}
                        fill="rgba(239, 68, 68, 0.1)"
                        stroke="#EF4444"
                        strokeWidth="2"
                        strokeDasharray="5,3"
                      />
                    )}
                  </svg>

                  {annotations.map((annotation: Annotation) => (
                    <div
                      key={annotation.id}
                      className={`absolute cursor-pointer transition-all ${
                        selectedAnnotation?.id === annotation.id ? 'z-20' : 'z-10'
                      }`}
                      style={{
                        left: annotation.x,
                        top: annotation.y,
                        width: annotation.width,
                        height: annotation.height,
                      }}
                      onClick={() => setSelectedAnnotation(annotation)}
                    >
                      <div
                        className={`w-full h-full border-2 rounded pointer-events-none ${
                          annotation.status === 'resolved'
                            ? 'border-green-500 bg-green-500/10'
                            : 'border-red-500 bg-red-500/10'
                        } ${selectedAnnotation?.id === annotation.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                      />
                      <div
                        className={`absolute -top-6 -left-1 px-2 py-0.5 rounded text-xs font-medium text-white ${
                          annotation.status === 'resolved' ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      >
                        <CommentOutlined className="mr-1" />
                        {annotation.author || annotation.createdByUser?.name || '用户'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Col>

            <Col span={8}>
              <div className="space-y-4">
                <Card size="small" className="border-none bg-slate-50">
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">版本号</span>
                      <span className="font-medium">{currentVersion.version}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">创建人</span>
                      <span className="font-medium">{currentVersion.createdByUser?.name || currentVersion.createdBy || '用户'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">创建时间</span>
                      <span className="font-medium">{currentVersion.createdAt}</span>
                    </div>
                    <Divider className="my-2" />
                    <div>
                      <span className="text-slate-500">变更说明：</span>
                      <p className="text-slate-700 mt-1 text-sm">{currentVersion.changeDescription}</p>
                    </div>
                  </div>
                </Card>

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
                      <List.Item
                        key={annotation.id}
                        className={`px-3 py-3 rounded-lg mb-2 cursor-pointer transition-colors ${
                          selectedAnnotation?.id === annotation.id
                            ? 'bg-blue-50 border border-blue-200'
                            : 'hover:bg-slate-50'
                        }`}
                        onClick={() => setSelectedAnnotation(annotation)}
                      >
                        <div className="w-full">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Avatar size={24} className="bg-blue-500 text-xs">
                                {(annotation.author || annotation.createdByUser?.name || 'U').charAt(0)}
                              </Avatar>
                              <span className="text-sm font-medium">{annotation.author || annotation.createdByUser?.name || '用户'}</span>
                              <Tag
                                color={annotation.status === 'resolved' ? 'green' : 'red'}
                                className="ml-2"
                              >
                                {annotation.status === 'resolved' ? '已解决' : '待处理'}
                              </Tag>
                            </div>
                            <span className="text-xs text-slate-400">{annotation.createdAt}</span>
                          </div>
                          <p className="text-sm text-slate-700 mb-2">{annotation.content || annotation.comment}</p>
                          {annotation.replies && annotation.replies.length > 0 && (
                            <div className="ml-6 space-y-2 mt-2 pt-2 border-t border-slate-100">
                              {annotation.replies.map((reply: AnnotationReply) => (
                                <div key={reply.id} className="text-xs">
                                  <span className="font-medium text-blue-600">{reply.author || reply.createdByUser?.name || '用户'}：</span>
                                  <span className="text-slate-600">{reply.content}</span>
                                  <span className="text-slate-400 ml-2">{reply.createdAt}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-2 mt-2">
                            <Button
                              type="text"
                              size="small"
                              icon={<EditOutlined />}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAnnotation(annotation);
                                setShowReplyModal(true);
                              }}
                            >
                              回复
                            </Button>
                            {annotation.status !== 'resolved' && (
                              <Button
                                type="text"
                                size="small"
                                icon={<CheckCircleOutlined />}
                                className="text-green-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleResolve(annotation.id);
                                }}
                              >
                                标记解决
                              </Button>
                            )}
                          </div>
                        </div>
                      </List.Item>
                    )}
                  />
                </Card>
              </div>
            </Col>
          </Row>
        </Card>
      )}

      <Modal
        title="添加标注"
        open={showAnnotationModal}
        onOk={handleSubmitAnnotation}
        onCancel={() => {
          setShowAnnotationModal(false);
          setTempShape(null);
          form.resetFields();
        }}
        confirmLoading={createAnnotationMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="content"
            label="问题描述"
            rules={[{ required: true, message: '请输入问题描述' }]}
          >
            <TextArea rows={4} placeholder="请详细描述发现的问题..." />
          </Form.Item>
          <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-500">
            标注区域: X={Math.round(currentAnnotation?.x || 0)}, Y={Math.round(currentAnnotation?.y || 0)}, W={Math.round(currentAnnotation?.width || 0)}, H={Math.round(currentAnnotation?.height || 0)}
          </div>
        </Form>
      </Modal>

      <Modal
        title="回复标注"
        open={showReplyModal}
        onOk={async () => {
          try {
            const values = await form.validateFields();
            if (selectedAnnotation) {
              handleReply(selectedAnnotation.id, values.replyContent);
            }
          } catch (e) {
            console.error(e);
          }
        }}
        onCancel={() => {
          setShowReplyModal(false);
          form.resetFields();
        }}
        confirmLoading={createReplyMutation.isPending}
      >
        {selectedAnnotation && (
          <div className="mb-4 p-3 bg-slate-50 rounded-lg">
            <p className="text-sm font-medium">{selectedAnnotation.author || selectedAnnotation.createdByUser?.name || '用户'}：</p>
            <p className="text-sm text-slate-600">{selectedAnnotation.content || selectedAnnotation.comment}</p>
          </div>
        )}
        <Form form={form} layout="vertical">
          <Form.Item
            name="replyContent"
            label="回复内容"
            rules={[{ required: true, message: '请输入回复内容' }]}
          >
            <TextArea rows={3} placeholder="请输入回复内容..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DrawingPreview;
