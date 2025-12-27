import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Input, InputNumber, DatePicker, Button, Table, message, Spin } from 'antd';
import { getRFQ, createQuotation } from '../services/api';
import dayjs from 'dayjs';

function CreateQuotation() {
  const { rfqId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rfq, setRfq] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    loadRFQ();
  }, [rfqId]);

  const loadRFQ = async () => {
    try {
      const { data } = await getRFQ(rfqId);
      setRfq(data);
      
      // Initialize items with prices - USE RFQ ITEMS (already calculated with stock deduction)
      const initialItems = data.items.map(item => ({
        ...item,
        unitPrice: 0,
        amount: 0,
      }));
      setItems(initialItems);
      
      form.setFieldsValue({
        deliveryTime: 7,
        paymentTerms: 'Thanh toán sau 30 ngày kể từ ngày giao hàng',
        validUntil: dayjs().add(7, 'days'),
      });
    } catch (error) {
      message.error('Không thể tải thông tin RFQ');
      console.error('Load RFQ error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = (index, value) => {
    const newItems = [...items];
    newItems[index].unitPrice = value || 0;
    newItems[index].amount = (value || 0) * newItems[index].quantity;
    setItems(newItems);
  };

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);
      
      const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
      
      const data = {
        rfqId: parseInt(rfqId),
        deliveryTime: values.deliveryTime,
        paymentTerms: values.paymentTerms,
        validUntil: values.validUntil.toISOString(),
        note: values.note,
        totalAmount,
        items: items.map(item => ({
          materialId: item.materialId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
          note: item.note,
        })),
      };

      await createQuotation(data);
      message.success('Gửi báo giá thành công');
      navigate('/quotations');
    } catch (error) {
      message.error(error.response?.data?.error || 'Có lỗi khi gửi báo giá');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: 'Mã vật tư',
      dataIndex: ['material', 'code'],
    },
    {
      title: 'Tên vật tư',
      dataIndex: ['material', 'name'],
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      render: (qty, record) => `${qty} ${record.material.unit}`,
    },
    {
      title: 'Đơn giá (₫)',
      key: 'unitPrice',
      render: (_, record, index) => (
        <InputNumber
          style={{ width: '100%' }}
          min={0}
          value={record.unitPrice}
          onChange={(value) => handlePriceChange(index, value)}
          formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={value => value.replace(/\$\s?|(,*)/g, '')}
          placeholder="Nhập đơn giá"
        />
      ),
    },
    {
      title: 'Thành tiền (₫)',
      dataIndex: 'amount',
      render: (amount) => amount.toLocaleString(),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div>
      <Card title={`Tạo báo giá - ${rfq?.code}`}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Card title="Danh sách vật tư" style={{ marginBottom: 16 }}>
            <Table
              columns={columns}
              dataSource={items}
              rowKey="id"
              pagination={false}
              summary={() => (
                <Table.Summary>
                  <Table.Summary.Row>
                    <Table.Summary.Cell colSpan={4} align="right">
                      <strong>Tổng cộng:</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell>
                      <strong>{totalAmount.toLocaleString()} ₫</strong>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </Card>

          <Form.Item
            name="deliveryTime"
            label="Thời gian giao hàng (ngày)"
            rules={[{ required: true, message: 'Vui lòng nhập thời gian giao hàng' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              placeholder="VD: 7"
            />
          </Form.Item>

          <Form.Item
            name="paymentTerms"
            label="Điều khoản thanh toán"
            rules={[{ required: true, message: 'Vui lòng nhập điều khoản thanh toán' }]}
          >
            <Input.TextArea
              rows={2}
              placeholder="VD: Thanh toán sau 30 ngày kể từ ngày giao hàng"
            />
          </Form.Item>

          <Form.Item
            name="validUntil"
            label="Báo giá có hiệu lực đến"
            rules={[{ required: true, message: 'Vui lòng chọn ngày hết hạn' }]}
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item
            name="note"
            label="Ghi chú"
          >
            <Input.TextArea rows={3} placeholder="Ghi chú thêm (nếu có)" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting} size="large">
              Gửi báo giá
            </Button>
            <Button style={{ marginLeft: 8 }} onClick={() => navigate('/quotations')}>
              Hủy
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default CreateQuotation;
