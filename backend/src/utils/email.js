import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Generic email sending function
export const sendEmail = async ({ to, subject, html }) => {
  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@procurement.com',
    to,
    subject,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

export const sendRFQEmail = async (supplier, rfq) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const quotationLink = `${frontendUrl}/quotations/new/${rfq.id}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@procurement.com',
    to: supplier.email,
    subject: `Yêu cầu báo giá - ${rfq.code}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1890ff; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f5f5f5; padding: 20px; }
          .info-box { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #1890ff; }
          .button { display: inline-block; background-color: #1890ff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f0f0f0; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>YÊU CẦU BÁO GIÁ</h1>
          </div>
          <div class="content">
            <p>Kính gửi <strong>${supplier.companyName}</strong>,</p>
            <p>Chúng tôi xin gửi đến quý công ty yêu cầu báo giá với thông tin như sau:</p>
            
            <div class="info-box">
              <table>
                <tr>
                  <th>Mã RFQ:</th>
                  <td>${rfq.code}</td>
                </tr>
                <tr>
                  <th>Tiêu đề:</th>
                  <td>${rfq.title}</td>
                </tr>
                <tr>
                  <th>Dự án:</th>
                  <td>${rfq.request.project.name}</td>
                </tr>
                <tr>
                  <th>Hạn chót:</th>
                  <td style="color: #ff4d4f; font-weight: bold;">${new Date(rfq.deadline).toLocaleDateString('vi-VN')}</td>
                </tr>
              </table>
            </div>

            <h3>Danh sách vật tư cần báo giá:</h3>
            <table>
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Tên vật tư</th>
                  <th>Số lượng</th>
                  <th>Đơn vị</th>
                </tr>
              </thead>
              <tbody>
                ${rfq.request.items.map((item, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${item.material.name}</td>
                    <td>${item.quantity}</td>
                    <td>${item.material.unit}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <p style="text-align: center;">
              <a href="${quotationLink}" class="button">XEM CHI TIẾT VÀ GỬI BÁO GIÁ</a>
            </p>

            <p><strong>Lưu ý:</strong></p>
            <ul>
              <li>Vui lòng gửi báo giá trước ngày <strong>${new Date(rfq.deadline).toLocaleDateString('vi-VN')}</strong></li>
              <li>Báo giá cần bao gồm: đơn giá, thời gian giao hàng, điều kiện thanh toán</li>
              <li>Mọi thắc mắc xin liên hệ Phòng Mua hàng</li>
            </ul>

            <p>Trân trọng,<br><strong>Phòng Mua hàng</strong></p>
          </div>
          <div class="footer">
            <p>Email này được gửi tự động từ Hệ thống Quản lý Mua hàng</p>
            <p>Vui lòng không trả lời email này</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    console.log('📧 Sending RFQ email to:', supplier.email);
    console.log('📧 Quotation link:', quotationLink);
    
    // For demo: Check if SMTP is configured
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully to:', supplier.email);
    } else {
      console.log('⚠️ SMTP not configured. Email logged only (demo mode)');
      console.log('📧 To:', supplier.email);
      console.log('📧 Subject:', mailOptions.subject);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Email error:', error.message);
    // Don't throw error in demo mode, just log it
    return false;
  }
};

export const sendPOEmail = async (supplier, po) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const poLink = `${frontendUrl}/po/${po.id}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@procurement.com',
    to: supplier.email,
    subject: `Đơn đặt hàng - ${po.code}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #52c41a; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f5f5f5; padding: 20px; }
          .info-box { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #52c41a; }
          .button { display: inline-block; background-color: #52c41a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f0f0f0; font-weight: bold; }
          .total { font-size: 18px; font-weight: bold; color: #52c41a; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>ĐỜN ĐẶT HÀNG</h1>
          </div>
          <div class="content">
            <p>Kính gửi <strong>${supplier.companyName}</strong>,</p>
            <p>Chúng tôi xin gửi đến quý công ty đơn đặt hàng đã được phê duyệt:</p>
            
            <div class="info-box">
              <table>
                <tr>
                  <th>Mã PO:</th>
                  <td>${po.code}</td>
                </tr>
                <tr>
                  <th>Dự án:</th>
                  <td>${po.project.name}</td>
                </tr>
                <tr>
                  <th>Ngày giao hàng:</th>
                  <td style="color: #ff4d4f; font-weight: bold;">${new Date(po.deliveryDate).toLocaleDateString('vi-VN')}</td>
                </tr>
                <tr>
                  <th>Địa chỉ giao hàng:</th>
                  <td>${po.deliveryAddress}</td>
                </tr>
                <tr>
                  <th>Điều kiện thanh toán:</th>
                  <td>${po.paymentTerms}</td>
                </tr>
              </table>
            </div>

            <h3>Chi tiết đơn hàng:</h3>
            <table>
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Vật tư</th>
                  <th>Số lượng</th>
                  <th>Đơn giá</th>
                  <th>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                ${po.items.map((item, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${item.material.name}</td>
                    <td>${item.quantity} ${item.material.unit}</td>
                    <td>${item.unitPrice.toLocaleString('vi-VN')} ₫</td>
                    <td>${item.amount.toLocaleString('vi-VN')} ₫</td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="4" style="text-align: right;"><strong>Tổng cộng:</strong></td>
                  <td><strong>${po.totalAmount.toLocaleString('vi-VN')} ₫</strong></td>
                </tr>
                <tr>
                  <td colspan="4" style="text-align: right;"><strong>VAT (${((po.vatAmount / po.totalAmount) * 100).toFixed(0)}%):</strong></td>
                  <td><strong>${po.vatAmount.toLocaleString('vi-VN')} ₫</strong></td>
                </tr>
                <tr>
                  <td colspan="4" style="text-align: right;"><strong>TỔNG THANH TOÁN:</strong></td>
                  <td class="total">${po.grandTotal.toLocaleString('vi-VN')} ₫</td>
                </tr>
              </tfoot>
            </table>

            <p style="text-align: center;">
              <a href="${poLink}" class="button">XEM CHI TIẾT ĐƠN HÀNG</a>
            </p>

            <p><strong>Lưu ý:</strong></p>
            <ul>
              <li>Vui lòng xác nhận đơn hàng trong vòng 24 giờ</li>
              <li>Giao hàng đúng thời gian: <strong>${new Date(po.deliveryDate).toLocaleDateString('vi-VN')}</strong></li>
              <li>Liên hệ Phòng Mua hàng nếu có thay đổi</li>
            </ul>

            <p>Trân trọng,<br><strong>Phòng Mua hàng</strong></p>
          </div>
          <div class="footer">
            <p>Email này được gửi tự động từ Hệ thống Quản lý Mua hàng</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    console.log('📧 Sending PO email to:', supplier.email);
    
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await transporter.sendMail(mailOptions);
      console.log('✅ PO email sent successfully');
    } else {
      console.log('⚠️ SMTP not configured. Email logged only (demo mode)');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Email error:', error.message);
    return false;
  }
};
