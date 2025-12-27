import { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Modal, Form, Input, Select, Space, message, Popconfirm, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import { getUsers, createUser, updateUser, deleteUser } from '../services/api';
import { getRoleLabel } from '../utils/permissions';

function Users() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data } = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Load users error:', error);
      message.error('Không thể tải danh sách users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    form.setFieldsValue({
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      active: user.active,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteUser(id);
      message.success('Vô hiệu hóa user thành công');
      loadUsers();
    } catch (error) {
      message.error(error.response?.data?.error || 'Có lỗi khi vô hiệu hóa user');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingUser) {
        await updateUser(editingUser.id, values);
        message.success('Cập nhật user thành công');
      } else {
        await createUser(values);
        message.success('Tạo user thành công');
      }
      setModalVisible(false);
      form.resetFields();
      loadUsers();
    } catch (error) {
      message.error(error.response?.data?.error || 'Có lỗi xảy ra');
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'red',
      truong_phong_mh: 'blue',
      nhan_vien_mh: 'cyan',
      ke_toan: 'green',
      giam_doc: 'purple',
      giam_sat: 'orange',
      ncc: 'gold',
      phong_os: 'magenta',
    };
    return colors[role] || 'default';
  };

  const columns = [
    {
      title: 'Tên',
      dataIndex: 'name',
      key: 'name',
      render: (name) => (
        <Space>
          <UserOutlined />
          {name}
        </Space>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      filters: [
        { text: 'Quản trị viên', value: 'admin' },
        { text: 'Trưởng phòng MH', value: 'truong_phong_mh' },
        { text: 'Nhân viên MH', value: 'nhan_vien_mh' },
        { text: 'Kế toán', value: 'ke_toan' },
        { text: 'Giám đốc', value: 'giam_doc' },
        { text: 'Giám sát', value: 'giam_sat' },
        { text: 'Nhà cung cấp', value: 'ncc' },
        { text: 'Phòng OS', value: 'phong_os' },
      ],
      onFilter: (value, record) => record.role === value,
      render: (role) => (
        <Tag color={getRoleColor(role)}>
          {getRoleLabel(role)}
        </Tag>
      ),
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone) => phone || '-',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'active',
      key: 'active',
      filters: [
        { text: 'Hoạt động', value: true },
        { text: 'Vô hiệu hóa', value: false },
      ],
      onFilter: (value, record) => record.active === value,
      render: (active) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? 'Hoạt động' : 'Vô hiệu hóa'}
        </Tag>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      fixed: 'right',
      width: 150,
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
            title="Vô hiệu hóa user?"
            description="User sẽ không thể đăng nhập vào hệ thống."
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
        title="Quản lý Users"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            Thêm User
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title={editingUser ? 'Chỉnh sửa User' : 'Thêm User mới'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
        okText={editingUser ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="Tên"
            name="name"
            rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
          >
            <Input placeholder="Nguyễn Văn A" />
          </Form.Item>

          {!editingUser && (
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: 'Vui lòng nhập email' },
                { type: 'email', message: 'Email không hợp lệ' },
              ]}
            >
              <Input placeholder="email@example.com" />
            </Form.Item>
          )}

          {editingUser && (
            <Form.Item label="Email">
              <Input value={editingUser.email} disabled />
            </Form.Item>
          )}

          <Form.Item
            label="Vai trò"
            name="role"
            rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
          >
            <Select placeholder="Chọn vai trò">
              <Select.Option value="admin">
                <Tag color="red">Quản trị viên</Tag>
              </Select.Option>
              <Select.Option value="truong_phong_mh">
                <Tag color="blue">Trưởng phòng Mua hàng</Tag>
              </Select.Option>
              <Select.Option value="nhan_vien_mh">
                <Tag color="cyan">Nhân viên Mua hàng</Tag>
              </Select.Option>
              <Select.Option value="ke_toan">
                <Tag color="green">Kế toán</Tag>
              </Select.Option>
              <Select.Option value="giam_doc">
                <Tag color="purple">Giám đốc</Tag>
              </Select.Option>
              <Select.Option value="giam_sat">
                <Tag color="orange">Giám sát</Tag>
              </Select.Option>
              <Select.Option value="ncc">
                <Tag color="gold">Nhà cung cấp</Tag>
              </Select.Option>
              <Select.Option value="phong_os">
                <Tag color="magenta">Phòng OS</Tag>
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Số điện thoại"
            name="phone"
          >
            <Input placeholder="0901234567" />
          </Form.Item>

          {!editingUser && (
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
          )}

          {editingUser && (
            <>
              <Form.Item
                label="Mật khẩu mới (để trống nếu không đổi)"
                name="password"
              >
                <Input.Password placeholder="Nhập mật khẩu mới" />
              </Form.Item>

              <Form.Item
                label="Trạng thái"
                name="active"
                valuePropName="checked"
              >
                <Switch checkedChildren="Hoạt động" unCheckedChildren="Vô hiệu hóa" />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
}

export default Users;
