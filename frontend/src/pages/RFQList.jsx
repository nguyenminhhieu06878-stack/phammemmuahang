import { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Spin } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getRFQs } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { hasPermission } from '../utils/permissions';
import dayjs from 'dayjs';

function RFQList() {
  const [loading, setLoading] = useState(true);
  const [rfqs, setRfqs] = useState([]);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const canCreate = hasPermission(user?.role, 'CREATE_RFQ');

  useEffect(() => {
    loadRFQs();
  }, []);

  const loadRFQs = async () => {
    try {
      const { data } = await getRFQs();
      setRfqs(data);
    } catch (error) {
      console.error('Load RFQs error:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Mã RFQ',
      dataIndex: 'code',
      render: (code, record) => (
        <a 
          onClick={() => navigate(`/rfq/${record.id}`)}
          style={{ cursor: 'pointer', color: '#1890ff' }}
        >
          {code}
        </a>
      ),
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
    },
    {
      title: 'Dự án',
      dataIndex: ['request', 'project', 'name'],
    },
    {
      title: 'Số báo giá',
      dataIndex: 'quotations',
      render: (quotations) => quotations.length,
    },
    {
      title: 'Hạn chót',
      dataIndex: 'deadline',
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (status) => (
        <Tag color={status === 'sent' ? 'blue' : 'default'}>
          {status === 'sent' ? 'Đã gửi' : 'Đã đóng'}
        </Tag>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Card
      title="Danh sách yêu cầu báo giá (RFQ)"
      extra={
        canCreate && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/rfq/new')}
          >
            Tạo RFQ mới
          </Button>
        )
      }
    >
      <Table
        columns={columns}
        dataSource={rfqs}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        onRow={(record) => ({
          onClick: () => navigate(`/rfq/${record.id}`),
          style: { cursor: 'pointer' }
        })}
      />
    </Card>
  );
}

export default RFQList;
