const nodemailer = require('nodemailer');

// Email recipients
const NOTIFICATION_EMAILS = ['2hh9732@gmail.com', 'yulialee217@gmail.com'];

// Create transporter
let transporter = null;

const initializeEmail = async () => {
  try {
    const EMAIL_USER = process.env.EMAIL_USER;
    const EMAIL_PASS = process.env.EMAIL_PASS;

    console.log('📧 Email config check:', EMAIL_USER ? 'EMAIL_USER found' : 'EMAIL_USER missing');

    if (!EMAIL_USER || !EMAIL_PASS) {
      console.warn('⚠️  Gmail credentials not configured. Email notifications disabled.');
      return null;
    }

    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
      }
    });

    console.log('✅ Email service initialized (Nodemailer/Gmail)');
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
      if (!transporter) return;
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
      ptzCount,
      storageOption,
      monitorInstall,
      submittedAt
    } = formData;
    
    const formatDate = (dateStr) => {
      if (!dateStr) return '-';
      const d = new Date(dateStr);
      return d.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    };
    
    const cameraParts = [];
    if (indoorCount > 0) cameraParts.push(`실내 ${indoorCount}대`);
    if (outdoorCount > 0) cameraParts.push(`실외 ${outdoorCount}대`);
    const cameraCountStr = cameraParts.length > 0 ? cameraParts.join(', ') + ' 설치, ' : '';
    
    const subject = `[솔트 신규] ${address || '-'} ${cameraType || '-'} ${cameraCountStr}공사희망일: ${appointmentDate || '-'}, 인터넷: ${hasInternet || '-'}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0099b0; border-bottom: 2px solid #0099b0; padding-bottom: 10px;">
          🔔 새 상담 신청이 접수되었습니다
        </h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr style="background-color: #f5f5f5;">
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; width: 30%;">접수 시간</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${formatDate(submittedAt)}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">연락처</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${phoneNumber || '-'}</td>
          </tr>
          <tr style="background-color: #f5f5f5;">
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">주소</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${address || '-'}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">타입</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${locationType || '-'}</td>
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
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">PTZ 줌 카메라</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${ptzCount > 0 ? ptzCount + '대' : '-'}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">저장용량 추가</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${storageOption || '-'}</td>
          </tr>
          <tr style="background-color: #f5f5f5;">
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">모니터 설치</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${monitorInstall ? '예' : '-'}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">인터넷</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${hasInternet || '-'}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">인입 폼</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${formType}</td>
          </tr>
        </table>
        <p style="margin-top: 20px; color: #666; font-size: 12px;">
          이 이메일은 SALT 웹사이트에서 자동으로 발송되었습니다.
        </p>
      </div>
    `;
    
    console.log('📧 Attempting to send form notification email via Gmail...');
    await transporter.sendMail({
      from: `SALT <${process.env.EMAIL_USER}>`,
      to: NOTIFICATION_EMAILS.join(', '),
      subject,
      html
    });

    console.log(`✅ Email notification sent for ${formType}`);
  } catch (error) {
    console.error('❌ Error sending email notification:', error.message);
  }
};

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
      from: `SALT <${process.env.EMAIL_USER}>`,
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

if (require.main === module) {
  (async () => {
    console.log('🧪 Testing email configuration...\n');
    const result = await initializeEmail();
    if (result) {
      console.log('\n✅ Email configuration is valid!');
      console.log('📧 Sending test email...');
      await sendFormNotification({
        formType: '테스트',
        phoneNumber: '010-1234-5678',
        address: '서울시 테스트구',
        locationType: '가정집',
        appointmentDate: '2026-03-05',
        appointmentTime: '오전',
        cameraType: '500만화소',
        outdoorCount: 2,
        indoorCount: 1,
        iotOptions: '없음',
        specialOptions: '없음',
        hasInternet: '있음',
        submittedAt: new Date().toISOString()
      });
    } else {
      console.log('\n❌ Email configuration failed. Check RESEND_API_KEY environment variable.');
    }
    process.exit(0);
  })();
}
