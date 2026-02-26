const nodemailer = require('nodemailer');

// Email configuration
let transporter = null;

const initializeEmail = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log('⚠️  Email credentials not configured. Email notifications disabled.');
    return null;
  }

  try {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    console.log('✅ Email service initialized');
    return transporter;
  } catch (error) {
    console.error('❌ Email initialization error:', error.message);
    return null;
  }
};

// Email recipients for all notifications
const ADMIN_EMAILS = 'yulialee217@gmail.com, 2hh9732@gmail.com';

// Send employee registration request notification
const sendEmployeeRegistrationRequest = async ({ name, username, phone }) => {
  try {
    if (!transporter) {
      transporter = initializeEmail();
      if (!transporter) return;
    }

    const adminEmail = ADMIN_EMAILS;
    const emailBody = `
<h2>👤 직원 가입 요청</h2>
<p>새로운 직원 가입 요청이 들어왔습니다.</p>
<table style="border-collapse:collapse; width:100%; margin-top:16px;">
  <tr><td style="padding:8px 12px; background:#f5f5f5; font-weight:bold;">이름</td><td style="padding:8px 12px;">${name}</td></tr>
  <tr><td style="padding:8px 12px; background:#f5f5f5; font-weight:bold;">아이디</td><td style="padding:8px 12px;">${username}</td></tr>
  <tr><td style="padding:8px 12px; background:#f5f5f5; font-weight:bold;">전화번호</td><td style="padding:8px 12px;">${phone}</td></tr>
  <tr><td style="padding:8px 12px; background:#f5f5f5; font-weight:bold;">요청 시간</td><td style="padding:8px 12px;">${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}</td></tr>
</table>
<p style="margin-top:20px;">대시보드에서 <strong>가입 승인 또는 거절</strong> 하실 수 있습니다.</p>
<hr>
<p><small>Salt Renewal 자동 알림</small></p>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: adminEmail,
      subject: `[Salt Renewal] 직원 가입 요청 - ${name} (${username})`,
      html: emailBody
    });
    console.log(`📧 Employee registration request email sent for ${name}`);
  } catch (error) {
    console.error('❌ Failed to send employee registration email:', error.message);
  }
};

// Send error notification email
const sendErrorNotification = async (errorType, errorMessage, errorDetails = {}) => {
  try {
    if (!transporter) {
      transporter = initializeEmail();
      if (!transporter) return; // Skip if email not configured
    }

    const adminEmail = ADMIN_EMAILS;
    
    const emailBody = `
<h2>🚨 Salt Renewal System Error Alert</h2>

<h3>Error Type: ${errorType}</h3>

<p><strong>Error Message:</strong><br/>
${errorMessage}</p>

<p><strong>Timestamp:</strong><br/>
${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}</p>

${errorDetails.ipAddress ? `<p><strong>IP Address:</strong> ${errorDetails.ipAddress}</p>` : ''}
${errorDetails.formType ? `<p><strong>Form Type:</strong> ${errorDetails.formType}</p>` : ''}
${errorDetails.contactInfo ? `<p><strong>Contact Info:</strong> ${errorDetails.contactInfo}</p>` : ''}
${errorDetails.stackTrace ? `<p><strong>Stack Trace:</strong><br/><pre>${errorDetails.stackTrace}</pre></p>` : ''}

<hr>
<p><small>This is an automated error notification from Salt Renewal MERN App</small></p>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: adminEmail,
      subject: `⚠️ Salt Renewal Error: ${errorType}`,
      html: emailBody
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Error notification email sent to ${adminEmail}`);
  } catch (error) {
    // Don't throw error if email fails - just log it
    console.error('❌ Failed to send error notification email:', error.message);
  }
};

// Send daily summary notification
const sendDailySummary = async (data) => {
  try {
    if (!transporter) {
      transporter = initializeEmail();
      if (!transporter) return;
    }

    const adminEmail = ADMIN_EMAILS;
    
    const emailBody = `
<h2>📊 Daily Update on SALT/KT Contact Forms</h2>

<h3>Total Current Entries</h3>
<ul>
  <li><strong>SALT 상담신청:</strong> ${data.saltTotal || 0} total entries</li>
  <li><strong>KT 상담신청:</strong> ${data.ktTotal || 0} total entries</li>
  <li><strong>Grand Total:</strong> ${(data.saltTotal || 0) + (data.ktTotal || 0)} entries</li>
</ul>

<h3>Yesterday's Summary (${data.yesterdayDate})</h3>
<ul>
  <li><strong>SALT 상담신청:</strong> ${data.saltYesterday} entries</li>
  <li><strong>KT 상담신청:</strong> ${data.ktYesterday} entries</li>
  <li><strong>Total Yesterday:</strong> ${data.saltYesterday + data.ktYesterday} entries</li>
</ul>

<h3>This Week (${data.weekRange})</h3>
<ul>
  <li><strong>SALT 상담신청:</strong> ${data.saltThisWeek} entries</li>
  <li><strong>KT 상담신청:</strong> ${data.ktThisWeek} entries</li>
  <li><strong>Total This Week:</strong> ${data.saltThisWeek + data.ktThisWeek} entries</li>
</ul>

<p><strong>Report Generated:</strong><br/>
${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })} (한국시간)</p>

