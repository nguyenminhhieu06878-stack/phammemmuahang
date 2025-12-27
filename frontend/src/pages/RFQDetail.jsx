import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Table, Tag, Button, Spin, message } from 'antd';
import { getRFQ, selectQuotation } from '../services/api';
import dayjs from 'dayjs';

function RFQDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rfq, setRfq] = useState(null);

  useEffect(() => {
    loadRFQ();
  }, [id]);

  const loadRFQ = async () => {
    try {
      const { data } = await getRFQ(id);
      setRfq(data);
    } catch (error) {
      console.error('Load RFQ error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuotation = async (quotationId) => {
    try {
      await selectQuotation(quotationId);
      message.success('Chọn báo giá thành công');
      loadRFQ(); // Reload to see updated status
    } catch (error) {
      message.error(error.response?.data?.error || 'Có lỗi khi chọn báo giá');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!rfq) {
    return <Card>Không tìm thấy RFQ</Card>;
  }

  const columns = [
    {
      title: 'Nhà cung cấp',
      dataIndex: ['supplier', 'companyName'],
    },
    {
      title: 'Tổng giá trị',
      dataIndex: 'totalAmount',
      render: (amount) => `${amount.toLocaleString()} ₫`,
    },
    {
      title: 'Thời gian giao',
      dataIndex: 'deliveryTime',
      render: (days) => `${days} ngày`,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (status) => (
        <Tag color={status === 'selected' ? 'green' : status === 'rejected' ? 'red' : 'orange'}>
          {status === 'selected' ? 'Đã chọn' : status === 'rejected' ? 'Từ chối' : 'Chờ xử lý'}
        </Tag>
      ),
    },
    {
      title: 'Hành động',
      render: (_, record) => {
        if (record.status === 'selected') {
          return (
            <Button type="primary" size="small" onClick={() => navigate(`/po/new/${record.id}`)}>
              Tạo PO
            </Button>
          );
        }
        if (record.status === 'pending') {
          return (
            <Button type="primary" size="small" onClick={() => handleSelectQuotation(record.id)}>
              Chọn
            </Button>
          );
        }
        return null;
      },
    },
  ];

  return (
    <div>
      <Card
        title={`Chi tiết RFQ ${rfq.code}`}
        extra={<Button onClick={() => navigate('/rfq')}>Quay lại</Button>}
      >
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Mã RFQ">{rfq.code}</Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag color="blue">{rfq.status === 'sent' ? 'Đã gửi' : 'Đã đóng'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Tiêu đề" span={2}>{rfq.title}</Descriptions.Item>
          <Descriptions.Item label="Dự án">{rfq.request.project.name}</Descriptions.Item>
          <Descriptions.Item label="Hạn chót">
            {dayjs(rfq.deadline).format('DD/MM/YYYY')}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Danh sách báo giá" style={{ marginTop: 16 }}>
        <Table
          columns={columns}
          dataSource={rfq.quotations}
          rowKey="id"
          pagination={false}
        />
      </Card>
    </div>
  );
}

export default RFQDetail;
