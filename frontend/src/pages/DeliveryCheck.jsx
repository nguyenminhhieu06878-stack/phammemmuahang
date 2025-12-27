import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Input, InputNumber, Radio, Button, Upload, message, Table, Descriptions, Tag } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { getPOs, createDelivery } from '../services/api';

function DeliveryCheck() {
  const { poId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [po, setPo] = useState(null);
  const [actualQuantities, setActualQuantities] = useState({});

  useEffect(() => {
    loadPO();
  }, [poId]);

  const loadPO = async () => {
    try {
      const { data } = await getPOs();
      const found = data.find(p => p.id === parseInt(poId));
      setPo(found);
      
      // Initialize actual quantities with PO quantities
      const quantities = {};
      found.items.forEach(item => {
        quantities[item.material.id] = item.quantity;
      });
      setActualQuantities(quantities);
    } catch (error) {
      message.error('Không thể tải thông tin đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);
      await createDelivery({
        poId: parseInt(poId),
        deliveryDate: new Date(),
        receivedBy: values.receivedBy,
        actualQuantity: JSON.stringify(actualQuantities),
        qualityStatus: values.qualityStatus,
        note: values.note,
        photos: values.photos ? JSON.stringify(values.photos.fileList.map(f => f.response?.url || f.url)) : null,
      });
      message.success('Kiểm hàng thành công');
      navigate('/po');
    } catch (error) {
      message.error('Có lỗi xảy ra');
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

  const columns = [
    {
      title: 'Vật tư',
      dataIndex: ['material', 'name'],
    },
    {
      title: 'Đơn vị',
      dataIndex: ['material', 'unit'],
    },
    {
      title: 'Số lượng đặt',
      dataIndex: 'quantity',
    },
    {
      title: 'Số lượng thực tế',
      render: (_, record) => (
        <InputNumber
          min={0}
          value={actualQuantities[record.material.id]}
          onChange={(value) => {
            setActualQuantities({
              ...actualQuantities,
              [record.material.id]: value,
            });
          }}
        />
      ),
    },
    {
      title: 'Chênh lệch',
      render: (_, record) => {
        const diff = (actualQuantities[record.material.id] || 0) - record.quantity;
        return (
          <span style={{ color: diff === 0 ? 'green' : 'red' }}>
            {diff > 0 ? '+' : ''}{diff}
          </span>
        );
      },
    },
  ];

  return (
    <div>
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20 }}>🚚</span>
            <span>Kiểm nhận hàng từ nhà cung cấp - {po.code}</span>
          </div>
        }
      >
        <div style={{ 
          padding: 16, 
          background: '#e6f7ff', 
          border: '2px solid #1890ff', 
          borderRadius: 8,
          marginBottom: 24 
        }}>
          <div style={{ fontSize: 16, fontWeight: 'bold', color: '#1890ff', marginBottom: 12 }}>
            📋 Thông tin giao hàng
          </div>
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="🏢 Nguồn hàng">
              <Tag color="orange">Nhà cung cấp bên ngoài</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Mã PO">{po.code}</Descriptions.Item>
            <Descriptions.Item label="Nhà cung cấp">{po.supplier.companyName}</Descriptions.Item>
            <Descriptions.Item label="Dự án">{po.project.name}</Descriptions.Item>
            <Descriptions.Item label="Địa chỉ giao" span={2}>{po.deliveryAddress}</Descriptions.Item>
          </Descriptions>
        </div>

        <div style={{ 
          padding: 12, 
          background: '#fffbe6', 
          border: '2px solid #faad14', 
          borderRadius: 6,
          marginBottom: 24 
        }}>
          <div style={{ fontWeight: 'bold', color: '#fa8c16', marginBottom: 8 }}>
            ⚠️ Lưu ý khi kiểm hàng từ nhà cung cấp:
          </div>
          <ul style={{ margin: 0, paddingLeft: 20, color: '#666' }}>
            <li>Kiểm tra kỹ số lượng thực tế so với đơn hàng</li>
            <li>Đánh giá chất lượng hàng hóa (OK/Partial/NG)</li>
            <li>Chụp ảnh biên bản giao nhận làm bằng chứng</li>
            <li>Ghi chú rõ nếu có vấn đề về chất lượng hoặc số lượng</li>
          </ul>
        </div>

        <div style={{ 
          padding: 16, 
          background: 'white', 
          border: '1px solid #d9d9d9', 
          borderRadius: 8,
          marginBottom: 24 
        }}>
          <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 16 }}>
            📦 Kiểm tra số lượng hàng hóa
          </div>
          <Table
            columns={columns}
            dataSource={po.items}
            rowKey="id"
            pagination={false}
          />
        </div>

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div style={{ 
            padding: 16, 
            background: '#fafafa', 
            border: '1px solid #d9d9d9', 
            borderRadius: 8,
            marginBottom: 16 
          }}>
            <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 16 }}>
              ✍️ Thông tin xác nhận
            </div>
          <Form.Item
            name="receivedBy"
            label="Người nhận hàng"
            rules={[{ required: true, message: 'Vui lòng nhập tên người nhận' }]}
          >
            <Input placeholder="Nhập tên người nhận hàng" />
          </Form.Item>

          <Form.Item
            name="qualityStatus"
            label="Đánh giá chất lượng"
            rules={[{ required: true, message: 'Vui lòng chọn đánh giá' }]}
          >
            <Radio.Group>
              <Radio value="ok">OK - Đạt yêu cầu</Radio>
              <Radio value="partial">Một phần đạt yêu cầu</Radio>
              <Radio value="ng">NG - Không đạt</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item name="photos" label="Hình ảnh biên bản">
            <Upload
              listType="picture"
              maxCount={5}
              beforeUpload={() => false}
            >
              <Button icon={<UploadOutlined />}>Chụp/Tải ảnh</Button>
            </Upload>
          </Form.Item>

          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={4} placeholder="Nhập ghi chú về tình trạng hàng hóa, vấn đề phát sinh (nếu có)" />
          </Form.Item>
          </div>

          <Form.Item style={{ marginTop: 24 }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={submitting} 
              size="large"
              style={{ marginRight: 8 }}
            >
              ✅ Xác nhận kiểm hàng từ NCC
            </Button>
            <Button size="large" onClick={() => navigate('/po')}>Hủy</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default DeliveryCheck;
