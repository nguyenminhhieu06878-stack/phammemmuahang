import dayjs from 'dayjs';

// Check if PO is delayed
export const isPODelayed = (po) => {
  if (!po || po.status === 'completed' || po.status === 'cancelled') {
    return false;
  }
  
  const deliveryDate = dayjs(po.deliveryDate);
  const today = dayjs();
  
  // If delivery date has passed and not completed
  return deliveryDate.isBefore(today, 'day');
};

// Get delay days
export const getDelayDays = (po) => {
  if (!isPODelayed(po)) return 0;
  
  const deliveryDate = dayjs(po.deliveryDate);
  const today = dayjs();
  
  return today.diff(deliveryDate, 'day');
};

// Get delay severity
export const getDelaySeverity = (delayDays) => {
  if (delayDays === 0) return 'none';
  if (delayDays <= 3) return 'warning'; // Vàng
  if (delayDays <= 7) return 'error'; // Cam
  return 'critical'; // Đỏ
};

// Get delay color
export const getDelayColor = (severity) => {
  const colors = {
    none: '#52c41a',
    warning: '#faad14',
    error: '#fa8c16',
    critical: '#f5222d',
  };
  return colors[severity] || colors.none;
};

// Get delay message
export const getDelayMessage = (delayDays) => {
  if (delayDays === 0) return '';
  if (delayDays === 1) return 'Trễ 1 ngày';
  return `Trễ ${delayDays} ngày`;
};

// Check if approaching deadline (within 3 days)
export const isApproachingDeadline = (po) => {
  if (!po || po.status === 'completed' || po.status === 'cancelled') {
    return false;
  }
  
  const deliveryDate = dayjs(po.deliveryDate);
  const today = dayjs();
  const daysUntilDelivery = deliveryDate.diff(today, 'day');
  
  return daysUntilDelivery >= 0 && daysUntilDelivery <= 3;
};

// Get days until delivery
export const getDaysUntilDelivery = (po) => {
  const deliveryDate = dayjs(po.deliveryDate);
  const today = dayjs();
  return deliveryDate.diff(today, 'day');
};

// Filter delayed POs
export const getDelayedPOs = (pos) => {
  return pos.filter(po => isPODelayed(po));
};

// Filter approaching deadline POs
export const getApproachingDeadlinePOs = (pos) => {
  return pos.filter(po => isApproachingDeadline(po));
};

// Get delay statistics
export const getDelayStats = (pos) => {
  const delayed = getDelayedPOs(pos);
  const approaching = getApproachingDeadlinePOs(pos);
  
  const severityCounts = {
    warning: 0,
    error: 0,
    critical: 0,
  };
  
  delayed.forEach(po => {
    const days = getDelayDays(po);
    const severity = getDelaySeverity(days);
    if (severity !== 'none') {
      severityCounts[severity]++;
    }
  });
  
  return {
    totalDelayed: delayed.length,
    approaching: approaching.length,
    ...severityCounts,
  };
};
