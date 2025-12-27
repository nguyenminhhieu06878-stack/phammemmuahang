import { useState, useEffect } from 'react';
import { Card, Form, Select, Input, Button, Table, InputNumber, message, Alert, Modal } from 'antd';
import { PlusOutlined, DeleteOutlined, WarningOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getProjects, getMaterials, createRequest, checkQuota, getRequests, getQuotasByProject } from '../services/api';
import { useAuthStore } from '../store/authStore';

function CreateRequest() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [items, setItems] = useState([]);
  const [quotaViolations, setQuotaViolations] = useState([]);
  const [projectQuotas, setProjectQuotas] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [projectsRes, materialsRes] = await Promise.all([
        getProjects(),
        getMaterials(),
      ]);
      setProjects(projectsRes.data);
      setMaterials(materialsRes.data);
    } catch (error) {
      console.error('Load data error:', error);
    }
  };

  const loadProjectQuotas = async (projectId) => {
    try {
      const { data } = await getQuotasByProject(projectId);
      setProjectQuotas(data);
    } catch (error) {
      console.error('Load quotas error:', error);
      setProjectQuotas([]);
    }
  };

  const handleProjectChange = (projectId) => {
    setSelectedProjectId(projectId);
    loadProjectQuotas(projectId);
  };

  const addItem = () => {
    setItems([...items, { id: Date.now(), materialId: null, quantity: 1, note: '' }]);
  };

  const removeItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id, field, value) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const onFinish = async (values) => {
    if (items.length === 0) {
      message.error('Vui lòng thêm ít nhất 1 vật tư!');
      return;
    }

    // Check for duplicate requests
    try {
      const { data: existingRequests } = await getRequests();
      const duplicates = existingRequests.filter(req => 
        req.projectId === values.projectId &&
        req.status !== 'rejected' &&
        req.status !== 'completed' &&
        req.items.some(item => items.some(i => i.materialId === item.materialId))
      );

      if (duplicates.length > 0) {
        const duplicateMaterials = [];
        duplicates.forEach(req => {
          req.items.forEach(item => {
            if (items.some(i => i.materialId === item.materialId)) {
              duplicateMaterials.push({
                code: req.code,
                material: item.material.name,
                quantity: item.quantity,
                status: req.status,
              });
            }
          });
        });

        Modal.warning({
          title: 'Phát hiện yêu cầu tương tự',
          content: (
            <div>
              <p>Đã có yêu cầu đang xử lý cho các vật tư sau:</p>
              <ul>
                {duplicateMaterials.map((d, idx) => (
                  <li key={idx}>
                    <strong>{d.material}</strong> - {d.quantity} (Mã: {d.code}, Trạng thái: {d.status})
                  </li>
                ))}
              </ul>
              <p>Bạn có chắc chắn muốn tạo yêu cầu mới?</p>
            </div>
          ),
          okText: 'Tiếp tục tạo',
          onOk: () => proceedWithChecks(values),
        });
        return;
      }
    } catch (error) {
      console.error('Check duplicates error:', error);
    }

    await proceedWithChecks(values);
  };

  const proceedWithChecks = async (values) => {
    // Check quota if user is giam_sat
    if (user?.role === 'giam_sat') {
      try {
        const { data } = await checkQuota({
          projectId: values.projectId,
          items: items.map(({ id, ...item }) => item),
        });

        if (data.hasViolations) {
          setQuotaViolations(data.violations);
          
          Modal.confirm({
            title: 'Vượt định mức vật tư',
            icon: <WarningOutlined style={{ color: '#ff4d4f' }} />,
            content: (
              <div>
                <p>Yêu cầu của bạn vượt định mức cho các vật tư sau:</p>
                <ul>
                  {data.violations.map((v, idx) => (
                    <li key={idx}>
                      <strong>{v.materialName}</strong>: Vượt {v.exceeded} {v.materialUnit}
                      <br />
                      <small>
                        (Yêu cầu: {v.requestedQuantity} {v.materialUnit}, 
                        Tổng: {v.totalRequested} {v.materialUnit}, 
                        Định mức: {v.maxQuantity} {v.materialUnit})
                      </small>
                    </li>
                  ))}
                </ul>
                <p style={{ marginTop: 12, color: '#ff4d4f' }}>
                  <strong>Yêu cầu này sẽ cần phê duyệt đặc biệt từ Giám đốc.</strong>
                </p>
                <p>Bạn có muốn tiếp tục tạo yêu cầu không?</p>
              </div>
            ),
            okText: 'Tiếp tục tạo',
            cancelText: 'Hủy',
            onOk: () => submitRequest(values),
          });
          return;
        }
      } catch (error) {
        console.error('Check quota error:', error);
      }
    }

    // If no violations or not giam_sat, proceed normally
    await submitRequest(values);
  };

  const submitRequest = async (values) => {
    setLoading(true);
    try {
      await createRequest({
        ...values,
        items: items.map(({ id, ...item }) => item),
      });
      message.success('Tạo yêu cầu thành công!');
      navigate('/requests');
    } catch (error) {
      message.error('Tạo yêu cầu thất bại!');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Vật tư',
      dataIndex: 'materialId',
      render: (value, record) => {
        const selectedMaterial = materials.find(m => m.id === value);
        const quota = projectQuotas.find(q => q.materialId === value);
        
        return (
          <div>
            <Select
              style={{ width: '100%' }}
              placeholder="Chọn vật tư"
              value={value}
              onChange={(v) => updateItem(record.id, 'materialId', v)}
              showSearch
              optionFilterProp="children"
            >
              {materials.map(m => (
                <Select.Option key={m.id} value={m.id}>
                  {m.code} - {m.name} ({m.unit})
                  {m.stock > 0 && ` - Tồn: ${m.stock}`}
                </Select.Option>
              ))}
            </Select>
            {selectedMaterial && (
              <div style={{ marginTop: 4, fontSize: 12 }}>
                {selectedMaterial.stock > 0 ? (
                  <span style={{ color: '#52c41a' }}>
                    ✓ Tồn kho: {selectedMaterial.stock} {selectedMaterial.unit}
                  </span>
                ) : (
                  <span style={{ color: '#ff4d4f' }}>
                    ⚠ Hết hàng - Cần mua mới
                  </span>
                )}
                {quota && (
                  <div style={{ marginTop: 2, color: '#1890ff' }}>
                    📊 Định mức BOQ: {quota.usedQuantity}/{quota.maxQuantity} {selectedMaterial.unit} 
                    (Còn: {quota.maxQuantity - quota.usedQuantity})
                  </div>
                )}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      width: 150,
      render: (value, record) => {
        const selectedMaterial = materials.find(m => m.id === record.materialId);
        const inStock = selectedMaterial?.stock || 0;
        const needToBuy = Math.max(0, value - inStock);
        
        return (
          <div>
            <InputNumber
              min={1}
              value={value}
              onChange={(v) => updateItem(record.id, 'quantity', v)}
              style={{ width: '100%' }}
            />
            {selectedMaterial && value > inStock && (
              <div style={{ marginTop: 4, fontSize: 11, color: '#fa8c16' }}>
                Xuất kho: {inStock}, Mua thêm: {needToBuy}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      render: (value, record) => (
        <Input
          value={value}
          onChange={(e) => updateItem(record.id, 'note', e.target.value)}
          placeholder="Ghi chú"
        />
      ),
    },
    {
      title: '',
      width: 60,
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeItem(record.id)}
        />
      ),
    },
  ];

  return (
    <Card title="Tạo yêu cầu vật tư mới">
      {user?.role === 'giam_sat' && (
        <Alert
          message="Lưu ý về định mức"
          description="Nếu yêu cầu vượt định mức vật tư của dự án, bạn vẫn có thể tạo nhưng sẽ cần phê duyệt đặc biệt từ Giám đốc."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {selectedProjectId && projectQuotas.length > 0 && (
        <Alert
          message="Định mức BOQ của dự án"
          description={
            <div>
              <p style={{ marginBottom: 8 }}>Dự án này có {projectQuotas.length} vật tư được định mức:</p>
              <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                {projectQuotas.map(q => {
                  const remaining = q.maxQuantity - q.usedQuantity;
                  const percentage = (q.usedQuantity / q.maxQuantity) * 100;
                  const color = percentage >= 90 ? '#ff4d4f' : percentage >= 70 ? '#fa8c16' : '#52c41a';
                  
                  return (
                    <li key={q.id} style={{ marginBottom: 4 }}>
                      <strong>{q.material.name}</strong>: 
                      <span style={{ color, marginLeft: 4 }}>
                        {q.usedQuantity}/{q.maxQuantity} {q.material.unit}
                      </span>
                      {remaining <= 0 && <span style={{ color: '#ff4d4f', marginLeft: 4 }}>(Đã hết định mức!)</span>}
                      {remaining > 0 && remaining < q.maxQuantity * 0.2 && (
                        <span style={{ color: '#fa8c16', marginLeft: 4 }}>(Sắp hết!)</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          }
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          name="projectId"
          label="Dự án"
          rules={[{ required: true, message: 'Vui lòng chọn dự án!' }]}
        >
          <Select 
            placeholder="Chọn dự án"
            onChange={handleProjectChange}
          >
            {projects.map(p => (
              <Select.Option key={p.id} value={p.id}>
                {p.code} - {p.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="description" label="Mô tả">
          <Input.TextArea rows={3} placeholder="Mô tả yêu cầu" />
        </Form.Item>

        <Form.Item name="priority" label="Độ ưu tiên" initialValue="normal">
          <Select>
            <Select.Option value="low">Thấp</Select.Option>
            <Select.Option value="normal">Bình thường</Select.Option>
            <Select.Option value="high">Cao</Select.Option>
            <Select.Option value="urgent">Khẩn cấp</Select.Option>
          </Select>
        </Form.Item>

        <div style={{ marginBottom: 16 }}>
          <Button type="dashed" onClick={addItem} icon={<PlusOutlined />} block>
            Thêm vật tư
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={items}
          rowKey="id"
          pagination={false}
        />

        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <Button onClick={() => navigate('/requests')} style={{ marginRight: 8 }}>
            Hủy
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            Tạo yêu cầu
          </Button>
        </div>
      </Form>
    </Card>
  );
}

export default CreateRequest;
