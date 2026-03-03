const nodemailer = require('nodemailer');

// Email recipients
const NOTIFICATION_EMAILS = ['2hh9732@gmail.com', 'yulialee217@gmail.com'];

// Create transporter
let transporter = null;

const initializeEmail = async () => {
  try {
    const EMAIL_USER = process.env.EMAIL_USER;
    const EMAIL_PASS = process.env.EMAIL_PASS;
    
    console.log('📧 Email config check:', EMAIL_USER ? 'USER found' : 'USER missing', EMAIL_PASS ? 'PASS found' : 'PASS missing');
    
    if (!EMAIL_USER || !EMAIL_PASS) {
      console.warn('⚠️  Email credentials not configured. Email notifications disabled.');
      return null;
    }
    
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // use SSL
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
      }
    });
    
    console.log('✅ Email service initialized');
    return transporter;
  } catch (error) {
    console.error('❌ Email service error:', error.message);
    return null;
  }
};

// Send form submission notification
const sendFormNotification = async (formData) => {
  try {
    if (!transporter) {
      transporter = await initializeEmail();
      if (!transporter) return; // Skip if not configured
    }
    
    const {
      formType,
      phoneNumber,
      address,
      locationType,
      appointmentDate,
      appointmentTime,
      cameraType,
      outdoorCount,
      indoorCount,
      iotOptions,
      specialOptions,
      hasInternet,
      submittedAt
    } = formData;
    
    // Format date
    const formatDate = (dateStr) => {
      if (!dateStr) return '-';
      const d = new Date(dateStr);
      return d.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    };
    
    const subject = `[SALT] 새 ${formType} 접수 - ${phoneNumber || '연락처 없음'}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0099b0; border-bottom: 2px solid #0099b0; padding-bottom: 10px;">
          🔔 새 상담 신청이 접수되었습니다
        </h2>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr style="background-color: #f5f5f5;">
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; width: 30%;">인입 폼</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${formType}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">연락처</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${phoneNumber || '-'}</td>
          </tr>
          <tr style="background-color: #f5f5f5;">
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">타입</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${locationType || '-'}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">주소</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${address || '-'}</td>
          </tr>
          <tr style="background-color: #f5f5f5;">
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">희망 날짜</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${appointmentDate || '-'}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">희망 시간</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${appointmentTime || '-'}</td>
          </tr>
          <tr style="background-color: #f5f5f5;">
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">화소</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${cameraType || '-'}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">실외/실내</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${outdoorCount || 0}대 / ${indoorCount || 0}대</td>
          </tr>
          <tr style="background-color: #f5f5f5;">
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">IoT</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${iotOptions || '-'}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">특수공사</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${specialOptions || '-'}</td>
          </tr>
          <tr style="background-color: #f5f5f5;">
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">인터넷</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${hasInternet || '-'}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">접수 시간</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${formatDate(submittedAt)}</td>
          </tr>
        </table>
        
        <p style="margin-top: 20px; color: #666; font-size: 12px;">
          이 이메일은 SALT 웹사이트에서 자동으로 발송되었습니다.
        </p>
      </div>
    `;
    
    console.log('📧 Attempting to send form notification email...');
    const result = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: NOTIFICATION_EMAILS.join(', '),
      subject,
      html
    });
    
    console.log(`✅ Email notification sent for ${formType}, messageId: ${result.messageId}`);
  } catch (error) {
    console.error('❌ Error sending email notification:', error.message);
  }
};

// Send question notification
const sendQuestionNotification = async (questionData) => {
  try {
    if (!transporter) {
      transporter = await initializeEmail();
      if (!transporter) return;
    }
    
    const { phone, question } = questionData;
    
    const subject = `[SALT] 새 고객 질문 - ${phone || '연락처 없음'}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0099b0; border-bottom: 2px solid #0099b0; padding-bottom: 10px;">
          ❓ 새 고객 질문이 접수되었습니다
        </h2>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr style="background-color: #f5f5f5;">
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; width: 30%;">연락처</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${phone || '-'}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">질문 내용</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${question || '-'}</td>
          </tr>
        </table>
        
        <p style="margin-top: 20px; color: #666; font-size: 12px;">
          이 이메일은 SALT 웹사이트에서 자동으로 발송되었습니다.
        </p>
      </div>
    `;
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: NOTIFICATION_EMAILS.join(', '),
      subject,
      html
    });
    
    console.log('✅ Question notification email sent');
  } catch (error) {
    console.error('❌ Error sending question notification:', error.message);
  }
};

module.exports = {
  initializeEmail,
  sendFormNotification,
  sendQuestionNotification
};
