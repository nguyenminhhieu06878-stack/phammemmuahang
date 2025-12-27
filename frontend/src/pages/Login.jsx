import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { login } from '../services/api';
import { useAuthStore } from '../store/authStore';

function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const { data } = await login(values.email, values.password);
      setAuth(data.user, data.token);
      message.success('Đăng nhập thành công!');
      navigate('/');
    } catch (error) {
      message.error('Email hoặc mật khẩu không đúng!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 1200 600\'%3E%3Cdefs%3E%3ClinearGradient id=\'bg\' x1=\'0%25\' y1=\'0%25\' x2=\'100%25\' y2=\'100%25\'%3E%3Cstop offset=\'0%25\' style=\'stop-color:%23f0f0f0;stop-opacity:1\' /%3E%3Cstop offset=\'100%25\' style=\'stop-color:%23e0e0e0;stop-opacity:1\' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill=\'url(%23bg)\' width=\'1200\' height=\'600\'/%3E%3C/svg%3E")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
      }}
    >
      {/* Overlay with construction theme */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, rgba(240,240,240,0.95) 0%, rgba(220,220,220,0.95) 100%)',
        backgroundImage: `
          repeating-linear-gradient(
            45deg,
            transparent,
            transparent 35px,
            rgba(0,0,0,.02) 35px,
            rgba(0,0,0,.02) 70px
          )
        `,
      }} />
      
      {/* Construction silhouette overlay */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '40%',
        background: 'linear-gradient(to top, rgba(0,0,0,0.1), transparent)',
        pointerEvents: 'none',
      }} />

      <Card
        style={{
          width: 450,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          position: 'relative',
          zIndex: 1,
          backdropFilter: 'blur(10px)',
          background: 'rgba(255, 255, 255, 0.98)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ 
            fontSize: 48, 
            marginBottom: 16,
            background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold',
          }}>
            🏗️
          </div>
          <h1 style={{ 
            fontSize: 32, 
            fontWeight: 'bold', 
            background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: 8,
            letterSpacing: '2px',
          }}>
            PHẦN MÊM MUA HÀNG
          </h1>
          <p style={{ color: '#666', fontSize: 14 }}>Quản lý mua hàng xây dựng chuyên nghiệp</p>
        </div>

        <Form name="login" onFinish={onFinish} size="large">
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="Email" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default Login;
