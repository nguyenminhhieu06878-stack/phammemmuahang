import { useState, useEffect } from 'react';
import { Card, Form, Select, Input, DatePicker, Button, message, Alert, Table } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getRequests, getSuppliers, createRFQ, checkStockForRFQ } from '../services/api';
import dayjs from 'dayjs';

function CreateRFQ() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [stockAnalysis, setStockAnalysis] = useState(null);
  const [checkingStock, setCheckingStock] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    loadData();
    const requestId = searchParams.get('requestId');
    if (requestId) {
      form.setFieldsValue({ requestId: parseInt(requestId) });
    }
  }, []);

  const loadData = async () => {
    try {
      const [requestsRes, suppliersRes] = await Promise.all([
        getRequests(),
        getSuppliers(),
      ]);
      setRequests(requestsRes.data.filter(r => r.status === 'approved' && !r.rfq));
      setSuppliers(suppliersRes.data);
    } catch (error) {
      console.error('Load data error:', error);
    }
  };

  const handleRequestChange = async (requestId) => {
    if (!requestId) {
      setStockAnalysis(null);
      return;
    }

    setCheckingStock(true);
    try {
      const { data } = await checkStockForRFQ({ requestId });
      setStockAnalysis(data);
      
      if (data.summary.allCanFulfill) {
        message.warning('Tất cả vật tư đều đủ trong kho. Nên xuất kho nội bộ thay vì tạo RFQ.');
      }
    } catch (error) {
      console.error('Check stock error:', error);
      message.error('Không thể kiểm tra tồn kho');
    } finally {
      setCheckingStock(false);
    }
  };

  const onFinish = async (values) => {
    // Validate minimum 2 suppliers
    if (!values.supplierIds || values.supplierIds.length < 2) {
      message.error('Vui lòng chọn ít nhất 2 nhà cung cấp để so sánh báo giá!');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...values,
        deadline: values.deadline.toISOString(),
      };
      console.log('Creating RFQ with payload:', payload);
      
      const response = await createRFQ(payload);
      console.log('RFQ created successfully:', response.data);
      
      message.success(`Tạo RFQ và gửi email cho ${values.supplierIds.length} nhà cung cấp thành công!`);
      navigate('/rfq');
    } catch (error) {
      console.error('Create RFQ error:', error);
      console.error('Error response:', error.response?.data);
      message.error(error.response?.data?.error || 'Tạo RFQ thất bại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Tạo yêu cầu báo giá (RFQ)">
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          name="requestId"
          label="Yêu cầu vật tư"
          rules={[{ required: true, message: 'Vui lòng chọn yêu cầu!' }]}
        >
          <Select 
            placeholder="Chọn yêu cầu vật tư đã duyệt"
            onChange={handleRequestChange}
            loading={checkingStock}
          >
            {requests.map(r => (
              <Select.Option key={r.id} value={r.id}>
                {r.code} - {r.project.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {stockAnalysis && (
          <Alert
            message="📦 Phân tích tồn kho"
            description={
              <div>
                <Table
                  size="small"
                  columns={[
                    { title: 'Vật tư', dataIndex: 'materialName', width: '30%' },
                    { title: 'Yêu cầu', dataIndex: 'requested', render: (val, record) => `${val} ${record.unit}` },
                    { title: 'Tồn kho', dataIndex: 'stock', render: (val, record) => `${val} ${record.unit}` },
                    { 
                      title: 'Cần mua', 
                      dataIndex: 'needPurchase', 
                      render: (val, record) => (
                        <span style={{ color: val > 0 ? '#fa8c16' : '#52c41a', fontWeight: 'bold' }}>
                          {val > 0 ? `${val} ${record.unit}` : '✓ Đủ'}
                        </span>
                      )
                    },
                  ]}
                  dataSource={stockAnalysis.items}
                  pagination={false}
                  rowKey="materialId"
                  style={{ marginTop: 12 }}
                />
                <div style={{ marginTop: 12, padding: 8, background: stockAnalysis.summary.allCanFulfill ? '#f6ffed' : '#fff7e6', borderRadius: 4 }}>
                  {stockAnalysis.summary.allCanFulfill ? (
                    <span style={{ color: '#52c41a' }}>
                      ✓ Tất cả vật tư đều đủ trong kho. Nên xuất kho nội bộ thay vì tạo RFQ.
                    </span>
                  ) : (
                    <span style={{ color: '#fa8c16' }}>
                      ⚠️ RFQ sẽ chỉ gửi yêu cầu cho <strong>{stockAnalysis.summary.totalNeedPurchase}</strong> đơn vị vật tư thiếu (đã trừ tồn kho).
                    </span>
                  )}
                </div>
              </div>
            }
            type={stockAnalysis.summary.allCanFulfill ? 'success' : 'warning'}
            style={{ marginBottom: 16 }}
          />
        )}

        <Form.Item
          name="supplierIds"
          label="Nhà cung cấp"
          rules={[
            { required: true, message: 'Vui lòng chọn nhà cung cấp!' },
            {
              validator: (_, value) => {
                if (!value || value.length < 2) {
                  return Promise.reject('Vui lòng chọn ít nhất 2 nhà cung cấp để so sánh báo giá!');
                }
                return Promise.resolve();
              },
            },
          ]}
          extra="Chọn tối thiểu 2 nhà cung cấp để đảm bảo tính cạnh tranh"
        >
          <Select mode="multiple" placeholder="Chọn ít nhất 2 nhà cung cấp">
            {suppliers.map(s => (
              <Select.Option key={s.id} value={s.id}>
                {s.companyName} - Rating: {s.rating.toFixed(1)}⭐
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="deadline"
          label="Hạn chót"
          rules={[{ required: true, message: 'Vui lòng chọn hạn chót!' }]}
          initialValue={dayjs().add(7, 'day')}
        >
          <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
        </Form.Item>

        <Form.Item name="description" label="Mô tả">
          <Input.TextArea rows={3} placeholder="Mô tả yêu cầu báo giá" />
        </Form.Item>

        <div style={{ textAlign: 'right' }}>
          <Button onClick={() => navigate('/rfq')} style={{ marginRight: 8 }}>
            Hủy
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            Tạo và gửi RFQ
          </Button>
        </div>
      </Form>
    </Card>
  );
}

export default CreateRFQ;
