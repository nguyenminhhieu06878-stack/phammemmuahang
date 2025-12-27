import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Rate, Input, Button, message, Descriptions, Divider } from 'antd';
import { StarOutlined } from '@ant-design/icons';
import { getPOs, createEvaluation } from '../services/api';

function SupplierEvaluation() {
  const { poId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [po, setPo] = useState(null);

  useEffect(() => {
    loadPO();
  }, [poId]);

  const loadPO = async () => {
    try {
      const { data } = await getPOs();
      const found = data.find(p => p.id === parseInt(poId));
      setPo(found);
    } catch (error) {
      message.error('Không thể tải thông tin đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);
      const avgScore = (values.priceScore + values.qualityScore + values.deliveryScore + values.supportScore) / 4;
      
      await createEvaluation({
        supplierId: po.supplier.id,
        poId: parseInt(poId),
        priceScore: values.priceScore,
        qualityScore: values.qualityScore,
        deliveryScore: values.deliveryScore,
        supportScore: values.supportScore,
        avgScore,
        comment: values.comment,
      });

      message.success('Đánh giá nhà cung cấp thành công');
      navigate('/po');
    } catch (error) {
      message.error('Có lỗi xảy ra khi đánh giá');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Card loading />;
  }

  if (!po) {
    return <Card>Không tìm thấy đơn hàng</Card>;
  }

  return (
    <div>
      <Card title={`Đánh giá nhà cung cấp - ${po.code}`}>
        <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
          <Descriptions.Item label="Mã PO">{po.code}</Descriptions.Item>
          <Descriptions.Item label="Nhà cung cấp">{po.supplier.companyName}</Descriptions.Item>
          <Descriptions.Item label="Dự án">{po.project.name}</Descriptions.Item>
          <Descriptions.Item label="Tổng giá trị">{po.grandTotal.toLocaleString('vi-VN')} ₫</Descriptions.Item>
        </Descriptions>

        <Divider>Đánh giá chi tiết</Divider>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            priceScore: 5,
            qualityScore: 5,
            deliveryScore: 5,
            supportScore: 5,
          }}
        >
          <Form.Item
            name="priceScore"
            label={
              <span>
                <StarOutlined style={{ color: '#faad14', marginRight: 8 }} />
                Giá cả (Cạnh tranh, hợp lý)
              </span>
            }
            rules={[{ required: true, message: 'Vui lòng đánh giá' }]}
          >
            <Rate style={{ fontSize: 32 }} />
          </Form.Item>

          <Form.Item
            name="qualityScore"
            label={
              <span>
                <StarOutlined style={{ color: '#faad14', marginRight: 8 }} />
                Chất lượng (Đúng quy cách, không lỗi)
              </span>
            }
            rules={[{ required: true, message: 'Vui lòng đánh giá' }]}
          >
            <Rate style={{ fontSize: 32 }} />
          </Form.Item>

          <Form.Item
            name="deliveryScore"
            label={
              <span>
                <StarOutlined style={{ color: '#faad14', marginRight: 8 }} />
                Đúng hẹn (Giao hàng đúng thời gian)
              </span>
            }
            rules={[{ required: true, message: 'Vui lòng đánh giá' }]}
          >
            <Rate style={{ fontSize: 32 }} />
          </Form.Item>

          <Form.Item
            name="supportScore"
            label={
              <span>
                <StarOutlined style={{ color: '#faad14', marginRight: 8 }} />
                Hỗ trợ (Phản hồi nhanh, nhiệt tình)
              </span>
            }
            rules={[{ required: true, message: 'Vui lòng đánh giá' }]}
          >
            <Rate style={{ fontSize: 32 }} />
          </Form.Item>

          <Form.Item
            name="comment"
            label="Nhận xét chi tiết"
          >
            <Input.TextArea
              rows={4}
              placeholder="Nhập nhận xét về nhà cung cấp (không bắt buộc)"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              size="large"
              style={{ marginRight: 8 }}
            >
              Gửi đánh giá
            </Button>
            <Button size="large" onClick={() => navigate('/po')}>
              Hủy
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default SupplierEvaluation;
