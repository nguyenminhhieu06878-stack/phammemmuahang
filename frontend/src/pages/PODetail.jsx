import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Table, Tag, Button, Spin, Space, Modal, Input, message, Form, Select, InputNumber, Checkbox, Upload } from 'antd';
import { CheckOutlined, CloseOutlined, StarOutlined, DollarOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { getPOs, approvePO, createPayment, approvePayment, getPaymentByPO, checkPaymentDocuments, getStockIssueByRequest, getTracking, createTracking } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { canApprovePO, getApprovalLevelLabel } from '../utils/permissions';
import { exportMultipleSheets, exportPOWithSignatures } from '../utils/export';
import dayjs from 'dayjs';

function PODetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [po, setPo] = useState(null);
  const [stockIssue, setStockIssue] = useState(null);
  const [trackings, setTrackings] = useState([]);
  const [payment, setPayment] = useState(null);
  const [documentCheck, setDocumentCheck] = useState(null);
  const [vatInvoiceFileList, setVatInvoiceFileList] = useState([]);
  const [trackingModalVisible, setTrackingModalVisible] = useState(false);
  const [trackingForm] = Form.useForm();
  const [approving, setApproving] = useState(false);
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [approveStatus, setApproveStatus] = useState('');
  const [comment, setComment] = useState('');
  const [signature, setSignature] = useState('');
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentForm] = Form.useForm();
  const signatureInputRef = useRef(null);

  useEffect(() => {
    loadPO();
  }, [id]);

  const loadPO = async () => {
    try {
      const { data } = await getPOs();
      const found = data.find(p => p.id === parseInt(id));
      setPo(found);
      
      // Load stock issue if exists (from the same request)
      if (found?.quotation?.rfq?.requestId) {
        try {
          const stockRes = await getStockIssueByRequest(found.quotation.rfq.requestId);
          setStockIssue(stockRes.data);
        } catch (error) {
          // No stock issue, that's ok
          console.log('No stock issue found for this request');
        }
      }

      // Load tracking history
      try {
        const trackingRes = await getTracking(found.id);
        setTrackings(trackingRes.data);
      } catch (error) {
        console.log('No tracking data yet');
      }

      // Load payment if exists
      try {
        const paymentRes = await getPaymentByPO(found.id);
        setPayment(paymentRes.data);
      } catch (error) {
        console.log('No payment yet');
      }
    } catch (error) {
      console.error('Load PO error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (status) => {
    setApproveStatus(status);
    setApproveModalVisible(true);
    setComment('');
    setSignature('');
  };

  const handleApproveSubmit = async () => {
    const signatureValue = signatureInputRef.current?.input?.value || signature;
    
    if (approveStatus === 'approved' && !signatureValue) {
      message.error('Vui lòng nhập chữ ký');
      return;
    }
    
    try {
      setApproving(true);
      await approvePO(id, { 
        status: approveStatus, 
        comment, 
        signature: approveStatus === 'approved' ? signatureValue : null 
      });
      message.success(`${approveStatus === 'approved' ? 'Phê duyệt' : 'Từ chối'} thành công`);
      setApproveModalVisible(false);
      setComment('');
      setSignature('');
      loadPO();
    } catch (error) {
      message.error('Có lỗi xảy ra');
    } finally {
      setApproving(false);
    }
  };

  const getPendingApprovalLevel = () => {
    if (!po?.approvals) return null;
    const pendingApproval = po.approvals.find(a => a.status === 'pending');
    return pendingApproval?.level;
  };

  const canUserApprove = () => {
    if (po?.status !== 'pending') return false;
    const pendingLevel = getPendingApprovalLevel();
    return pendingLevel && canApprovePO(user?.role, pendingLevel);
  };

  const handlePayment = async () => {
    // Check documents first but allow to proceed
    try {
      const { data } = await checkPaymentDocuments({
        poId: po.id,
        paymentType: 'postpay',
      });
      
      setDocumentCheck(data);
    } catch (error) {
      console.error('Check documents error:', error);
    }

    // Always open form, show warning inside
    paymentForm.setFieldsValue({
      amount: po.grandTotal,
      paymentMethod: 'bank_transfer',
      paymentType: 'postpay',
    });
    setPaymentModalVisible(true);
  };

  const handlePaymentSubmit = async (values) => {
    try {
      await createPayment({
        poId: parseInt(id),
        ...values,
      });
      message.success('Tạo Ủy nhiệm chi thành công! Chờ Kế toán trưởng phê duyệt.');
      setPaymentModalVisible(false);
      paymentForm.resetFields();
      setVatInvoiceFileList([]);
      loadPO();
    } catch (error) {
      message.error(error.response?.data?.error || 'Có lỗi khi tạo thanh toán');
    }
  };

  const handleApprovePayment = async (status) => {
    Modal.confirm({
      title: status === 'approved' ? 'Phê duyệt thanh toán' : 'Từ chối thanh toán',
      content: `Bạn có chắc chắn muốn ${status === 'approved' ? 'phê duyệt' : 'từ chối'} thanh toán này?`,
      onOk: async () => {
        try {
          await approvePayment(payment.id, { status });
          message.success(`${status === 'approved' ? 'Phê duyệt' : 'Từ chối'} thành công`);
          loadPO();
        } catch (error) {
          message.error('Có lỗi xảy ra');
        }
      },
    });
  };

  const handleExportPO = () => {
    const sheets = exportPOWithSignatures(po);
    exportMultipleSheets(sheets, `PO_${po.code}_${dayjs().format('YYYYMMDD')}.xlsx`);
    message.success('Xuất file thành công');
  };

  const handleAddTracking = () => {
    trackingForm.resetFields();
    trackingForm.setFieldsValue({
      status: 'confirmed',
      isDelayed: false,
    });
    setTrackingModalVisible(true);
  };

  const handleTrackingSubmit = async (values) => {
    try {
      await createTracking({
        poId: po.id,
        ...values,
      });
      message.success('Cập nhật tiến độ thành công');
      setTrackingModalVisible(false);
      loadPO();
    } catch (error) {
      message.error(error.response?.data?.error || 'Có lỗi khi cập nhật');
    }
  };

  const getTrackingStatusLabel = (status) => {
    const labels = {
      confirmed: 'Đã xác nhận đơn',
      preparing: 'Đang chuẩn bị hàng',
      shipped: 'Đã xuất kho',
      in_transit: 'Đang vận chuyển',
      arrived: 'Đã đến nơi',
      delayed: 'Bị chậm trễ',
    };
    return labels[status] || status;
  };

  const getTrackingStatusColor = (status) => {
    const colors = {
      confirmed: 'blue',
      preparing: 'cyan',
      shipped: 'purple',
      in_transit: 'orange',
      arrived: 'green',
      delayed: 'red',
    };
    return colors[status] || 'default';
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!po) {
    return <Card>Không tìm thấy đơn hàng</Card>;
  }

  const columns = [
    {
      title: 'Mã vật tư',
      dataIndex: ['material', 'code'],
    },
    {
      title: 'Tên vật tư',
      dataIndex: ['material', 'name'],
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      render: (qty, record) => `${qty} ${record.material.unit}`,
    },
    {
      title: 'Đơn giá',
      dataIndex: 'unitPrice',
      render: (price) => `${price.toLocaleString()} ₫`,
    },
    {
      title: 'Thành tiền',
      dataIndex: 'amount',
      render: (amount) => `${amount.toLocaleString()} ₫`,
    },
  ];

  return (
    <div>
      <Card
        title={`Chi tiết đơn hàng ${po.code}`}
        extra={
          <Space>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExportPO}
            >
              Xuất PO (có chữ ký)
            </Button>
            {canUserApprove() && (
              <>
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={() => handleApprove('approved')}
                  loading={approving}
                >
                  Phê duyệt
                </Button>
                <Button
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => handleApprove('rejected')}
                  loading={approving}
                >
                  Từ chối
                </Button>
              </>
            )}
            {po.status === 'approved' && !po.delivery && user?.role === 'giam_sat' && (
              <Button
                type="primary"
                size="large"
                onClick={() => navigate(`/po/${po.id}/delivery`)}
                style={{ background: '#fa8c16', borderColor: '#fa8c16' }}
              >
                🚚 Kiểm nhận hàng từ NCC
              </Button>
            )}
            {po.delivery && !payment && user?.role === 'ke_toan' && (
              <Button
                type="primary"
                size="large"
                icon={<DollarOutlined />}
                onClick={handlePayment}
                style={{ background: '#52c41a', borderColor: '#52c41a' }}
              >
                💰 Tạo Ủy nhiệm chi
              </Button>
            )}
            {po.status === 'completed' && (
              <Button
                type="primary"
                icon={<StarOutlined />}
                onClick={() => navigate(`/po/${po.id}/evaluate`)}
              >
                Đánh giá NCC
              </Button>
            )}
            <Button onClick={() => navigate('/po')}>Quay lại</Button>
          </Space>
        }
      >
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Mã PO">{po.code}</Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag color="blue">{po.status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Dự án">{po.project.name}</Descriptions.Item>
          <Descriptions.Item label="Nhà cung cấp">{po.supplier.companyName}</Descriptions.Item>
          <Descriptions.Item label="Tổng giá trị">{po.totalAmount.toLocaleString()} ₫</Descriptions.Item>
          <Descriptions.Item label="VAT">{po.vatAmount.toLocaleString()} ₫</Descriptions.Item>
          <Descriptions.Item label="Tổng cộng">{po.grandTotal.toLocaleString()} ₫</Descriptions.Item>
          <Descriptions.Item label="Ngày giao">
            {dayjs(po.deliveryDate).format('DD/MM/YYYY')}
          </Descriptions.Item>
          <Descriptions.Item label="Địa chỉ giao hàng" span={2}>
            {po.deliveryAddress}
          </Descriptions.Item>
        </Descriptions>

        {po.approvals && po.approvals.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <h4>Lịch sử phê duyệt:</h4>
            {po.approvals.map((approval) => (
              <div key={approval.id} style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                <div style={{ marginBottom: 8 }}>
                  <Tag color={approval.status === 'approved' ? 'green' : approval.status === 'rejected' ? 'red' : 'orange'}>
                    Cấp {approval.level} - {getApprovalLevelLabel(approval.level)}
                  </Tag>
                  <span>
                    {approval.status === 'approved' ? 'Đã duyệt' : approval.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt'}
                    {approval.approver && ` bởi ${approval.approver.name}`}
                    {approval.approvedAt && ` - ${dayjs(approval.approvedAt).format('DD/MM/YYYY HH:mm')}`}
                  </span>
                </div>
                {approval.signature && (
                  <div style={{ marginLeft: 24, marginBottom: 8 }}>
                    <span style={{ fontWeight: 500 }}>✍️ Chữ ký: </span>
                    <span style={{ 
                      fontFamily: 'cursive', 
                      fontSize: 18, 
                      color: '#1890ff',
                      fontStyle: 'italic'
                    }}>
                      {approval.signature}
                    </span>
                    <Tag color="blue" style={{ marginLeft: 8 }}>Demo</Tag>
                  </div>
                )}
                {approval.comment && <div style={{ marginLeft: 24, color: '#666' }}>Ghi chú: {approval.comment}</div>}
              </div>
            ))}
          </div>
        )}
      </Card>

      {stockIssue && (
        <Card 
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20 }}>📦</span>
              <span>Lịch sử xuất kho nội bộ</span>
            </div>
          }
          style={{ marginTop: 16 }}
        >
          <div style={{ 
            padding: 16, 
            background: stockIssue.status === 'completed' ? '#f6ffed' : '#e6f7ff', 
            border: `2px solid ${stockIssue.status === 'completed' ? '#52c41a' : '#1890ff'}`, 
            borderRadius: 8 
          }}>
            <div style={{ marginBottom: 12 }}>
              <Tag color="blue">🏢 Nguồn: Kho nội bộ công ty</Tag>
              <Tag color={stockIssue.status === 'completed' ? 'green' : 'processing'}>
                {stockIssue.status === 'completed' ? '✅ Đã nhận hàng' : '🚚 Đang vận chuyển'}
              </Tag>
              <Tag>{stockIssue.code}</Tag>
            </div>
            
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="👤 Người xuất kho">
                {stockIssue.issuer.name}
              </Descriptions.Item>
              <Descriptions.Item label="📅 Ngày xuất">
                {dayjs(stockIssue.issuedAt).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
              
              {stockIssue.status === 'completed' && stockIssue.receiver && (
                <>
                  <Descriptions.Item label="✅ Người nhận">
                    {stockIssue.receiver.name}
                  </Descriptions.Item>
                  <Descriptions.Item label="✅ Ngày nhận">
                    {dayjs(stockIssue.receivedAt).format('DD/MM/YYYY HH:mm')}
                  </Descriptions.Item>
                </>
              )}
              
              <Descriptions.Item label="📦 Vật tư xuất kho" span={2}>
                <div style={{ marginTop: 8 }}>
                  {stockIssue.items.map((item, idx) => (
                    <div key={idx} style={{ padding: '4px 0', borderBottom: idx < stockIssue.items.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                      <strong>{item.material.name}</strong>: {item.quantity} {item.material.unit}
                      {item.note && <span style={{ color: '#666', marginLeft: 8 }}>({item.note})</span>}
                    </div>
                  ))}
                </div>
              </Descriptions.Item>
              
              {stockIssue.note && (
                <Descriptions.Item label="📝 Ghi chú" span={2}>
                  {stockIssue.note}
                </Descriptions.Item>
              )}
            </Descriptions>
            
            {stockIssue.status === 'pending' && (
              <div style={{ 
                marginTop: 12, 
                padding: 12, 
                background: '#fffbe6', 
                border: '1px solid #ffe58f', 
                borderRadius: 6 
              }}>
                ⏳ Chờ Giám sát xác nhận đã nhận hàng tại công trường
              </div>
            )}
          </div>
        </Card>
      )}

      {po.delivery && (
        <Card 
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20 }}>✅</span>
              <span>Thông tin kiểm nhận hàng từ nhà cung cấp</span>
            </div>
          }
          style={{ marginTop: 16 }}
        >
          <div style={{ 
            padding: 16, 
            background: '#f6ffed', 
            border: '2px solid #52c41a', 
            borderRadius: 8,
            marginBottom: 16 
          }}>
            <div style={{ marginBottom: 12 }}>
              <Tag color="orange">🏢 Nguồn: Nhà cung cấp bên ngoài</Tag>
              <Tag color="green">✅ Đã kiểm nhận</Tag>
            </div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="👤 Người nhận hàng">
                {po.delivery.receivedBy}
              </Descriptions.Item>
              <Descriptions.Item label="📅 Ngày nhận">
                {dayjs(po.delivery.deliveryDate).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="✅ Đánh giá chất lượng">
                <Tag color={
                  po.delivery.qualityStatus === 'ok' ? 'green' : 
                  po.delivery.qualityStatus === 'partial' ? 'orange' : 'red'
                }>
                  {po.delivery.qualityStatus === 'ok' ? 'OK - Đạt yêu cầu' : 
                   po.delivery.qualityStatus === 'partial' ? 'Một phần đạt' : 'NG - Không đạt'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="📦 Số lượng thực tế">
                {po.delivery.actualQuantity ? 'Đã kiểm tra' : 'Chưa có thông tin'}
              </Descriptions.Item>
              {po.delivery.note && (
                <Descriptions.Item label="📝 Ghi chú" span={2}>
                  {po.delivery.note}
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>
        </Card>
      )}

      {po.status !== 'pending' && (
        <Card 
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 20 }}>🚚</span>
                <span>Theo dõi tiến độ giao hàng</span>
              </div>
              {!po.delivery && (user?.role === 'nhan_vien_mh' || user?.role === 'truong_phong_mh' || user?.role === 'admin') && (
                <Button type="primary" size="small" onClick={handleAddTracking}>
                  + Cập nhật tiến độ
                </Button>
              )}
            </div>
          }
          style={{ marginTop: 16 }}
        >
          {trackings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
              <div>Chưa có thông tin theo dõi</div>
              <div style={{ fontSize: 12, marginTop: 8 }}>
                Nhân viên mua hàng sẽ cập nhật tiến độ giao hàng tại đây
              </div>
            </div>
          ) : (
            <div style={{ position: 'relative', paddingLeft: 40 }}>
              {/* Timeline line */}
              <div style={{
                position: 'absolute',
                left: 19,
                top: 20,
                bottom: 20,
                width: 2,
                background: '#e8e8e8',
              }} />
              
              {trackings.map((tracking, index) => (
                <div key={tracking.id} style={{ position: 'relative', marginBottom: 24 }}>
                  {/* Timeline dot */}
                  <div style={{
                    position: 'absolute',
                    left: -28,
                    top: 4,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: tracking.isDelayed ? '#ff4d4f' : '#52c41a',
                    border: '3px solid white',
                    boxShadow: '0 0 0 2px #e8e8e8',
                    zIndex: 1,
                  }} />
                  
                  <div style={{
                    padding: 16,
                    background: tracking.isDelayed ? '#fff2f0' : '#f6ffed',
                    border: `1px solid ${tracking.isDelayed ? '#ffccc7' : '#b7eb8f'}`,
                    borderRadius: 8,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div>
                        <Tag color={getTrackingStatusColor(tracking.status)}>
                          {getTrackingStatusLabel(tracking.status)}
                        </Tag>
                        {tracking.isDelayed && (
                          <Tag color="red">⚠️ Chậm trễ</Tag>
                        )}
                      </div>
                      <span style={{ color: '#999', fontSize: 12 }}>
                        {dayjs(tracking.createdAt).format('DD/MM/YYYY HH:mm')}
                      </span>
                    </div>
                    
                    {tracking.location && (
                      <div style={{ marginBottom: 4 }}>
                        <strong>📍 Vị trí:</strong> {tracking.location}
                      </div>
                    )}
                    
                    {tracking.note && (
                      <div style={{ marginBottom: 4 }}>
                        <strong>📝 Ghi chú:</strong> {tracking.note}
                      </div>
                    )}
                    
                    {tracking.isDelayed && tracking.delayReason && (
                      <div style={{ color: '#ff4d4f', marginTop: 8, padding: 8, background: 'white', borderRadius: 4 }}>
                        <strong>⚠️ Lý do chậm trễ:</strong> {tracking.delayReason}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {payment && (
        <Card 
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20 }}>💰</span>
              <span>
                {user?.role === 'ncc' ? 'Trạng thái thanh toán' : 'Thông tin thanh toán (UNC)'}
              </span>
            </div>
          }
          style={{ marginTop: 16 }}
        >
          <div style={{ 
            padding: 16, 
            background: payment.status === 'paid' ? '#f6ffed' : payment.status === 'pending' ? '#fff7e6' : '#fff1f0',
            border: `2px solid ${payment.status === 'paid' ? '#52c41a' : payment.status === 'pending' ? '#faad14' : '#ff4d4f'}`,
            borderRadius: 8 
          }}>
            {user?.role === 'ncc' ? (
              // Simplified view for supplier
              <>
                <div style={{ marginBottom: 16, textAlign: 'center' }}>
                  <Tag color={payment.status === 'paid' ? 'green' : 'orange'} style={{ fontSize: 16, padding: '8px 16px' }}>
                    {payment.status === 'paid' ? '✅ Đã thanh toán' : '⏳ Đang xử lý thanh toán'}
                  </Tag>
                </div>
                
                <Descriptions bordered column={1} size="small">
                  <Descriptions.Item label="Trạng thái">
                    {payment.status === 'paid' ? 'Đã chuyển khoản' : 'Đang chờ xử lý'}
                  </Descriptions.Item>
                  
                  {payment.paidAt && (
                    <Descriptions.Item label="Ngày thanh toán">
                      <strong style={{ color: '#52c41a' }}>
                        {dayjs(payment.paidAt).format('DD/MM/YYYY')}
                      </strong>
                    </Descriptions.Item>
                  )}
                  
                  <Descriptions.Item label="Phương thức">
                    {payment.paymentMethod === 'bank_transfer' ? '💳 Chuyển khoản ngân hàng' :
                     payment.paymentMethod === 'cash' ? '💵 Tiền mặt' : '📝 Séc'}
                  </Descriptions.Item>
                </Descriptions>
                
                {payment.status === 'paid' && (
                  <div style={{ 
                    marginTop: 16, 
                    padding: 12, 
                    background: '#f6ffed', 
                    border: '1px solid #b7eb8f',
                    borderRadius: 6,
                    textAlign: 'center'
                  }}>
                    <div style={{ color: '#52c41a', fontSize: 14 }}>
                      ✅ Thanh toán đã được hoàn tất
                    </div>
                    <div style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
                      Vui lòng kiểm tra tài khoản ngân hàng của quý công ty
                    </div>
                  </div>
                )}
                
                {payment.status !== 'paid' && (
                  <div style={{ 
                    marginTop: 16, 
                    padding: 12, 
                    background: '#fffbe6', 
                    border: '1px solid #ffe58f',
                    borderRadius: 6,
                    textAlign: 'center'
                  }}>
                    <div style={{ color: '#fa8c16', fontSize: 14 }}>
                      ⏳ Thanh toán đang được xử lý
                    </div>
                    <div style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
                      Chúng tôi sẽ thông báo khi thanh toán hoàn tất
                    </div>
                  </div>
                )}
              </>
            ) : (
              // Full view for internal users
              <>
                <div style={{ marginBottom: 16 }}>
                  <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
                    {payment.uncNumber}
                  </Tag>
                  <Tag color={
                    payment.status === 'paid' ? 'green' : 
                    payment.status === 'approved' ? 'blue' : 
                    payment.status === 'pending' ? 'orange' : 'red'
                  } style={{ fontSize: 14, padding: '4px 12px' }}>
                    {payment.status === 'paid' ? '✅ Đã thanh toán' : 
                     payment.status === 'approved' ? '✅ Đã duyệt' :
                     payment.status === 'pending' ? '⏳ Chờ Kế toán trưởng duyệt' : '❌ Đã hủy'}
                  </Tag>
                </div>

                <Descriptions bordered column={2} size="small">
                  <Descriptions.Item label="Số tiền">
                    <strong style={{ fontSize: 16, color: '#1890ff' }}>
                      {payment.amount.toLocaleString()} ₫
                    </strong>
                  </Descriptions.Item>
                  <Descriptions.Item label="Phương thức">
                    {payment.paymentMethod === 'bank_transfer' ? '💳 Chuyển khoản' :
                     payment.paymentMethod === 'cash' ? '💵 Tiền mặt' : '📝 Séc'}
                  </Descriptions.Item>
                  
                  <Descriptions.Item label="Loại thanh toán">
                    {payment.paymentType === 'prepay' ? 'Trả trước' : 'Trả sau'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Số hóa đơn">
                    {payment.invoiceNumber || '-'}
                  </Descriptions.Item>
                  
                  {payment.vatInvoiceFile && (
                    <Descriptions.Item label="Hóa đơn VAT" span={2}>
                      <a href={payment.vatInvoiceFile} target="_blank" rel="noopener noreferrer" style={{ color: '#1890ff' }}>
                        📄 Xem hóa đơn VAT
                      </a>
                    </Descriptions.Item>
                  )}
                  
                  {payment.deliveryNote && (
                    <Descriptions.Item label="Biên bản giao nhận" span={2}>
                      {payment.deliveryNote}
                    </Descriptions.Item>
                  )}
                  
                  {payment.acceptanceNote && (
                    <Descriptions.Item label="Biên bản nghiệm thu" span={2}>
                      {payment.acceptanceNote}
                    </Descriptions.Item>
                  )}
                  
                  {payment.approvedAt && (
                    <>
                      <Descriptions.Item label="Người duyệt">
                        Kế toán trưởng
                      </Descriptions.Item>
                      <Descriptions.Item label="Ngày duyệt">
                        {dayjs(payment.approvedAt).format('DD/MM/YYYY HH:mm')}
                      </Descriptions.Item>
                    </>
                  )}
                  
                  {payment.paidAt && (
                    <Descriptions.Item label="Ngày thanh toán" span={2}>
                      <strong style={{ color: '#52c41a' }}>
                        {dayjs(payment.paidAt).format('DD/MM/YYYY HH:mm')}
                      </strong>
                    </Descriptions.Item>
                  )}

                  {payment.note && (
                    <Descriptions.Item label="Ghi chú" span={2}>
                      {payment.note}
                    </Descriptions.Item>
                  )}
                </Descriptions>
                
                {payment.status === 'pending' && user?.role === 'ke_toan' && (
                  <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                    <Button 
                      type="primary" 
                      size="large"
                      onClick={() => handleApprovePayment('approved')}
                      style={{ flex: 1 }}
                    >
                      ✅ Phê duyệt thanh toán
                    </Button>
                    <Button 
                      danger
                      size="large"
                      onClick={() => handleApprovePayment('rejected')}
                      style={{ flex: 1 }}
                    >
                      ❌ Từ chối
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>
      )}

      <Card title="Chi tiết vật tư" style={{ marginTop: 16 }}>
        <Table
          columns={columns}
          dataSource={po.items}
          rowKey="id"
          pagination={false}
        />
      </Card>

      <Modal
        title="💰 Tạo Ủy nhiệm chi (UNC)"
        open={paymentModalVisible}
        onCancel={() => setPaymentModalVisible(false)}
        onOk={() => paymentForm.submit()}
        width={700}
        okText="Tạo UNC"
        cancelText="Hủy"
      >
        {documentCheck && !documentCheck.canProceed && (
          <div style={{ 
            marginBottom: 16, 
            padding: 12, 
            background: '#fff7e6', 
            border: '1px solid #ffd591',
            borderRadius: 6 
          }}>
            <div style={{ fontWeight: 'bold', color: '#fa8c16', marginBottom: 8 }}>
              ⚠️ Cảnh báo: Thiếu chứng từ
            </div>
            <ul style={{ margin: 0, paddingLeft: 20, color: '#666' }}>
              {documentCheck.missingRequired.map((doc, idx) => (
                <li key={idx}>{doc}</li>
              ))}
            </ul>
          </div>
        )}

        {documentCheck && documentCheck.canProceed && (
          <div style={{ 
            marginBottom: 16, 
            padding: 12, 
            background: '#f6ffed', 
            border: '1px solid #b7eb8f',
            borderRadius: 6 
          }}>
            <div style={{ fontWeight: 'bold', color: '#52c41a', marginBottom: 8 }}>
              ✅ Đã đủ chứng từ
            </div>
            <ul style={{ margin: 0, paddingLeft: 20, color: '#666', fontSize: 12 }}>
              {Object.entries(documentCheck.documents).map(([key, doc]) => (
                <li key={key}>
                  {doc.exists ? '✅' : '❌'} {doc.name}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Form
          form={paymentForm}
          layout="vertical"
          onFinish={handlePaymentSubmit}
        >
          <Form.Item
            name="amount"
            label="Số tiền thanh toán (₫)"
            rules={[{ required: true, message: 'Vui lòng nhập số tiền' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item
            name="paymentMethod"
            label="Phương thức thanh toán"
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value="bank_transfer">💳 Chuyển khoản</Select.Option>
              <Select.Option value="cash">💵 Tiền mặt</Select.Option>
              <Select.Option value="check">📝 Séc</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="paymentType"
            label="Loại thanh toán"
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value="prepay">Trả trước (Prepay)</Select.Option>
              <Select.Option value="postpay">Trả sau (Postpay)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Hóa đơn VAT"
            required
            extra="Upload file hóa đơn VAT (PDF, JPG, PNG). Trong demo có thể bỏ qua."
          >
            <Upload
              fileList={vatInvoiceFileList}
              onChange={({ fileList }) => setVatInvoiceFileList(fileList)}
              beforeUpload={(file) => {
                // Validate file type
                const isValidType = file.type === 'application/pdf' || 
                                   file.type === 'image/jpeg' || 
                                   file.type === 'image/png';
                if (!isValidType) {
                  message.error('Chỉ chấp nhận file PDF, JPG, PNG!');
                  return false;
                }
                
                // Validate file size (max 5MB)
                const isLt5M = file.size / 1024 / 1024 < 5;
                if (!isLt5M) {
                  message.error('File phải nhỏ hơn 5MB!');
                  return false;
                }
                
                // For demo: convert to base64 or use fake URL
                const fakeUrl = `https://demo-storage.com/invoices/${file.name}`;
                paymentForm.setFieldsValue({ vatInvoiceFile: fakeUrl });
                message.success(`File ${file.name} đã được chọn (Demo mode)`);
                
                // Prevent actual upload
                return false;
              }}
              onRemove={() => {
                paymentForm.setFieldsValue({ vatInvoiceFile: '' });
                setVatInvoiceFileList([]);
              }}
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>📄 Chọn file hóa đơn VAT</Button>
            </Upload>
            
            <div style={{ marginTop: 8 }}>
              <span style={{ fontSize: 12, color: '#999' }}>Hoặc nhập URL trực tiếp:</span>
            </div>
          </Form.Item>

          <Form.Item
            name="vatInvoiceFile"
            rules={[{ required: true, message: 'Vui lòng upload hoặc nhập URL hóa đơn VAT' }]}
            style={{ marginTop: -16 }}
          >
            <Input 
              prefix="🔗"
              placeholder="https://example.com/invoice.pdf" 
              disabled={vatInvoiceFileList.length > 0}
            />
          </Form.Item>

          <Form.Item
            name="invoiceNumber"
            label="Số hóa đơn"
          >
            <Input placeholder="VD: HD001" />
          </Form.Item>

          <Form.Item
            name="deliveryNote"
            label="Biên bản giao nhận"
          >
            <Input.TextArea 
              rows={2} 
              placeholder="Ghi chú về biên bản giao nhận (tự động lấy từ delivery)" 
            />
          </Form.Item>

          <Form.Item
            name="acceptanceNote"
            label="Biên bản nghiệm thu"
          >
            <Input.TextArea 
              rows={2} 
              placeholder="Ghi chú về nghiệm thu chất lượng" 
            />
          </Form.Item>

          <Form.Item
            name="note"
            label="Ghi chú thêm"
          >
            <Input.TextArea rows={2} placeholder="Ghi chú bổ sung" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={approveStatus === 'approved' ? 'Xác nhận phê duyệt' : 'Xác nhận từ chối'}
        open={approveModalVisible}
        onCancel={() => setApproveModalVisible(false)}
        onOk={handleApproveSubmit}
        confirmLoading={approving}
        width={600}
        okText={approveStatus === 'approved' ? 'Phê duyệt' : 'Từ chối'}
        cancelText="Hủy"
      >
        <p>Bạn có chắc chắn muốn {approveStatus === 'approved' ? 'phê duyệt' : 'từ chối'} đơn hàng này?</p>
        
        {approveStatus === 'approved' && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Chữ ký số (Demo) <span style={{ color: 'red' }}>*</span>
            </label>
            <Input
              ref={signatureInputRef}
              key="signature-input"
              autoFocus
              placeholder="Nhập tên của bạn để ký (VD: Nguyễn Văn A)"
              defaultValue=""
              onChange={(e) => setSignature(e.target.value)}
              style={{ marginBottom: 8 }}
            />
            <div style={{ fontSize: 12, color: '#999' }}>
              💡 Đây là chữ ký demo. Trong production sẽ tích hợp chữ ký số thật từ VNPT/Viettel/FPT CA
            </div>
          </div>
        )}
        
        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Ghi chú</label>
          <Input.TextArea
            placeholder="Nhập ghi chú (không bắt buộc)"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
      </Modal>

      <Modal
        title="Cập nhật tiến độ giao hàng"
        open={trackingModalVisible}
        onCancel={() => setTrackingModalVisible(false)}
        onOk={() => trackingForm.submit()}
        width={600}
        okText="Cập nhật"
        cancelText="Hủy"
      >
        <Form
          form={trackingForm}
          layout="vertical"
          onFinish={handleTrackingSubmit}
        >
          <Form.Item
            name="status"
            label="Trạng thái"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
          >
            <Select>
              <Select.Option value="confirmed">✅ Đã xác nhận đơn</Select.Option>
              <Select.Option value="preparing">📦 Đang chuẩn bị hàng</Select.Option>
              <Select.Option value="shipped">🚛 Đã xuất kho</Select.Option>
              <Select.Option value="in_transit">🚚 Đang vận chuyển</Select.Option>
              <Select.Option value="arrived">✅ Đã đến nơi</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="location"
            label="Vị trí hiện tại"
          >
            <Input placeholder="VD: Kho NCC, Đang trên đường, Đã đến công trường" />
          </Form.Item>

          <Form.Item
            name="note"
            label="Ghi chú"
          >
            <Input.TextArea rows={3} placeholder="Thông tin bổ sung về tiến độ giao hàng" />
          </Form.Item>

          <Form.Item
            name="isDelayed"
            valuePropName="checked"
          >
            <Checkbox>⚠️ Đánh dấu là chậm trễ</Checkbox>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.isDelayed !== currentValues.isDelayed}
          >
            {({ getFieldValue }) =>
              getFieldValue('isDelayed') ? (
                <Form.Item
                  name="delayReason"
                  label="Lý do chậm trễ"
                  rules={[{ required: true, message: 'Vui lòng nhập lý do' }]}
                >
                  <Input.TextArea 
                    rows={2} 
                    placeholder="VD: Thời tiết xấu, NCC chậm xuất hàng, vận chuyển gặp sự cố" 
                  />
                </Form.Item>
              ) : null
            }
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default PODetail;
