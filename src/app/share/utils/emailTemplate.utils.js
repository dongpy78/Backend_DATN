// utils/emailTemplates.js
const getResetPasswordTemplate = (email, newPassword) => {
  return {
    subject: "🔑 Đặt lại mật khẩu của bạn - Tìm Việc IT",
    text: `Xin chào ${email},

Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn trên hệ thống Tìm Việc IT.

Mật khẩu mới của bạn là: ${newPassword}

Vui lòng đăng nhập và đổi mật khẩu ngay để đảm bảo an toàn tài khoản.

📌 Đăng nhập ngay: https://timviecit.com/login

Trân trọng,
Đội ngũ Tìm Việc IT
`,
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: #1E90FF; text-align: center;">🔑 Đặt lại mật khẩu thành công</h2>
      <p>Xin chào <strong>${email}</strong>,</p>
      <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu của bạn trên hệ thống <strong>Tìm Việc IT</strong>.</p>
      <div style="background: #f4f4f4; padding: 10px; border-radius: 5px; text-align: center;">
        <p><strong>Mật khẩu mới của bạn:</strong></p>
        <p style="font-size: 18px; font-weight: bold; color: #d9534f;">${newPassword}</p>
      </div>
      <p>Vui lòng đăng nhập và thay đổi mật khẩu ngay để bảo mật tài khoản của bạn.</p>
      <p style="text-align: center;">
        <a href="https://timviecit.com/login" 
           style="background: #1E90FF; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Đăng nhập ngay
        </a>
      </p>
      <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
      <hr>
      <p style="font-size: 12px; color: #777;">Trân trọng,<br>Đội ngũ <strong>Tìm Việc IT</strong></p>
    </div>
    `,
  };
};

module.exports = { getResetPasswordTemplate };
