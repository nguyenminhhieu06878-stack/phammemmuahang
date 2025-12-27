import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Export data to Excel
export const exportToExcel = (data, filename = 'export.xlsx', sheetName = 'Sheet1') => {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Generate buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
    // Save file
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, filename);
    
    return true;
  } catch (error) {
    console.error('Export to Excel error:', error);
    return false;
  }
};

// Export multiple sheets
export const exportMultipleSheets = (sheets, filename = 'export.xlsx') => {
  try {
    const workbook = XLSX.utils.book_new();
    
    sheets.forEach(({ data, sheetName }) => {
      const worksheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, filename);
    
    return true;
  } catch (error) {
    console.error('Export multiple sheets error:', error);
    return false;
  }
};

// Format data for export
export const formatRequestsForExport = (requests) => {
  return requests.map(req => ({
    'Mã yêu cầu': req.code,
    'Dự án': req.project?.name || '',
    'Người tạo': req.createdBy?.name || '',
    'Số lượng VT': req.items?.length || 0,
    'Ưu tiên': req.priority === 'urgent' ? 'Khẩn cấp' : req.priority === 'high' ? 'Cao' : 'Bình thường',
    'Trạng thái': req.status === 'pending' ? 'Chờ duyệt' : req.status === 'approved' ? 'Đã duyệt' : req.status === 'rejected' ? 'Từ chối' : 'Đang xử lý',
    'Ngày tạo': new Date(req.createdAt).toLocaleDateString('vi-VN'),
  }));
};

export const formatPOsForExport = (pos) => {
  return pos.map(po => ({
    'Mã PO': po.code,
    'Dự án': po.project?.name || '',
    'Nhà cung cấp': po.supplier?.companyName || '',
    'Tổng giá trị': po.grandTotal,
    'Ngày giao dự kiến': new Date(po.deliveryDate).toLocaleDateString('vi-VN'),
    'Trạng thái': po.status === 'pending' ? 'Chờ duyệt' : po.status === 'approved' ? 'Đã duyệt' : po.status === 'sent' ? 'Đã gửi' : po.status === 'in_transit' ? 'Đang giao' : po.status === 'delivered' ? 'Đã giao' : po.status === 'completed' ? 'Hoàn thành' : 'Đã hủy',
    'Ngày tạo': new Date(po.createdAt).toLocaleDateString('vi-VN'),
  }));
};

// Export PO with signatures
export const exportPOWithSignatures = (po) => {
  const poInfo = {
    'Mã PO': po.code,
    'Dự án': po.project?.name || '',
    'Nhà cung cấp': po.supplier?.companyName || '',
    'Địa chỉ giao hàng': po.deliveryAddress,
    'Ngày giao dự kiến': new Date(po.deliveryDate).toLocaleDateString('vi-VN'),
    'Điều kiện thanh toán': po.paymentTerms,
    'Tổng giá trị': po.totalAmount.toLocaleString('vi-VN') + ' ₫',
    'VAT (10%)': po.vatAmount.toLocaleString('vi-VN') + ' ₫',
    'Tổng cộng': po.grandTotal.toLocaleString('vi-VN') + ' ₫',
  };

  const items = po.items?.map(item => ({
    'Mã VT': item.material?.code || '',
    'Tên vật tư': item.material?.name || '',
    'Số lượng': item.quantity,
    'Đơn vị': item.material?.unit || '',
    'Đơn giá': item.unitPrice.toLocaleString('vi-VN') + ' ₫',
    'Thành tiền': item.amount.toLocaleString('vi-VN') + ' ₫',
  })) || [];

  const approvals = po.approvals?.map(approval => ({
    'Cấp duyệt': `Cấp ${approval.level}`,
    'Người duyệt': approval.approver?.name || 'Chưa duyệt',
    'Chữ ký': approval.signature || '',
    'Trạng thái': approval.status === 'approved' ? 'Đã duyệt' : approval.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt',
    'Thời gian': approval.approvedAt ? new Date(approval.approvedAt).toLocaleString('vi-VN') : '',
    'Ghi chú': approval.comment || '',
  })) || [];

  const sheets = [
    { sheetName: 'Thông tin PO', data: [poInfo] },
    { sheetName: 'Chi tiết vật tư', data: items },
    { sheetName: 'Phê duyệt & Chữ ký', data: approvals },
  ];

  return sheets;
};

export const formatSuppliersForExport = (suppliers) => {
  return suppliers.map((supplier, index) => ({
    'Hạng': index + 1,
    'Mã NCC': supplier.code,
    'Tên công ty': supplier.companyName,
    'Mã số thuế': supplier.taxCode || '',
    'Người liên hệ': supplier.contactPerson || '',
    'Điện thoại': supplier.phone,
    'Email': supplier.email,
    'Đánh giá': supplier.rating.toFixed(1),
    'Trạng thái': supplier.status === 'active' ? 'Hoạt động' : supplier.status === 'blacklist' ? 'Blacklist' : 'Ngừng',
  }));
};

export const formatDashboardForExport = (stats, spendingByProject, spendingByCategory, topSuppliers) => {
  const sheets = [
    {
      sheetName: 'Tổng quan',
      data: [
        { 'Chỉ số': 'Tổng dự án', 'Giá trị': stats.totalProjects || 0 },
        { 'Chỉ số': 'Tổng yêu cầu VT', 'Giá trị': stats.totalRequests || 0 },
        { 'Chỉ số': 'Yêu cầu chờ duyệt', 'Giá trị': stats.pendingRequests || 0 },
        { 'Chỉ số': 'Tổng đơn hàng', 'Giá trị': stats.totalPOs || 0 },
        { 'Chỉ số': 'Đơn hàng chờ duyệt', 'Giá trị': stats.pendingPOs || 0 },
        { 'Chỉ số': 'Tổng chi phí (₫)', 'Giá trị': stats.totalSpent || 0 },
      ],
    },
    {
      sheetName: 'Chi phí theo dự án',
      data: Object.entries(spendingByProject).map(([name, value]) => ({
        'Dự án': name,
        'Chi phí (₫)': value,
      })),
    },
    {
      sheetName: 'Chi phí theo nhóm VT',
      data: Object.entries(spendingByCategory).map(([name, value]) => ({
        'Nhóm vật tư': name,
        'Chi phí (₫)': value,
      })),
    },
    {
      sheetName: 'Top NCC',
      data: topSuppliers.map((supplier, index) => ({
        'Hạng': index + 1,
        'Nhà cung cấp': supplier.name,
        'Tổng giá trị (₫)': supplier.totalAmount,
      })),
    },
  ];
  
  return sheets;
};
