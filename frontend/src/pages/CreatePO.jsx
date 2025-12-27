import { useState, useEffect } from 'react';
import { Card, Form, Input, DatePicker, Button, message, Descriptions } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuotations, createPO } from '../services/api';
import dayjs from 'dayjs';

function CreatePO() {
  const { quotationId } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [quotation, setQuotation] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadQuotation();
  }, [quotationId]);

  const loadQuotation = async () => {
    try {
      const { data } = await getQuotations();
      const found = data.find(q => q.id === parseInt(quotationId));
      setQuotation(found);
    } catch (error) {
      console.error('Load quotation error:', error);
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await createPO({
        quotationId: parseInt(quotationId),
        deliveryAddress: values.deliveryAddress,
        deliveryDate: values.deliveryDate.toISOString(),
        note: values.note,
      });
      message.success('Tạo đơn hàng thành công!');
      navigate('/po');
    } catch (error) {
      message.error('Tạo đơn hàng thất bại!');
    } finally {
      setLoading(false);
    }
  };

  if (!quotation) {
    return <Card>Đang tải...</Card>;
  }

  return (
    <div>
      <Card title="Thông tin báo giá" style={{ marginBottom: 16 }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Nhà cung cấp">{quotation.supplier.companyName}</Descriptions.Item>
          <Descriptions.Item label="Tổng giá trị">{quotation.totalAmount.toLocaleString()} ₫</Descriptions.Item>
          <Descriptions.Item label="Thời gian giao">{quotation.deliveryTime} ngày</Descriptions.Item>
          <Descriptions.Item label="Điều kiện thanh toán">{quotation.paymentTerms}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Tạo đơn đặt hàng (PO)">
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="deliveryAddress"
            label="Địa chỉ giao hàng"
            rules={[{ required: true, message: 'Vui lòng nhập địa chỉ!' }]}
          >
            <Input.TextArea rows={2} placeholder="Nhập địa chỉ giao hàng" />
          </Form.Item>

          <Form.Item
            name="deliveryDate"
            label="Ngày giao dự kiến"
            rules={[{ required: true, message: 'Vui lòng chọn ngày giao!' }]}
            initialValue={dayjs().add(quotation.deliveryTime, 'day')}
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={3} placeholder="Ghi chú" />
          </Form.Item>

          <div style={{ textAlign: 'right' }}>
            <Button onClick={() => navigate('/po')} style={{ marginRight: 8 }}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Tạo đơn hàng
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}

export default CreatePO;
