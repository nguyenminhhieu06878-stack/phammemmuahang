import { useEffect, useState } from 'react';
import { Card, Table, Tag, Spin, Button, Space, message, Alert, Row, Col, Statistic } from 'antd';
import { CheckCircleOutlined, StarOutlined, DownloadOutlined, WarningOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getPOs } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { hasPermission } from '../utils/permissions';
import { exportToExcel, formatPOsForExport } from '../utils/export';
import { isPODelayed, getDelayDays, getDelaySeverity, getDelayColor, getDelayMessage, isApproachingDeadline, getDaysUntilDelivery, getDelayStats } from '../utils/alerts';
import dayjs from 'dayjs';

const statusColors = {
  pending: 'orange',
  approved: 'green',
  sent: 'blue',
  in_transit: 'cyan',
  delivered: 'purple',
  completed: 'green',
  cancelled: 'red',
};

const statusLabels = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  sent: 'Đã gửi',
  in_transit: 'Đang giao',
  delivered: 'Đã giao',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

function POList() {
  const [loading, setLoading] = useState(true);
  const [pos, setPos] = useState([]);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const canCheckDelivery = hasPermission(user?.role, 'CHECK_DELIVERY');

  useEffect(() => {
    loadPOs();
  }, []);

  const loadPOs = async () => {
    try {
      const { data } = await getPOs();
      setPos(data);
    } catch (error) {
      console.error('Load POs error:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Mã PO',
      dataIndex: 'code',
      render: (code, record) => (
        <a onClick={() => navigate(`/po/${record.id}`)}>{code}</a>
      ),
    },
    {
      title: 'Dự án',
      dataIndex: ['project', 'name'],
    },
    {
      title: 'Nhà cung cấp',
      dataIndex: ['supplier', 'companyName'],
    },
    {
      title: 'Tổng giá trị',
      dataIndex: 'grandTotal',
      render: (amount) => `${amount.toLocaleString()} ₫`,
    },
    {
      title: 'Ngày giao dự kiến',
      dataIndex: 'deliveryDate',
      render: (date, record) => {
        const isDelayed = isPODelayed(record);
        const isApproaching = isApproachingDeadline(record);
        
        if (isDelayed) {
          const delayDays = getDelayDays(record);
          const severity = getDelaySeverity(delayDays);
          const color = getDelayColor(severity);
          
          return (
            <div>
              <div>{dayjs(date).format('DD/MM/YYYY')}</div>
              <Tag color={color} icon={<WarningOutlined />}>
                {getDelayMessage(delayDays)}
              </Tag>
            </div>
          );
        }
        
        if (isApproaching) {
          const daysLeft = getDaysUntilDelivery(record);
          return (
            <div>
              <div>{dayjs(date).format('DD/MM/YYYY')}</div>
              <Tag color="orange" icon={<ClockCircleOutlined />}>
                Còn {daysLeft} ngày
              </Tag>
            </div>
          );
        }
        
        return dayjs(date).format('DD/MM/YYYY');
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (status) => (
        <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
    },
  ];

  // Add action column if user has permissions
  if (canCheckDelivery || user?.role === 'truong_phong_mh' || user?.role === 'admin') {
    columns.push({
      title: 'Hành động',
      width: 150,
      render: (_, record) => {
        if ((record.status === 'sent' || record.status === 'in_transit') && canCheckDelivery) {
          return (
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => navigate(`/po/${record.id}/delivery`)}
            >
              Kiểm hàng
            </Button>
          );
        }
        if (record.status === 'completed') {
          return (
            <Button
              type="default"
              size="small"
              icon={<StarOutlined />}
              onClick={() => navigate(`/po/${record.id}/evaluate`)}
            >
              Đánh giá
            </Button>
          );
        }
        return null;
      },
    });
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  const handleExport = () => {
    const formattedData = formatPOsForExport(pos);
    const success = exportToExcel(
      formattedData,
      `Don-dat-hang-${new Date().toISOString().split('T')[0]}.xlsx`,
      'Đơn đặt hàng'
    );
    if (success) {
      message.success('Xuất Excel thành công');
    } else {
      message.error('Có lỗi khi xuất Excel');
    }
  };

  const delayStats = getDelayStats(pos);

  return (
    <div>
      {(delayStats.totalDelayed > 0 || delayStats.approaching > 0) && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          {delayStats.totalDelayed > 0 && (
            <Col xs={24} sm={12}>
              <Alert
                message="Cảnh báo đơn hàng trễ"
                description={
                  <div>
                    <div>Có <strong>{delayStats.totalDelayed}</strong> đơn hàng bị trễ hạn giao</div>
                    {delayStats.critical > 0 && <div style={{ color: '#f5222d' }}>• Trễ trên 7 ngày: {delayStats.critical} đơn</div>}
                    {delayStats.error > 0 && <div style={{ color: '#fa8c16' }}>• Trễ 4-7 ngày: {delayStats.error} đơn</div>}
                    {delayStats.warning > 0 && <div style={{ color: '#faad14' }}>• Trễ 1-3 ngày: {delayStats.warning} đơn</div>}
                  </div>
                }
                type="error"
                showIcon
                icon={<WarningOutlined />}
              />
            </Col>
          )}
          {delayStats.approaching > 0 && (
            <Col xs={24} sm={12}>
              <Alert
                message="Sắp đến hạn giao"
                description={`Có ${delayStats.approaching} đơn hàng sắp đến hạn giao (trong 3 ngày tới)`}
                type="warning"
                showIcon
                icon={<ClockCircleOutlined />}
              />
            </Col>
          )}
        </Row>
      )}
      
      <Card 
        title="Danh sách đơn đặt hàng (PO)"
        extra={
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExport}
          >
            Xuất Excel
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={pos}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}

export default POList;
