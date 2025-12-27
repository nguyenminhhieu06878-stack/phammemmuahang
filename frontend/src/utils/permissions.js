// Role-based permissions utility

export const ROLES = {
  ADMIN: 'admin',
  TRUONG_PHONG_MH: 'truong_phong_mh',
  NHAN_VIEN_MH: 'nhan_vien_mh',
  KE_TOAN: 'ke_toan',
  GIAM_DOC: 'giam_doc',
  GIAM_SAT: 'giam_sat',
  NCC: 'ncc',
  PHONG_OS: 'phong_os',
};

export const PERMISSIONS = {
  // Material Request permissions
  CREATE_REQUEST: [ROLES.NHAN_VIEN_MH, ROLES.GIAM_SAT, ROLES.ADMIN],
  VIEW_REQUEST: [ROLES.ADMIN, ROLES.TRUONG_PHONG_MH, ROLES.NHAN_VIEN_MH, ROLES.KE_TOAN, ROLES.GIAM_DOC, ROLES.GIAM_SAT],
  APPROVE_REQUEST_L1: [ROLES.TRUONG_PHONG_MH, ROLES.ADMIN],
  APPROVE_REQUEST_L2: [ROLES.KE_TOAN, ROLES.ADMIN],
  APPROVE_REQUEST_L3: [ROLES.GIAM_DOC, ROLES.ADMIN],

  // RFQ permissions
  CREATE_RFQ: [ROLES.TRUONG_PHONG_MH, ROLES.ADMIN],
  VIEW_RFQ: [ROLES.ADMIN, ROLES.TRUONG_PHONG_MH, ROLES.NHAN_VIEN_MH],
  SEND_RFQ: [ROLES.TRUONG_PHONG_MH, ROLES.ADMIN],

  // Quotation permissions
  CREATE_QUOTATION: [ROLES.NCC, ROLES.ADMIN],
  VIEW_QUOTATION: [ROLES.ADMIN, ROLES.TRUONG_PHONG_MH, ROLES.NHAN_VIEN_MH, ROLES.NCC],
  SELECT_QUOTATION: [ROLES.TRUONG_PHONG_MH, ROLES.ADMIN],

  // PO permissions
  CREATE_PO: [ROLES.TRUONG_PHONG_MH, ROLES.ADMIN],
  VIEW_PO: [ROLES.ADMIN, ROLES.TRUONG_PHONG_MH, ROLES.NHAN_VIEN_MH, ROLES.KE_TOAN, ROLES.GIAM_DOC],
  APPROVE_PO_L1: [ROLES.TRUONG_PHONG_MH, ROLES.ADMIN],
  APPROVE_PO_L2: [ROLES.KE_TOAN, ROLES.ADMIN],
  APPROVE_PO_L3: [ROLES.GIAM_DOC, ROLES.ADMIN],
  SEND_PO: [ROLES.TRUONG_PHONG_MH, ROLES.ADMIN],

  // Delivery permissions
  CHECK_DELIVERY: [ROLES.GIAM_SAT, ROLES.ADMIN],
  VIEW_DELIVERY: [ROLES.ADMIN, ROLES.TRUONG_PHONG_MH, ROLES.KE_TOAN, ROLES.GIAM_SAT],

  // Payment permissions
  MANAGE_PAYMENT: [ROLES.KE_TOAN, ROLES.ADMIN],
  VIEW_PAYMENT: [ROLES.ADMIN, ROLES.KE_TOAN, ROLES.GIAM_DOC],

  // Master data permissions
  MANAGE_USERS: [ROLES.ADMIN],
  VIEW_USERS: [ROLES.ADMIN],
  MANAGE_PROJECTS: [ROLES.ADMIN],
  VIEW_PROJECTS: [ROLES.ADMIN, ROLES.GIAM_DOC, ROLES.TRUONG_PHONG_MH, ROLES.PHONG_OS],
  MANAGE_MATERIALS: [ROLES.ADMIN],
  VIEW_MATERIALS: [ROLES.ADMIN, ROLES.TRUONG_PHONG_MH, ROLES.NHAN_VIEN_MH, ROLES.GIAM_SAT, ROLES.PHONG_OS],
  MANAGE_SUPPLIERS: [ROLES.ADMIN, ROLES.TRUONG_PHONG_MH],
  VIEW_SUPPLIERS: [ROLES.ADMIN, ROLES.TRUONG_PHONG_MH, ROLES.NHAN_VIEN_MH],
  MANAGE_QUOTAS: [ROLES.ADMIN, ROLES.PHONG_OS],
  VIEW_QUOTAS: [ROLES.ADMIN, ROLES.PHONG_OS, ROLES.GIAM_SAT],

  // Dashboard permissions
  VIEW_DASHBOARD: [ROLES.ADMIN, ROLES.TRUONG_PHONG_MH, ROLES.NHAN_VIEN_MH, ROLES.KE_TOAN, ROLES.GIAM_DOC, ROLES.GIAM_SAT],
  VIEW_FULL_DASHBOARD: [ROLES.ADMIN, ROLES.GIAM_DOC, ROLES.TRUONG_PHONG_MH],
};

export const hasPermission = (userRole, permission) => {
  if (!userRole || !permission) return false;
  const allowedRoles = PERMISSIONS[permission];
  return allowedRoles ? allowedRoles.includes(userRole) : false;
};

export const canApproveRequest = (userRole, level) => {
  const permissionMap = {
    1: PERMISSIONS.APPROVE_REQUEST_L1,
    2: PERMISSIONS.APPROVE_REQUEST_L2,
    3: PERMISSIONS.APPROVE_REQUEST_L3,
  };
  return permissionMap[level]?.includes(userRole) || false;
};

export const canApprovePO = (userRole, level) => {
  const permissionMap = {
    1: PERMISSIONS.APPROVE_PO_L1,
    2: PERMISSIONS.APPROVE_PO_L2,
    3: PERMISSIONS.APPROVE_PO_L3,
  };
  return permissionMap[level]?.includes(userRole) || false;
};

export const getRoleLabel = (role) => {
  const roleLabels = {
    [ROLES.ADMIN]: 'Quản trị viên',
    [ROLES.TRUONG_PHONG_MH]: 'Trưởng phòng Mua hàng',
    [ROLES.NHAN_VIEN_MH]: 'Nhân viên Mua hàng',
    [ROLES.KE_TOAN]: 'Kế toán',
    [ROLES.GIAM_DOC]: 'Giám đốc',
    [ROLES.GIAM_SAT]: 'Giám sát',
    [ROLES.NCC]: 'Nhà cung cấp',
    [ROLES.PHONG_OS]: 'Phòng OS',
  };
  return roleLabels[role] || role;
};

export const getApprovalLevelLabel = (level) => {
  const labels = {
    1: 'Trưởng phòng Mua hàng',
    2: 'Kế toán trưởng',
    3: 'Giám đốc',
  };
  return labels[level] || `Cấp ${level}`;
};
