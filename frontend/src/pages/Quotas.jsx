import { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Select, InputNumber, message, Space, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getQuotas, getProjects, getMaterials, createOrUpdateQuota, deleteQuota } from '../services/api';

function Quotas() {
  const [loading, setLoading] = useState(true);
  const [quotas, setQuotas] = useState([]);
  const [projects, setProjects] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingQuota, setEditingQuota] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [quotasRes, projectsRes, materialsRes] = await Promise.all([
        getQuotas(),
        getProjects(),
        getMaterials(),
      ]);
      setQuotas(quotasRes.data);
      setProjects(projectsRes.data);
      setMaterials(materialsRes.data);
    } catch (error) {
      console.error('Load data error:', error);
      message.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingQuota(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (quota) => {
    setEditingQuota(quota);
    form.setFieldsValue({
      projectId: quota.projectId,
      materialId: quota.materialId,
      maxQuantity: quota.maxQuantity,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteQuota(id);
      message.success('Xóa định mức thành công');
      loadData();
    } catch (error) {
      message.error('Có lỗi khi xóa định mức');
    }
  };

  const handleSubmit = async (values) => {
    try {
      await createOrUpdateQuota(values);
      message.success(editingQuota ? 'Cập nhật định mức thành công' : 'Tạo định mức thành công');
      setModalVisible(false);
      form.resetFields();
      loadData();
    } catch (error) {
      message.error(error.response?.data?.error || 'Có lỗi xảy ra');
    }
  };

  const columns = [
    {
      title: 'Dự án',
      dataIndex: ['project', 'name'],
      key: 'project',
      render: (name, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{name}</div>
          <div style={{ fontSize: 12, color: '#666' }}>{record.project.code}</div>
        </div>
      ),
    },
    {
      title: 'Vật tư',
      dataIndex: ['material', 'name'],
      key: 'material',
      render: (name, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{name}</div>
          <div style={{ fontSize: 12, color: '#666' }}>
            {record.material.code} - {record.material.category.name}
          </div>
        </div>
      ),
    },
    {
      title: 'Đơn vị',
      dataIndex: ['material', 'unit'],
      key: 'unit',
      width: 100,
    },
    {
      title: 'Định mức tối đa',
      dataIndex: 'maxQuantity',
      key: 'maxQuantity',
      width: 150,
      render: (qty, record) => (
        <Tag color="blue" style={{ fontSize: 14 }}>
          {qty} {record.material.unit}
        </Tag>
      ),
    },
    {
      title: 'Đã sử dụng',
      dataIndex: 'usedQuantity',
      key: 'usedQuantity',
      width: 150,
      render: (used, record) => {
        const percentage = (used / record.maxQuantity) * 100;
        const color = percentage >= 90 ? 'red' : percentage >= 70 ? 'orange' : 'green';
        return (
          <div>
            <Tag color={color}>
              {used} / {record.maxQuantity} {record.material.unit}
            </Tag>
            <div style={{ fontSize: 12, color: '#666' }}>
              {percentage.toFixed(1)}%
            </div>
          </div>
        );
      },
    },
    {
      title: 'Còn lại',
      key: 'remaining',
      width: 120,
      render: (_, record) => {
        const remaining = record.maxQuantity - record.usedQuantity;
        const color = remaining <= 0 ? 'red' : remaining < record.maxQuantity * 0.2 ? 'orange' : 'green';
        return (
          <Tag color={color}>
            {remaining} {record.material.unit}
          </Tag>
        );
      },
    },
    {
      title: 'Người tạo',
      dataIndex: ['createdBy', 'name'],
      key: 'createdBy',
      width: 150,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xóa định mức?"
            description="Bạn có chắc chắn muốn xóa định mức này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Đồng ý"
            cancelText="Hủy"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
            >
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="Quản lý Định mức Vật tư"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            Thêm Định mức
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={quotas}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title={editingQuota ? 'Chỉnh sửa Định mức' : 'Thêm Định mức mới'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
        okText={editingQuota ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="Dự án"
            name="projectId"
            rules={[{ required: true, message: 'Vui lòng chọn dự án' }]}
          >
            <Select
              placeholder="Chọn dự án"
              disabled={!!editingQuota}
              showSearch
              optionFilterProp="children"
            >
              {projects.map(p => (
                <Select.Option key={p.id} value={p.id}>
                  {p.code} - {p.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Vật tư"
            name="materialId"
            rules={[{ required: true, message: 'Vui lòng chọn vật tư' }]}
          >
            <Select
              placeholder="Chọn vật tư"
              disabled={!!editingQuota}
              showSearch
              optionFilterProp="children"
            >
              {materials.map(m => (
                <Select.Option key={m.id} value={m.id}>
                  {m.code} - {m.name} ({m.unit})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Định mức tối đa"
            name="maxQuantity"
            rules={[
              { required: true, message: 'Vui lòng nhập định mức' },
              { type: 'number', min: 0.01, message: 'Định mức phải lớn hơn 0' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Nhập định mức tối đa"
              min={0.01}
              step={0.1}
            />
          </Form.Item>

          {editingQuota && (
            <div style={{ padding: 12, background: '#f0f2f5', borderRadius: 4 }}>
              <div><strong>Thông tin hiện tại:</strong></div>
              <div>Đã sử dụng: {editingQuota.usedQuantity} {editingQuota.material.unit}</div>
              <div>Còn lại: {editingQuota.maxQuantity - editingQuota.usedQuantity} {editingQuota.material.unit}</div>
            </div>
          )}
        </Form>
      </Modal>
    </div>
  );
}

export default Quotas;
