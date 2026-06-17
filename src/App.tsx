import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import MainLayout from './components/Layout/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Drawings from './pages/Drawings';
import DrawingPreview from './pages/DrawingPreview';
import DrawingVersions from './pages/DrawingVersions';
import Approvals from './pages/Approvals';
import ECNs from './pages/ECNs';
import ExternalLinks from './pages/ExternalLinks';
import Users from './pages/Users';
import AccessLogs from './pages/AccessLogs';
import ExternalViewer from './pages/ExternalViewer';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App: React.FC = () => {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#3B82F6',
          colorInfo: '#3B82F6',
          colorSuccess: '#10B981',
          colorWarning: '#F59E0B',
          colorError: '#EF4444',
          borderRadius: 8,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/external/:token" element={<ExternalViewer />} />
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="projects" element={<Projects />} />
              <Route path="drawings" element={<Drawings />} />
              <Route path="drawings/:id/preview" element={<DrawingPreview />} />
              <Route path="drawings/:id/versions" element={<DrawingVersions />} />
              <Route path="approvals" element={<Approvals />} />
              <Route path="ecns" element={<ECNs />} />
              <Route path="external-links" element={<ExternalLinks />} />
              <Route path="settings/users" element={<Users />} />
              <Route path="audit/access-logs" element={<AccessLogs />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </QueryClientProvider>
    </ConfigProvider>
  );
};

export default App;
