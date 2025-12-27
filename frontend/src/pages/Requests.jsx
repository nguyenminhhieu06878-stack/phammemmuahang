import { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Spin, Space, message } from 'antd';
import { PlusOutlined, DownloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getRequests } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { hasPermission } from '../utils/permissions';
import { exportToExcel, formatRequestsForExport } from '../utils/export';
import dayjs from 'dayjs';

const statusColors = {
  pending: 'orange',
  approved: 'green',
  rejected: 'red',
  processing: 'blue',
};

const statusLabels = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
  processing: 'Đang xử lý',
};

function Requests() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const canCreate = hasPermission(user?.role, 'CREATE_REQUEST');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const { data } = await getRequests();
      setRequests(data);
    } catch (error) {
      console.error('Load requests error:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Mã yêu cầu',
      dataIndex: 'code',
      key: 'code',
      render: (code, record) => (
        <a 
          onClick={() => navigate(`/requests/${record.id}`)}
          style={{ cursor: 'pointer', color: '#1890ff' }}
        >
          {code}
        </a>
      ),
    },
    {
      title: 'Dự án',
      dataIndex: ['project', 'name'],
      key: 'project',
    },
    {
      title: 'Người tạo',
      dataIndex: ['createdBy', 'name'],
      key: 'createdBy',
    },
    {
      title: 'Số lượng vật tư',
      dataIndex: 'items',
      key: 'items',
      render: (items) => items.length,
    },
    {
      title: 'Ưu tiên',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => (
        <Tag color={priority === 'urgent' ? 'red' : priority === 'high' ? 'orange' : 'default'}>
          {priority === 'urgent' ? 'Khẩn cấp' : priority === 'high' ? 'Cao' : 'Bình thường'}
        </Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  const handleExport = () => {
    const formattedData = formatRequestsForExport(requests);
    const success = exportToExcel(
      formattedData,
      `Yeu-cau-vat-tu-${new Date().toISOString().split('T')[0]}.xlsx`,
      'Yêu cầu vật tư'
    );
    if (success) {
      message.success('Xuất Excel thành công');
    } else {
      message.error('Có lỗi khi xuất Excel');
    }
  };

  return (
    <Card
      title="Danh sách yêu cầu vật tư"
      extra={
        <Space>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExport}
          >
            Xuất Excel
          </Button>
          {canCreate && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/requests/new')}
            >
              Tạo yêu cầu mới
            </Button>
          )}
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={requests}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        onRow={(record) => ({
          onClick: () => navigate(`/requests/${record.id}`),
          style: { cursor: 'pointer' }
        })}
      />
    </Card>
  );
}

export default Requests;
