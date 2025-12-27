import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Spin, Alert, Button, message } from 'antd';
import {
  ProjectOutlined,
  FileTextOutlined,
  FileDoneOutlined,
  DollarOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  getDashboardStats,
  getSpendingByProject,
  getSpendingByCategory,
  getTopSuppliers,
  getPOStatus,
} from '../services/api';
import { useAuthStore } from '../store/authStore';
import { hasPermission, getRoleLabel } from '../utils/permissions';
import { exportMultipleSheets, formatDashboardForExport } from '../utils/export';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [spendingByProject, setSpendingByProject] = useState([]);
  const [spendingByCategory, setSpendingByCategory] = useState([]);
  const [topSuppliers, setTopSuppliers] = useState([]);
  const [poStatus, setPoStatus] = useState([]);
  const [delayStats, setDelayStats] = useState({ totalDelayed: 0, approaching: 0 });
  const { user } = useAuthStore();
  
  const canViewFullDashboard = hasPermission(user?.role, 'VIEW_FULL_DASHBOARD');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, projectRes, categoryRes, suppliersRes, statusRes, posRes] = await Promise.all([
        getDashboardStats(),
        getSpendingByProject(),
        getSpendingByCategory(),
        getTopSuppliers(),
        getPOStatus(),
        import('../services/api').then(m => m.getPOs()),
      ]);

      setStats(statsRes.data);

      // Transform data for charts
      setSpendingByProject(
        Object.entries(projectRes.data).map(([name, value]) => ({ name, value }))
      );

      setSpendingByCategory(
        Object.entries(categoryRes.data).map(([name, value]) => ({ name, value }))
      );

      setTopSuppliers(suppliersRes.data);

      setPoStatus(
        Object.entries(statusRes.data).map(([name, value]) => ({ name, value }))
      );
      
      // Calculate delay stats
      const delayStatsData = import('../utils/alerts').then(m => m.getDelayStats(posRes.data));
      setDelayStats(await delayStatsData);
    } catch (error) {
      console.error('Load dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  const handleExport = () => {
    const sheets = formatDashboardForExport(stats, spendingByProject, spendingByCategory, topSuppliers);
    const success = exportMultipleSheets(
      sheets,
      `Bao-cao-tong-hop-${new Date().toISOString().split('T')[0]}.xlsx`
    );
    if (success) {
      message.success('Xuất báo cáo Excel thành công');
    } else {
      message.error('Có lỗi khi xuất báo cáo');
    }
  };

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Alert
            message={`Chào mừng, ${user?.name}!`}
            description={`Bạn đang đăng nhập với vai trò: ${getRoleLabel(user?.role)}`}
            type="info"
            showIcon
          />
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExport}
            size="large"
          >
            Xuất báo cáo Excel
          </Button>
        </Col>
      </Row>
      
      {(delayStats.totalDelayed > 0 || delayStats.approaching > 0) && (
        <Alert
          message="Cảnh báo giao hàng"
          description={
            <div>
              {delayStats.totalDelayed > 0 && <div>• <strong>{delayStats.totalDelayed}</strong> đơn hàng bị trễ hạn</div>}
              {delayStats.approaching > 0 && <div>• <strong>{delayStats.approaching}</strong> đơn hàng sắp đến hạn (trong 3 ngày)</div>}
            </div>
          }
          type="warning"
          showIcon
          closable
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Dự án đang chạy"
              value={stats.totalProjects}
              prefix={<ProjectOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Yêu cầu vật tư"
              value={stats.totalRequests}
              prefix={<FileTextOutlined />}
              suffix={`(${stats.pendingRequests} chờ duyệt)`}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Đơn đặt hàng"
              value={stats.totalPOs}
              prefix={<FileDoneOutlined />}
              suffix={`(${stats.pendingPOs} chờ duyệt)`}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng chi phí"
              value={stats.totalSpent}
              prefix={<DollarOutlined />}
              precision={0}
              suffix="₫"
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      {canViewFullDashboard && (
        <>
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} lg={12}>
              <Card title="Chi phí theo dự án" style={{ height: 400 }}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={spendingByProject}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${value.toLocaleString()} ₫`} />
                    <Legend />
                    <Bar dataKey="value" fill="#1890ff" name="Chi phí" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="Chi phí theo nhóm vật tư" style={{ height: 400 }}>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={spendingByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {spendingByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value.toLocaleString()} ₫`} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} lg={12}>
              <Card title="Top 5 nhà cung cấp" style={{ height: 400 }}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topSuppliers} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip formatter={(value) => `${value.toLocaleString()} ₫`} />
                    <Legend />
                    <Bar dataKey="totalAmount" fill="#52c41a" name="Tổng giá trị" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="Trạng thái đơn hàng" style={{ height: 400 }}>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={poStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {poStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
}

export default Dashboard;
