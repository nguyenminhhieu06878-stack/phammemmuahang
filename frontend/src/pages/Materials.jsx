import { useEffect, useState } from 'react';
import { Card, Table, Tag, Spin, Button, Modal, Form, Input, InputNumber, Select, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getMaterials, getCategories, createMaterial, updateMaterial, deleteMaterial } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { hasPermission } from '../utils/permissions';

function Materials() {
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [form] = Form.useForm();
  const { user } = useAuthStore();
  
  const canManage = hasPermission(user?.role, 'MANAGE_MATERIALS');

  useEffect(() => {
    loadMaterials();
    loadCategories();
  }, []);

  const loadMaterials = async () => {
    try {
      const { data } = await getMaterials();
      setMaterials(data);
    } catch (error) {
      console.error('Load materials error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data } = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Load categories error:', error);
    }
  };

  const columns = [
    {
      title: 'Mã vật tư',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: 'Tên vật tư',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Nhóm',
      dataIndex: ['category', 'name'],
      key: 'category',
    },
    {
      title: 'Đơn vị',
      dataIndex: 'unit',
      key: 'unit',
    },
    {
      title: 'Giá tham khảo',
      dataIndex: 'refPrice',
      key: 'refPrice',
      render: (price) => price ? `${price.toLocaleString()} ₫` : '-',
    },
    {
      title: 'Tồn kho',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock, record) => (
        <Tag color={stock <= record.minStock ? 'red' : 'green'}>
          {stock} {record.unit}
        </Tag>
      ),
    },
  ];

  const handleCreate = () => {
    setEditingMaterial(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (material) => {
    setEditingMaterial(material);
    form.setFieldsValue({
      code: material.code,
      name: material.name,
      description: material.description,
      categoryId: material.categoryId,
      unit: material.unit,
      refPrice: material.refPrice,
      stock: material.stock,
      minStock: material.minStock,
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      if (editingMaterial) {
        await updateMaterial(editingMaterial.id, values);
        message.success('Cập nhật vật tư thành công');
      } else {
        await createMaterial(values);
        message.success('Tạo vật tư thành công');
      }
      setModalVisible(false);
      form.resetFields();
      loadMaterials();
    } catch (error) {
      message.error(error.response?.data?.error || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = (material) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: `Bạn có chắc chắn muốn xóa vật tư "${material.name}"?`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await deleteMaterial(material.id);
          message.success('Xóa vật tư thành công');
          loadMaterials();
        } catch (error) {
          message.error(error.response?.data?.error || 'Có lỗi khi xóa vật tư');
        }
      },
    });
  };

  if (canManage) {
    columns.push({
      title: 'Hành động',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            Xóa
          </Button>
        </div>
      ),
    });
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      <Card 
        title="Danh sách vật tư"
        extra={
          canManage && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Thêm vật tư mới
            </Button>
          )
        }
      >
        <Table
          columns={columns}
          dataSource={materials}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingMaterial ? 'Sửa vật tư' : 'Thêm vật tư mới'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={700}
        okText={editingMaterial ? 'Cập nhật' : 'Thêm'}
        cancelText="Hủy"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="code"
            label="Mã vật tư"
            rules={[{ required: true, message: 'Vui lòng nhập mã vật tư' }]}
          >
            <Input placeholder="VD: VL001" />
          </Form.Item>

          <Form.Item
            name="name"
            label="Tên vật tư"
            rules={[{ required: true, message: 'Vui lòng nhập tên vật tư' }]}
          >
            <Input placeholder="VD: Xi măng PCB40" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
          >
            <Input.TextArea rows={2} placeholder="Mô tả chi tiết" />
          </Form.Item>

          <Form.Item
            name="categoryId"
            label="Nhóm vật tư"
            rules={[{ required: true, message: 'Vui lòng chọn nhóm' }]}
          >
            <Select placeholder="Chọn nhóm vật tư">
              {categories.map(cat => (
                <Select.Option key={cat.id} value={cat.id}>
                  {cat.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="unit"
            label="Đơn vị tính"
            rules={[{ required: true, message: 'Vui lòng nhập đơn vị' }]}
          >
            <Input placeholder="VD: bao, m3, kg, cái..." />
          </Form.Item>

          <Form.Item
            name="refPrice"
            label="Giá tham khảo (₫)"
          >
            <InputNumber
              style={{ width: '100%' }}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
              placeholder="VD: 95000"
            />
          </Form.Item>

          <Form.Item
            name="stock"
            label="Số lượng tồn kho"
            initialValue={0}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              placeholder="VD: 500"
            />
          </Form.Item>

          <Form.Item
            name="minStock"
            label="Tồn kho tối thiểu"
            initialValue={0}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              placeholder="VD: 100"
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default Materials;
