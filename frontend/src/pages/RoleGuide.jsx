import { Card, Descriptions, Tag, Collapse } from 'antd';
import { useAuthStore } from '../store/authStore';
import { getRoleLabel } from '../utils/permissions';

const { Panel } = Collapse;

function RoleGuide() {
  const { user } = useAuthStore();

  const roleDescriptions = {
    admin: {
      label: 'Quản trị viên',
      color: 'red',
      permissions: [
        'Quản lý toàn bộ hệ thống',
        'Quản lý users và phân quyền',
        'Quản lý master data (dự án, vật tư, nhà cung cấp)',
        'Xem tất cả báo cáo và dashboard',
        'Có thể thực hiện mọi chức năng trong hệ thống',
      ],
    },
    truong_phong_mh: {
      label: 'Trưởng phòng Mua hàng',
      color: 'blue',
      permissions: [
        'Phê duyệt yêu cầu vật tư (cấp 1)',
        'Tạo và gửi RFQ cho nhà cung cấp',
        'So sánh báo giá và chọn NCC',
        'Tạo Purchase Order (PO)',
        'Phê duyệt PO (cấp 1)',
        'Theo dõi tiến độ đơn hàng',
        'Quản lý nhà cung cấp',
      ],
    },
    nhan_vien_mh: {
      label: 'Nhân viên Mua hàng',
      color: 'cyan',
      permissions: [
        'Tạo yêu cầu vật tư',
        'Kiểm tra tồn kho',
        'Xem RFQ và báo giá',
        'Theo dõi đơn hàng',
        'Xem thông tin vật tư và nhà cung cấp',
      ],
    },
    ke_toan: {
      label: 'Kế toán',
      color: 'green',
      permissions: [
        'Phê duyệt yêu cầu vật tư (cấp 2)',
        'Phê duyệt PO (cấp 2)',
        'Xử lý thanh toán',
        'Kiểm tra chứng từ (PO, hóa đơn VAT, biên bản)',
        'Tạo ủy nhiệm chi',
        'Đối soát công nợ với NCC',
      ],
    },
    giam_doc: {
      label: 'Giám đốc',
      color: 'purple',
      permissions: [
        'Phê duyệt cuối cùng cho PO (cấp 3)',
        'Ký duyệt các đơn hàng giá trị cao',
        'Xem dashboard tổng quan',
        'Xem báo cáo chi phí theo dự án',
        'Giám sát toàn bộ quy trình mua hàng',
      ],
    },
    giam_sat: {
      label: 'Giám sát công trình',
      color: 'orange',
      permissions: [
        'Tạo yêu cầu vật tư từ công trường',
        'Nhận thông báo khi hàng sắp về',
        'Kiểm tra số lượng và chất lượng hàng khi giao',
        'Chụp ảnh biên bản giao nhận',
        'Xác nhận nghiệm thu',
        'Sử dụng trên mobile/web responsive',
      ],
    },
    ncc: {
      label: 'Nhà cung cấp',
      color: 'gold',
      permissions: [
        'Nhận RFQ qua email',
        'Truy cập cổng phản hồi báo giá',
        'Nhập báo giá (giá, thời gian giao, điều kiện thanh toán)',
        'Nhận PO qua email',
        'Cập nhật tiến độ giao hàng',
        'Xem lịch sử đơn hàng và đánh giá',
      ],
    },
  };

  const approvalFlow = [
    {
      step: 1,
      role: 'Trưởng phòng Mua hàng',
      description: 'Phê duyệt yêu cầu vật tư và PO',
    },
    {
      step: 2,
      role: 'Kế toán trưởng',
      description: 'Kiểm tra và phê duyệt về mặt tài chính',
    },
    {
      step: 3,
      role: 'Giám đốc',
      description: 'Phê duyệt cuối cùng',
    },
  ];

  return (
    <div>
      <Card title="Hướng dẫn phân quyền hệ thống">
        <Descriptions bordered>
          <Descriptions.Item label="Vai trò hiện tại" span={3}>
            <Tag color={roleDescriptions[user?.role]?.color || 'default'}>
              {getRoleLabel(user?.role)}
            </Tag>
          </Descriptions.Item>
        </Descriptions>

        <div style={{ marginTop: 24 }}>
          <h3>Quyền hạn của bạn:</h3>
          <ul>
            {roleDescriptions[user?.role]?.permissions.map((perm, index) => (
              <li key={index}>{perm}</li>
            ))}
          </ul>
        </div>
      </Card>

      <Card title="Quy trình phê duyệt 3 cấp" style={{ marginTop: 16 }}>
        <Collapse>
          {approvalFlow.map((item) => (
            <Panel
              header={`Cấp ${item.step}: ${item.role}`}
              key={item.step}
            >
              <p>{item.description}</p>
            </Panel>
          ))}
        </Collapse>
      </Card>

      <Card title="Tất cả vai trò trong hệ thống" style={{ marginTop: 16 }}>
        <Collapse>
          {Object.entries(roleDescriptions).map(([key, value]) => (
            <Panel
              header={
                <span>
                  <Tag color={value.color}>{value.label}</Tag>
                </span>
              }
              key={key}
            >
              <h4>Quyền hạn:</h4>
              <ul>
                {value.permissions.map((perm, index) => (
                  <li key={index}>{perm}</li>
                ))}
              </ul>
            </Panel>
          ))}
        </Collapse>
      </Card>
    </div>
  );
}

export default RoleGuide;