<hr>
<p><small>This is an automated daily summary from Salt Renewal MERN App.<br/>
You will receive this email every day at 7:00 AM NC time.</small></p>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: adminEmail,
      subject: `Daily Update on SALT/KT Contact Forms`,
      html: emailBody
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Daily summary email sent to ${adminEmail}`);
  } catch (error) {
    console.error('❌ Failed to send daily summary email:', error.message);
  }
};

// Send new estimate notification (full or quick)
const sendNewEstimateNotification = async (estimate) => {
  try {
    if (!transporter) { transporter = initializeEmail(); if (!transporter) return; }
    const adminEmail = ADMIN_EMAILS;
    const isQuick = estimate.type === 'quick';
    const time = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    const phone = estimate.contactInfo?.phoneNumber || '-';
    const address = estimate.contactInfo?.address || '-';
    const cameraType = estimate.currentSelection?.cameraType || estimate.initialSelection?.cameraType || '-';
    const indoor = estimate.currentSelection?.indoorCount ?? estimate.initialSelection?.indoorCount ?? '-';
    const outdoor = estimate.currentSelection?.outdoorCount ?? estimate.initialSelection?.outdoorCount ?? '-';
    const price = estimate.price ? `₩${Number(estimate.price).toLocaleString()}` : '-';
    const emailBody = `
<h2>${isQuick ? '📋 새 간편 신청 제출' : '📝 새 정식 상담 신청 제출'}</h2>
<p>${time}</p>
<table style="border-collapse:collapse; width:100%; margin-top:16px;">
  <tr><td style="padding:8px 12px; background:#f5f5f5; font-weight:bold;">유형</td><td style="padding:8px 12px;">${isQuick ? '간편 신청' : '정식 상담 신청'}</td></tr>
  <tr><td style="padding:8px 12px; background:#f5f5f5; font-weight:bold;">전화번호</td><td style="padding:8px 12px;">${phone}</td></tr>
  <tr><td style="padding:8px 12px; background:#f5f5f5; font-weight:bold;">주소</td><td style="padding:8px 12px;">${address}</td></tr>
  <tr><td style="padding:8px 12px; background:#f5f5f5; font-weight:bold;">카메라 종류</td><td style="padding:8px 12px;">${cameraType}</td></tr>
  <tr><td style="padding:8px 12px; background:#f5f5f5; font-weight:bold;">실내/실외</td><td style="padding:8px 12px;">실내 ${indoor}대 / 실외 ${outdoor}대</td></tr>
  <tr><td style="padding:8px 12px; background:#f5f5f5; font-weight:bold;">견적가</td><td style="padding:8px 12px;">${price}</td></tr>
</table>
<hr><p><small>Salt Renewal 자동 알림</small></p>`;
    await transporter.sendMail({ from: process.env.EMAIL_USER, to: adminEmail, subject: `[Salt Renewal] 새 ${isQuick ? '간편 신청' : '정식 상담 신청'} - ${phone}`, html: emailBody });
    console.log(`📧 New estimate notification sent (${estimate.type})`);
  } catch (error) { console.error('❌ Failed to send estimate notification:', error.message); }
};

// Send new chat request notification
const sendNewChatNotification = async ({ sessionId, customerName }) => {
  try {
    if (!transporter) { transporter = initializeEmail(); if (!transporter) return; }
    const adminEmail = ADMIN_EMAILS;
    const time = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    const emailBody = `
<h2>💬 새 실시간 채팅 요청</h2>
<p>${time}</p>
<table style="border-collapse:collapse; width:100%; margin-top:16px;">
  <tr><td style="padding:8px 12px; background:#f5f5f5; font-weight:bold;">고객명</td><td style="padding:8px 12px;">${customerName}</td></tr>
  <tr><td style="padding:8px 12px; background:#f5f5f5; font-weight:bold;">세션 ID</td><td style="padding:8px 12px;">${sessionId}</td></tr>
