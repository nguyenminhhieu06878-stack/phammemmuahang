import { useEffect, useState } from 'react';
import { Card, Table, Tag, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { getStockIssues } from '../services/api';
import dayjs from 'dayjs';

function StockIssues() {
  const [loading, setLoading] = useState(true);
  const [issues, setIssues] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadIssues();
  }, []);

  const loadIssues = async () => {
    try {
      const { data } = await getStockIssues();
      setIssues(data);
    } catch (error) {
      console.error('Load stock issues error:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Mã phiếu',
      dataIndex: 'code',
      render: (code, record) => (
        <a 
          onClick={() => navigate(`/requests/${record.requestId}`)}
          style={{ cursor: 'pointer', color: '#1890ff' }}
        >
          {code}
        </a>
      ),
    },
    {
      title: 'Yêu cầu',
      dataIndex: ['request', 'code'],
      render: (code, record) => (
        <a 
          onClick={() => navigate(`/requests/${record.requestId}`)}
          style={{ cursor: 'pointer' }}
        >
          {code}
        </a>
      ),
    },
    {
      title: 'Dự án',
      dataIndex: ['request', 'project', 'name'],
    },
    {
      title: 'Người xuất',
      dataIndex: ['issuer', 'name'],
    },
    {
      title: 'Ngày xuất',
      dataIndex: 'issuedAt',
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY HH:mm') : '-',
    },
    {
      title: 'Người nhận',
      dataIndex: ['receiver', 'name'],
      render: (name) => name || '-',
    },
    {
      title: 'Ngày nhận',
      dataIndex: 'receivedAt',
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY HH:mm') : '-',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (status) => {
        const config = {
          pending: { color: 'orange', text: 'Đang vận chuyển' },
          completed: { color: 'green', text: 'Đã nhận hàng' },
          cancelled: { color: 'red', text: 'Đã hủy' },
        };
        const { color, text } = config[status] || { color: 'default', text: status };
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: 'Số lượng VT',
      dataIndex: 'items',
      render: (items) => items?.length || 0,
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
    <Card title="Lịch sử xuất kho nội bộ">
      <Table
        columns={columns}
        dataSource={issues}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        onRow={(record) => ({
          onClick: () => navigate(`/requests/${record.requestId}`),
          style: { cursor: 'pointer' }
        })}
      />
    </Card>
  );
}

export default StockIssues;
