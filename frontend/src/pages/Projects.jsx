import { useEffect, useState } from 'react';
import { Card, Table, Tag, Spin, Button, Modal, Form, Input, DatePicker, InputNumber, Select, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getProjects, createProject, updateProject, deleteProject } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { hasPermission } from '../utils/permissions';
import dayjs from 'dayjs';

function Projects() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [form] = Form.useForm();
  const { user } = useAuthStore();
  
  const canManage = hasPermission(user?.role, 'MANAGE_PROJECTS');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const { data } = await getProjects();
      setProjects(data);
    } catch (error) {
      console.error('Load projects error:', error);
      message.error('Không thể tải danh sách dự án');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingProject(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    form.setFieldsValue({
      code: project.code,
      name: project.name,
      description: project.description,
      startDate: dayjs(project.startDate),
      endDate: project.endDate ? dayjs(project.endDate) : null,
      budget: project.budget,
      status: project.status,
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      const data = {
        ...values,
        startDate: values.startDate.toISOString(),
        endDate: values.endDate ? values.endDate.toISOString() : null,
      };

      if (editingProject) {
        await updateProject(editingProject.id, data);
        message.success('Cập nhật dự án thành công');
      } else {
        await createProject(data);
        message.success('Tạo dự án thành công');
      }
      setModalVisible(false);
      form.resetFields();
      loadProjects();
    } catch (error) {
      message.error(error.response?.data?.error || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = (project) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: `Bạn có chắc chắn muốn xóa dự án "${project.name}"?`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await deleteProject(project.id);
          message.success('Xóa dự án thành công');
          loadProjects();
        } catch (error) {
          message.error(error.response?.data?.error || 'Có lỗi khi xóa dự án');
        }
      },
    });
  };

  const columns = [
    {
      title: 'Mã dự án',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: 'Tên dự án',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Ngày bắt đầu',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Ngày kết thúc',
      dataIndex: 'endDate',
      key: 'endDate',
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
    },
    {
      title: 'Ngân sách',
      dataIndex: 'budget',
      key: 'budget',
      render: (budget) => budget ? `${budget.toLocaleString()} ₫` : '-',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'default'}>
          {status === 'active' ? 'Đang chạy' : 'Hoàn thành'}
        </Tag>
      ),
    },
  ];

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
        title="Danh sách dự án"
        extra={
          canManage && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Tạo dự án mới
            </Button>
          )
        }
      >
        <Table
          columns={columns}
          dataSource={projects}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingProject ? 'Sửa dự án' : 'Tạo dự án mới'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={700}
        okText={editingProject ? 'Cập nhật' : 'Tạo'}
        cancelText="Hủy"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="code"
            label="Mã dự án"
            rules={[{ required: true, message: 'Vui lòng nhập mã dự án' }]}
          >
            <Input placeholder="VD: DA001" />
          </Form.Item>

          <Form.Item
            name="name"
            label="Tên dự án"
            rules={[{ required: true, message: 'Vui lòng nhập tên dự án' }]}
          >
            <Input placeholder="VD: Dự án Chung cư Sunrise" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
          >
            <Input.TextArea rows={3} placeholder="Mô tả chi tiết về dự án" />
          </Form.Item>

          <Form.Item
            name="startDate"
            label="Ngày bắt đầu"
            rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu' }]}
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item
            name="endDate"
            label="Ngày kết thúc (dự kiến)"
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item
            name="budget"
            label="Ngân sách (₫)"
          >
            <InputNumber
              style={{ width: '100%' }}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
              placeholder="VD: 50000000000"
            />
          </Form.Item>

          <Form.Item
            name="status"
            label="Trạng thái"
            initialValue="active"
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value="active">Đang chạy</Select.Option>
              <Select.Option value="completed">Hoàn thành</Select.Option>
              <Select.Option value="cancelled">Đã hủy</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default Projects;
