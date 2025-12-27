import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Table, Tag, Button, Spin, Space, Modal, Input, message } from 'antd';
import { CheckOutlined, CloseOutlined, ExportOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { getRequest, approveRequest, checkStock, createStockIssue, getStockIssueByRequest, confirmReceiveStock } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { canApproveRequest, getApprovalLevelLabel } from '../utils/permissions';
import dayjs from 'dayjs';

function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(null);
  const [approving, setApproving] = useState(false);
  const [comment, setComment] = useState('');
  const [stockAnalysis, setStockAnalysis] = useState(null);
  const [stockIssue, setStockIssue] = useState(null);
  const [issuingStock, setIssuingStock] = useState(false);
  const [receivingStock, setReceivingStock] = useState(false);

  useEffect(() => {
    loadRequest();
  }, [id]);

  const loadRequest = async () => {
    try {
      const { data } = await getRequest(id);
      setRequest(data);
      
      // Check stock if approved OR processing
      if (data.status === 'approved' || data.status === 'processing') {
        try {
          const stockRes = await checkStock({ requestId: data.id });
          setStockAnalysis(stockRes.data);
        } catch (error) {
          console.error('Check stock error:', error);
        }

        // Check if stock issue exists
        try {
          const issueRes = await getStockIssueByRequest(data.id);
          setStockIssue(issueRes.data);
        } catch (error) {
          // No stock issue yet
        }
      }
    } catch (error) {
      console.error('Load request error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (status) => {
    Modal.confirm({
      title: status === 'approved' ? 'Xác nhận phê duyệt' : 'Xác nhận từ chối',
      content: (
        <div>
          <p>Bạn có chắc chắn muốn {status === 'approved' ? 'phê duyệt' : 'từ chối'} yêu cầu này?</p>
          <Input.TextArea
            placeholder="Nhập ghi chú (không bắt buộc)"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
      ),
      onOk: async () => {
        try {
          setApproving(true);
          await approveRequest(id, { status, comment });
          message.success(`${status === 'approved' ? 'Phê duyệt' : 'Từ chối'} thành công`);
          loadRequest();
        } catch (error) {
          message.error('Có lỗi xảy ra');
        } finally {
          setApproving(false);
          setComment('');
        }
      },
    });
  };

  const getPendingApprovalLevel = () => {
    if (!request?.approvals) return null;
    const pendingApproval = request.approvals.find(a => a.status === 'pending');
    return pendingApproval?.level;
  };

  const canUserApprove = () => {
    console.log('=== DEBUG APPROVAL ===');
    console.log('Request status:', request?.status);
    console.log('User role:', user?.role);
    console.log('Approvals:', request?.approvals);
    
    if (request?.status !== 'pending') {
      console.log('❌ Request status is not pending');
      return false;
    }
    
    const pendingLevel = getPendingApprovalLevel();
    console.log('Pending level:', pendingLevel);
    
    const canApprove = pendingLevel && canApproveRequest(user?.role, pendingLevel);
    console.log('Can approve:', canApprove);
    
    return canApprove;
  };

  const handleIssueStock = async () => {
    if (!stockAnalysis) return;

    const itemsToIssue = stockAnalysis.items
      .filter(item => item.fulfillQuantity > 0)
      .map(item => ({
        materialId: item.materialId,
        quantity: item.fulfillQuantity,
      }));

    if (itemsToIssue.length === 0) {
      message.error('Không có vật tư nào có thể xuất kho');
      return;
    }

    Modal.confirm({
      title: 'Xác nhận xuất kho nội bộ',
      width: 600,
      content: (
        <div>
          <p style={{ fontSize: 14, marginBottom: 16 }}>Bạn có chắc chắn muốn xuất kho cho yêu cầu này?</p>
          
          <Table
            size="small"
            columns={[
              { title: 'Vật tư', dataIndex: 'materialName', width: '40%' },
              { 
                title: '✅ Xuất kho', 
                dataIndex: 'fulfillQuantity', 
                render: (qty, record) => (
                  <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
                    {qty} {record.materialUnit}
                  </span>
                )
              },
              { 
                title: '⚠️ Cần mua thêm', 
                dataIndex: 'needToBuy', 
                render: (qty, record) => qty > 0 ? (
                  <span style={{ color: '#fa8c16', fontWeight: 'bold' }}>
                    {qty} {record.materialUnit}
                  </span>
                ) : (
                  <span style={{ color: '#52c41a' }}>-</span>
                )
              },
            ]}
            dataSource={stockAnalysis.items}
            pagination={false}
            rowKey="materialId"
          />
          
          {!stockAnalysis.canFulfillFully && (
            <div style={{ 
              marginTop: 16, 
              padding: 16, 
              background: '#fff7e6', 
              border: '2px solid #ffa940', 
              borderRadius: 8,
              fontSize: 14
            }}>
              <div style={{ marginBottom: 8 }}>
                <strong style={{ fontSize: 16 }}>⚠️ LƯU Ý QUAN TRỌNG:</strong>
              </div>
              <div style={{ lineHeight: 1.6 }}>
                • Kho chỉ đủ xuất <strong style={{ color: '#52c41a' }}>một phần</strong> vật tư<br/>
                • Sau khi xuất kho, bạn <strong style={{ color: '#fa8c16' }}>BẮT BUỘC</strong> phải tạo RFQ để mua phần còn thiếu<br/>
                • Button "Tạo RFQ (Mua phần thiếu)" sẽ xuất hiện sau khi xuất kho
              </div>
            </div>
          )}
        </div>
      ),
      onOk: async () => {
        try {
          setIssuingStock(true);
          await createStockIssue({
            requestId: request.id,
            items: itemsToIssue,
            note: 'Xuất kho nội bộ',
          });
          message.success('Xuất kho thành công!');
          loadRequest();
        } catch (error) {
          message.error(error.response?.data?.error || 'Có lỗi khi xuất kho');
        } finally {
          setIssuingStock(false);
        }
      },
    });
  };

  const handleReceiveStock = async () => {
    if (!stockIssue) return;

    Modal.confirm({
      title: '✅ Xác nhận đã nhận hàng từ kho nội bộ',
      width: 500,
      content: (
        <div>
          <div style={{ 
            padding: 12, 
            background: '#e6f7ff', 
            border: '1px solid #91d5ff', 
            borderRadius: 6,
            marginBottom: 16 
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: 8 }}>
              📦 Phiếu xuất kho: {stockIssue.code}
            </div>
            <div style={{ fontSize: 13, color: '#666' }}>
              🏢 Nguồn: Kho nội bộ công ty<br/>
              👤 Người xuất: {stockIssue.issuer.name}<br/>
              📅 Ngày xuất: {dayjs(stockIssue.issuedAt).format('DD/MM/YYYY HH:mm')}
            </div>
          </div>
          
          <p style={{ marginBottom: 8 }}>
            Bạn xác nhận đã nhận đầy đủ vật tư từ kho nội bộ?
          </p>
          
          <div style={{ 
            padding: 12, 
            background: '#fff7e6', 
            border: '1px solid #ffd591', 
            borderRadius: 6,
            fontSize: 13
          }}>
            <strong>⚠️ Lưu ý:</strong> Sau khi xác nhận, tồn kho sẽ tự động được trừ.
          </div>
        </div>
      ),
      onOk: async () => {
        try {
          setReceivingStock(true);
          await confirmReceiveStock(stockIssue.id, {
            note: 'Đã nhận hàng tại công trường',
          });
          message.success('Xác nhận nhận hàng thành công! Tồn kho đã được cập nhật.');
          loadRequest();
        } catch (error) {
          message.error(error.response?.data?.error || 'Có lỗi khi xác nhận');
        } finally {
          setReceivingStock(false);
        }
      },
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!request) {
    return <Card>Không tìm thấy yêu cầu</Card>;
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
      title: 'Ghi chú',
      dataIndex: 'note',
    },
  ];

  return (
    <div>
      <Card
        title={`Chi tiết yêu cầu ${request.code}`}
        extra={
          <Space>
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
            {request.status === 'approved' && 
             !request.rfq && 
             !stockIssue && 
             stockAnalysis && 
             stockAnalysis.items.some(item => item.fulfillQuantity > 0) &&
             (user?.role === 'truong_phong_mh' || user?.role === 'admin') && (
              <Button
                type="primary"
                icon={<ExportOutlined />}
                onClick={handleIssueStock}
                loading={issuingStock}
                style={{ background: '#52c41a', borderColor: '#52c41a' }}
              >
                Xuất kho nội bộ
              </Button>
            )}
            {stockIssue && stockIssue.status === 'pending' && user?.role === 'giam_sat' && (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={handleReceiveStock}
                loading={receivingStock}
                size="large"
                style={{ background: '#1890ff', borderColor: '#1890ff' }}
              >
                ✅ Xác nhận đã nhận hàng từ kho
              </Button>
            )}
            {stockIssue && stockIssue.status === 'completed' && (
              <Tag color="green">✓ Đã nhận hàng: {stockIssue.code}</Tag>
            )}
            {request.status === 'approved' && 
             !request.rfq && 
             !stockIssue && 
             stockAnalysis && 
             !stockAnalysis.canFulfillFully && (
              <Button type="primary" onClick={() => navigate(`/rfq/new?requestId=${request.id}`)}>
                Tạo RFQ (Mua thêm)
              </Button>
            )}
            {(() => {
              // Tính toán xem có cần mua thêm không
              let needPurchase = false;
              if (stockIssue && request.items) {
                for (const item of request.items) {
                  const stock = item.material?.stock || 0;
                  const requested = item.quantity;
                  if (requested > stock) {
                    needPurchase = true;
                    break;
                  }
                }
              }
              
              const shouldShow = (request.status === 'approved' || request.status === 'processing') && 
                                 !request.rfq && 
                                 stockIssue && 
                                 needPurchase &&
                                 (user?.role === 'truong_phong_mh' || user?.role === 'admin');
              
              console.log('=== DEBUG BUTTON TẠO RFQ ===');
              console.log('request.status:', request.status);
              console.log('request.rfq:', request.rfq);
              console.log('stockIssue:', stockIssue);
              console.log('needPurchase:', needPurchase);
              console.log('user.role:', user?.role);
              console.log('shouldShow:', shouldShow);
              
              return shouldShow && (
                <Button 
                  type="primary" 
                  onClick={() => navigate(`/rfq/new?requestId=${request.id}`)}
                  style={{ background: '#fa8c16', borderColor: '#fa8c16' }}
                >
                  🛒 Tạo RFQ (Mua phần thiếu)
                </Button>
              );
            })()}
            <Button onClick={() => navigate('/requests')}>Quay lại</Button>
          </Space>
        }
      >
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Mã yêu cầu">{request.code}</Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag color={
              request.status === 'approved' ? 'green' : 
              request.status === 'rejected' ? 'red' : 
              request.status === 'processing' ? 'blue' : 
              'orange'
            }>
              {
                request.status === 'approved' ? 'Đã duyệt' : 
                request.status === 'rejected' ? 'Từ chối' : 
                request.status === 'processing' ? 'Đang xử lý' : 
                'Chờ duyệt'
              }
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Dự án">{request.project.name}</Descriptions.Item>
          <Descriptions.Item label="Người tạo">{request.createdBy.name}</Descriptions.Item>
          <Descriptions.Item label="Ngày tạo">
            {dayjs(request.createdAt).format('DD/MM/YYYY HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="Độ ưu tiên">{request.priority}</Descriptions.Item>
          <Descriptions.Item label="Mô tả" span={2}>
            {request.description || '-'}
          </Descriptions.Item>
        </Descriptions>

        {request.approvals && request.approvals.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <h4>Lịch sử phê duyệt:</h4>
            {request.approvals.map((approval) => (
              <div key={approval.id} style={{ marginBottom: 8 }}>
                <Tag color={approval.status === 'approved' ? 'green' : approval.status === 'rejected' ? 'red' : 'orange'}>
                  Cấp {approval.level} - {getApprovalLevelLabel(approval.level)}
                </Tag>
                <span>
                  {approval.status === 'approved' ? 'Đã duyệt' : approval.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt'}
                  {approval.approver && ` bởi ${approval.approver.name}`}
                  {approval.approvedAt && ` - ${dayjs(approval.approvedAt).format('DD/MM/YYYY HH:mm')}`}
                </span>
                {approval.comment && <div style={{ marginLeft: 24, color: '#666' }}>Ghi chú: {approval.comment}</div>}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Danh sách vật tư" style={{ marginTop: 16 }}>
        {stockAnalysis && (
          <div style={{ marginBottom: 16, padding: 12, background: stockAnalysis.canFulfillFully ? '#f6ffed' : '#fff7e6', border: `1px solid ${stockAnalysis.canFulfillFully ? '#b7eb8f' : '#ffd591'}`, borderRadius: 4 }}>
            <strong>📦 Phân tích tồn kho:</strong>
            <ul style={{ marginTop: 8, marginBottom: 0 }}>
              {stockAnalysis.items.map(item => (
                <li key={item.materialId}>
                  <strong>{item.materialName}</strong>: 
                  Yêu cầu {item.requested} {item.materialUnit}, 
                  Tồn kho {item.available} {item.materialUnit}
                  {item.canFulfill ? (
                    <span style={{ color: '#52c41a', marginLeft: 8 }}>✓ Đủ hàng</span>
                  ) : (
                    <span style={{ color: '#fa8c16', marginLeft: 8 }}>
                      ⚠️ Xuất kho: {item.fulfillQuantity}, Cần mua: {item.needToBuy} {item.materialUnit}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            {stockAnalysis.canFulfillFully ? (
              <div style={{ marginTop: 8, color: '#52c41a' }}>
                ✓ Có thể xuất kho đầy đủ, không cần mua thêm
              </div>
            ) : (
              <div style={{ marginTop: 8, color: '#fa8c16' }}>
                ⚠️ Không đủ hàng tồn kho, cần mua thêm từ nhà cung cấp
              </div>
            )}
          </div>
        )}
        
        {stockIssue && (
          <div style={{ 
            marginBottom: 16, 
            padding: 16, 
            background: stockIssue.status === 'completed' ? '#f6ffed' : '#e6f7ff', 
            border: `2px solid ${stockIssue.status === 'completed' ? '#52c41a' : '#1890ff'}`, 
            borderRadius: 8 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ 
                fontSize: 16, 
                fontWeight: 'bold',
                color: stockIssue.status === 'completed' ? '#52c41a' : '#1890ff'
              }}>
                {stockIssue.status === 'completed' ? '✅ Đã nhận hàng từ kho nội bộ' : '📦 Đang vận chuyển từ kho nội bộ'}
              </span>
              <Tag color={stockIssue.status === 'completed' ? 'green' : 'blue'} style={{ marginLeft: 12 }}>
                {stockIssue.code}
              </Tag>
            </div>
            
            <div style={{ 
              padding: 12, 
              background: 'white', 
              borderRadius: 4,
              marginBottom: 8
            }}>
              <div style={{ marginBottom: 8 }}>
                <strong>🏢 Nguồn hàng:</strong> <Tag color="blue">Kho nội bộ công ty</Tag>
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>👤 Người xuất kho:</strong> {stockIssue.issuer.name}
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>📅 Ngày xuất:</strong> {dayjs(stockIssue.issuedAt).format('DD/MM/YYYY HH:mm')}
              </div>
              {stockIssue.status === 'completed' && stockIssue.receiver && (
                <>
                  <div style={{ marginBottom: 8, color: '#52c41a' }}>
                    <strong>✅ Người nhận:</strong> {stockIssue.receiver.name}
                  </div>
                  <div style={{ color: '#52c41a' }}>
                    <strong>✅ Ngày nhận:</strong> {dayjs(stockIssue.receivedAt).format('DD/MM/YYYY HH:mm')}
                  </div>
                </>
              )}
            </div>
            
            {stockIssue.status === 'pending' && (
              <div style={{ 
                padding: 12, 
                background: '#fffbe6', 
                border: '2px solid #faad14', 
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <span style={{ fontSize: 20 }}>⏳</span>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#fa8c16' }}>
                    Chờ Giám sát xác nhận đã nhận hàng tại công trường
                  </div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                    Sau khi xác nhận, tồn kho sẽ tự động được trừ
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        <Table
          columns={columns}
          dataSource={request.items}
          rowKey="id"
          pagination={false}
        />
      </Card>
    </div>
  );
}

export default RequestDetail;
