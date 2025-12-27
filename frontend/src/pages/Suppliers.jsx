import { useEffect, useState } from 'react';
import { Card, Table, Rate, Spin, Tag, Progress, Row, Col, Statistic, Button, message, Modal, Form, Input, Select, Space, Popconfirm } from 'antd';
import { TrophyOutlined, StarOutlined, DownloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../services/api';
import { exportToExcel, formatSuppliersForExport } from '../utils/export';
import { useAuthStore } from '../store/authStore';

function Suppliers() {
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [form] = Form.useForm();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const { data } = await getSuppliers();
      // Sort by rating descending for ranking
      const sorted = data.sort((a, b) => b.rating - a.rating);
      setSuppliers(sorted);
    } catch (error) {
      console.error('Load suppliers error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return '#52c41a';
    if (rating >= 4.0) return '#1890ff';
    if (rating >= 3.5) return '#faad14';
    if (rating >= 3.0) return '#fa8c16';
    return '#f5222d';
  };

  const getRankBadge = (index) => {
    if (index === 0) return <Tag icon={<TrophyOutlined />} color="gold">Top 1</Tag>;
    if (index === 1) return <Tag icon={<TrophyOutlined />} color="silver">Top 2</Tag>;
    if (index === 2) return <Tag icon={<TrophyOutlined />} color="bronze">Top 3</Tag>;
    return null;
  };

  const getAverageRating = () => {
    if (suppliers.length === 0) return 0;
    const sum = suppliers.reduce((acc, s) => acc + s.rating, 0);
    return (sum / suppliers.length).toFixed(1);
  };

  const getTopSuppliers = () => suppliers.filter(s => s.rating >= 4.5).length;

  const handleExport = () => {
    const formattedData = formatSuppliersForExport(suppliers);
    const success = exportToExcel(
      formattedData,
      `Bang-xep-hang-NCC-${new Date().toISOString().split('T')[0]}.xlsx`,
      'Nhà cung cấp'
    );
    if (success) {
      message.success('Xuất Excel thành công');
    } else {
      message.error('Có lỗi khi xuất Excel');
    }
  };

  const handleCreate = () => {
    setEditingSupplier(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    form.setFieldsValue({
      companyName: supplier.companyName,
      taxCode: supplier.taxCode,
      address: supplier.address,
      phone: supplier.phone,
      email: supplier.email,
      contactPerson: supplier.contactPerson,
      status: supplier.status,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteSupplier(id);
      message.success('Vô hiệu hóa nhà cung cấp thành công');
      loadSuppliers();
    } catch (error) {
      message.error('Có lỗi khi vô hiệu hóa nhà cung cấp');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, values);
        message.success('Cập nhật nhà cung cấp thành công');
      } else {
        await createSupplier(values);
        message.success('Tạo nhà cung cấp thành công');
      }
      setModalVisible(false);
      form.resetFields();
      loadSuppliers();
    } catch (error) {
      message.error(error.response?.data?.error || 'Có lỗi xảy ra');
    }
  };

  const columns = [
    {
      title: 'Hạng',
      width: 80,
      fixed: 'left',
      render: (_, record, index) => (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 'bold', color: '#666' }}>#{index + 1}</div>
          {getRankBadge(index)}
        </div>
      ),
    },
    {
      title: 'Mã NCC',
      dataIndex: 'code',
      key: 'code',
      width: 100,
    },
    {
      title: 'Thông tin công ty',
      key: 'company',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: 14 }}>{record.companyName}</div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
            <div>MST: {record.taxCode || 'N/A'}</div>
            <div>Liên hệ: {record.contactPerson || 'N/A'}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Liên hệ',
      key: 'contact',
      render: (_, record) => (
        <div>
          <div>📞 {record.phone}</div>
          <div style={{ fontSize: 12, color: '#666' }}>✉️ {record.email}</div>
        </div>
      ),
    },
    {
      title: 'Đánh giá',
      dataIndex: 'rating',
      key: 'rating',
      width: 220,
      sorter: (a, b) => b.rating - a.rating,
      render: (rating) => (
        <div>
          <Rate disabled value={rating} allowHalf style={{ fontSize: 16 }} />
          <div style={{ 
            marginTop: 4, 
            fontSize: 16, 
            fontWeight: 'bold',
            color: getRatingColor(rating)
          }}>
            {rating.toFixed(1)} / 5.0
          </div>
          <Progress 
            percent={(rating / 5) * 100} 
            showInfo={false}
            strokeColor={getRatingColor(rating)}
            size="small"
            style={{ marginTop: 4 }}
          />
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : status === 'blacklist' ? 'red' : 'default'}>
          {status === 'active' ? 'Hoạt động' : status === 'blacklist' ? 'Blacklist' : 'Ngừng'}
        </Tag>
      ),
    },
    ...(isAdmin ? [{
      title: 'Thao tác',
      key: 'actions',
      width: 120,
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
            title="Vô hiệu hóa nhà cung cấp?"
            description="Nhà cung cấp sẽ không thể đăng nhập và tham gia báo giá."
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
    }] : []),
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
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Tổng số nhà cung cấp"
              value={suppliers.length}
              prefix={<StarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Đánh giá trung bình"
              value={getAverageRating()}
              suffix="/ 5.0"
              valueStyle={{ color: getRatingColor(parseFloat(getAverageRating())) }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="NCC xuất sắc (≥ 4.5⭐)"
              value={getTopSuppliers()}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card 
        title="Bảng xếp hạng nhà cung cấp"
        extra={
          <Space>
            {isAdmin && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
              >
                Thêm NCC
              </Button>
            )}
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExport}
            >
              Xuất Excel
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={suppliers}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title={editingSupplier ? 'Chỉnh sửa nhà cung cấp' : 'Thêm nhà cung cấp mới'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={700}
        okText={editingSupplier ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          {!editingSupplier && (
            <>
              <Form.Item
                label="Email đăng nhập"
                name="email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email' },
                  { type: 'email', message: 'Email không hợp lệ' },
                ]}
              >
                <Input placeholder="email@example.com" />
              </Form.Item>

              <Form.Item
                label="Mật khẩu"
                name="password"
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu' },
                  { min: 6, message: 'Mật khẩu tối thiểu 6 ký tự' },
                ]}
              >
                <Input.Password placeholder="Mật khẩu đăng nhập" />
              </Form.Item>

              <Form.Item
                label="Tên người dùng"
                name="name"
                rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
              >
                <Input placeholder="Tên người đại diện" />
              </Form.Item>
            </>
          )}

          <Form.Item
            label="Tên công ty"
            name="companyName"
            rules={[{ required: true, message: 'Vui lòng nhập tên công ty' }]}
          >
            <Input placeholder="Công ty TNHH ABC" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Mã số thuế"
                name="taxCode"
              >
                <Input placeholder="0123456789" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Số điện thoại"
                name="phone"
                rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
              >
                <Input placeholder="0901234567" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Địa chỉ"
            name="address"
          >
            <Input.TextArea rows={2} placeholder="Địa chỉ công ty" />
          </Form.Item>

          <Form.Item
            label="Người liên hệ"
            name="contactPerson"
          >
            <Input placeholder="Tên người liên hệ" />
          </Form.Item>

          {editingSupplier && (
            <Form.Item
              label="Trạng thái"
              name="status"
              rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
            >
              <Select>
                <Select.Option value="active">Hoạt động</Select.Option>
                <Select.Option value="inactive">Ngừng hoạt động</Select.Option>
                <Select.Option value="blacklist">Blacklist</Select.Option>
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
}

export default Suppliers;