</table>
<p style="margin-top:16px;">대시보드 <strong>실시간 채팅</strong> 탭에서 확인하세요.</p>
<hr><p><small>Salt Renewal 자동 알림</small></p>`;
    await transporter.sendMail({ from: process.env.EMAIL_USER, to: adminEmail, subject: `[Salt Renewal] 새 채팅 요청 - ${customerName}`, html: emailBody });
    console.log(`📧 New chat notification sent`);
  } catch (error) { console.error('❌ Failed to send chat notification:', error.message); }
};

// Send new question notification
const sendNewQuestionNotification = async ({ phone, question }) => {
  try {
    if (!transporter) { transporter = initializeEmail(); if (!transporter) return; }
    const adminEmail = ADMIN_EMAILS;
    const time = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    const emailBody = `
<h2>❓ 새 고객 문의</h2>
<p>${time}</p>
<table style="border-collapse:collapse; width:100%; margin-top:16px;">
  <tr><td style="padding:8px 12px; background:#f5f5f5; font-weight:bold;">전화번호</td><td style="padding:8px 12px;">${phone}</td></tr>
  <tr><td style="padding:8px 12px; background:#f5f5f5; font-weight:bold;">문의 내용</td><td style="padding:8px 12px;">${question}</td></tr>
</table>
<p style="margin-top:16px;">대시보드 <strong>문의 탭</strong>에서 확인하세요.</p>
<hr><p><small>Salt Renewal 자동 알림</small></p>`;
    await transporter.sendMail({ from: process.env.EMAIL_USER, to: adminEmail, subject: `[Salt Renewal] 새 문의 - ${phone}`, html: emailBody });
    console.log(`📧 New question notification sent`);
  } catch (error) { console.error('❌ Failed to send question notification:', error.message); }
};

// Send chat summary email when a chat is ended
const sendChatSummaryEmail = async ({ customerName, messages, acceptedAt, endedAt, endedBy }) => {
  try {
    if (!transporter) { transporter = initializeEmail(); if (!transporter) return; }
    const adminEmail = ADMIN_EMAILS;
    const formatTime = (ts) => ts ? new Date(ts).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) : '-';
    const messagesHtml = (messages || []).map(m => {
      const isEmployee = m.sender === 'employee';
      const bg = isEmployee ? '#e3f2fd' : '#f5f5f5';
      const label = isEmployee ? (endedBy || '직원') : (customerName || '고객');
      const time = m.timestamp ? new Date(m.timestamp).toLocaleTimeString('ko-KR', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit' }) : '';
      return `<tr><td style="padding:6px 12px; background:${bg}; border-radius:4px;"><strong>${label}</strong> <span style="color:#999; font-size:11px;">${time}</span><br/>${m.text}</td></tr>`;
    }).join('<tr><td style="height:4px;"></td></tr>');
    const emailBody = `
<h2>💬 채팅 상담 요약</h2>
<table style="border-collapse:collapse; width:100%; margin-bottom:16px;">
  <tr><td style="padding:6px 12px; background:#f5f5f5; font-weight:bold;">고객명</td><td style="padding:6px 12px;">${customerName}</td></tr>
  <tr><td style="padding:6px 12px; background:#f5f5f5; font-weight:bold;">상담 시작</td><td style="padding:6px 12px;">${formatTime(acceptedAt)}</td></tr>
  <tr><td style="padding:6px 12px; background:#f5f5f5; font-weight:bold;">상담 종료</td><td style="padding:6px 12px;">${formatTime(endedAt)}</td></tr>
  <tr><td style="padding:6px 12px; background:#f5f5f5; font-weight:bold;">종료한 직원</td><td style="padding:6px 12px;">${endedBy || '-'}</td></tr>
  <tr><td style="padding:6px 12px; background:#f5f5f5; font-weight:bold;">메시지 수</td><td style="padding:6px 12px;">${(messages || []).length}개</td></tr>
</table>
<h3 style="margin-bottom:8px;">📝 대화 내용</h3>
<table style="width:100%; border-collapse:collapse;">${messagesHtml}</table>
<hr><p><small>Salt Renewal 자동 알림</small></p>`;
    await transporter.sendMail({ from: process.env.EMAIL_USER, to: adminEmail, subject: `[Salt Renewal] 채팅 상담 종료 - ${customerName}`, html: emailBody });
    console.log(`📧 Chat summary email sent for ${customerName}`);
  } catch (error) { console.error('❌ Failed to send chat summary email:', error.message); }
};

module.exports = {
  initializeEmail,
  sendErrorNotification,
  sendDailySummary,
  sendEmployeeRegistrationRequest,
  sendNewEstimateNotification,
  sendNewChatNotification,
  sendNewQuestionNotification,
  sendChatSummaryEmail
};
