import { useEffect, useState } from 'react';
import { Card, Table, Tag, Spin, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getQuotations, getRFQs } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { hasPermission } from '../utils/permissions';
import dayjs from 'dayjs';

function QuotationList() {
  const [loading, setLoading] = useState(true);
  const [quotations, setQuotations] = useState([]);
  const [rfqs, setRfqs] = useState([]);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const isSupplier = user?.role === 'ncc';
  const canCreate = hasPermission(user?.role, 'CREATE_QUOTATION');

  useEffect(() => {
    loadQuotations();
  }, []);

  const loadQuotations = async () => {
    try {
      const { data } = await getQuotations();
      
      // Filter quotations for supplier
      const filteredQuotations = isSupplier 
        ? data.filter(q => q.supplier.userId === user.id)
        : data;
      
      setQuotations(filteredQuotations);
      
      // If supplier, also load available RFQs
      if (isSupplier) {
        const rfqRes = await getRFQs();
        setRfqs(rfqRes.data.filter(rfq => rfq.status === 'sent'));
      }
    } catch (error) {
      console.error('Load quotations error:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Mã báo giá',
      dataIndex: 'code',
    },
    {
      title: 'RFQ',
      dataIndex: ['rfq', 'code'],
    },
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
      title: 'Ngày gửi',
      dataIndex: 'submittedAt',
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
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
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      {isSupplier && rfqs.length > 0 && (
        <Card title="Yêu cầu báo giá mới" style={{ marginBottom: 16 }}>
          <Table
            columns={[
              {
                title: 'Mã RFQ',
                dataIndex: 'code',
              },
              {
                title: 'Tiêu đề',
                dataIndex: 'title',
              },
              {
                title: 'Hạn chót',
                dataIndex: 'deadline',
                render: (date) => dayjs(date).format('DD/MM/YYYY'),
              },
              {
                title: 'Hành động',
                render: (_, record) => {
                  const hasQuoted = quotations.some(q => 
                    q.rfq.id === record.id && q.supplier.userId === user.id
                  );
                  return hasQuoted ? (
                    <Tag color="green">Đã gửi báo giá</Tag>
                  ) : (
                    <Button
                      type="primary"
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => navigate(`/quotations/new/${record.id}`)}
                    >
                      Gửi báo giá
                    </Button>
                  );
                },
              },
            ]}
            dataSource={rfqs}
            rowKey="id"
            pagination={false}
          />
        </Card>
      )}
      
      <Card title="Danh sách báo giá">
        <Table
          columns={columns}
          dataSource={quotations}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}

export default QuotationList;
