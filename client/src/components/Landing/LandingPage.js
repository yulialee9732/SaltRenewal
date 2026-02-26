import React, { useState, useEffect, useRef } from 'react';
import './LandingPage.css';
import PriceEstimate from './PriceEstimate';
import { notificationsAPI } from '../../services/api';

const LandingPage = () => {
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [scheduleForm, setScheduleForm] = useState({
    date: '',
    time: '',
    phoneNumber: '',
    address: '',
    indoorCount: 0,
    outdoorCount: 0,
    privacyConsent: false
  });
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [customerCount, setCustomerCount] = useState(0);
  const [isCounterVisible, setIsCounterVisible] = useState(false);
  const counterRef = useRef(null);
  const chatMessagesRef = useRef(null);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [questionForm, setQuestionForm] = useState({ phone: '', question: '' });
  const [chatStatus, setChatStatus] = useState(null); // null, 'pending', 'active', 'ended'
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSessionId, setChatSessionId] = useState(null);

  // Initialize chat session
  useEffect(() => {
    let sessionId = localStorage.getItem('chatSessionId');
    if (!sessionId) {
      sessionId = `customer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('chatSessionId', sessionId);
    }
    setChatSessionId(sessionId);

    // Load existing chat from server
    const loadChat = async () => {
      try {
        const res = await notificationsAPI.getChat(sessionId);
        if (res.data && res.data.chat) {
          const chat = res.data.chat;
          setChatMessages(chat.messages || []);
          setChatStatus(chat.status || null);
          if (chat.status === 'active') {
            setIsChatOpen(true);
          }
        }
      } catch (err) {
        console.error('Failed to load chat:', err);
      }
    };
    loadChat();
  }, []);

  // Poll for new employee messages and status changes
  useEffect(() => {
    if (!chatSessionId || !chatStatus) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await notificationsAPI.getChat(chatSessionId);
        if (res.data && res.data.chat) {
          const chat = res.data.chat;
          const serverMessages = chat.messages || [];
          const serverStatus = chat.status;
          
          // Update messages if changed
          if (serverMessages.length !== chatMessages.length) {
            setChatMessages(serverMessages);
          }
          
          // Update status if changed
          if (serverStatus !== chatStatus) {
            setChatStatus(serverStatus);
            if (serverStatus === 'active' && !isChatOpen) {
              setIsChatOpen(true);
              setShowChatMenu(false);
            } else if (serverStatus === 'ended') {
              // Chat was ended by employee - show the ended message
              if (!isChatOpen) {
                setIsChatOpen(true);
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to poll chat:', err);
      }
    }, 1000); // Poll every 1 second for faster updates

    return () => clearInterval(pollInterval);
  }, [chatSessionId, chatMessages.length, chatStatus, isChatOpen]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const timeSlots = {
    morning: ['8am', '8:30am', '9am', '9:30am', '10am', '10:30am', '11am', '11:30am'],
    afternoon: ['12pm', '12:30pm', '1pm', '1:30pm', '2pm', '2:30pm']
  };

  // Calculate total customers based on business days
  const calculateCustomerCount = () => {
    const startDate = new Date('2024-01-01'); // Starting date
    const startingCount = 10800; // Starting count
    const dailyIncrease = 7; // Increase by 7 per business day
    
    const today = new Date();
    let businessDays = 0;
    
    // Count business days between startDate and today
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      // 0 = Sunday, 6 = Saturday
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        businessDays++;
      }
    }
    
    return startingCount + (businessDays * dailyIncrease);
  };

  // Animate counter when section becomes visible
  useEffect(() => {
    const currentRef = counterRef.current; // Capture ref value for cleanup
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isCounterVisible) {
            setIsCounterVisible(true);
            const targetCount = calculateCustomerCount();
            const duration = 2000; // 2 seconds
            const steps = 60;
            const increment = targetCount / steps;
            let current = 0;
            
            const timer = setInterval(() => {
              current += increment;
              if (current >= targetCount) {
                setCustomerCount(targetCount);
                clearInterval(timer);
              } else {
                setCustomerCount(Math.floor(current));
              }
            }, duration / steps);
          }
        });
      },
      { threshold: 0.5 }
    );

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [isCounterVisible]);

  const scrollToContent = () => {
    const element = document.querySelector('.why-choose-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime || !scheduleForm.phoneNumber || 
        !scheduleForm.address || (scheduleForm.indoorCount === 0 && scheduleForm.outdoorCount === 0) || !scheduleForm.privacyConsent) {
      alert('모든 필수 항목을 입력해주세요. (최소 1대 이상의 카메라를 선택하세요)');
      return;
    }

    const formData = {
      appointment: {
        date: selectedDate,
        time: selectedTime
      },
      contactInfo: {
        phoneNumber: scheduleForm.phoneNumber,
        address: scheduleForm.address
      },
      currentSelection: {
        indoorCount: scheduleForm.indoorCount,
        outdoorCount: scheduleForm.outdoorCount
      },
      scheduleOnly: true,
      submittedAt: new Date().toISOString()
    };

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${API_URL}/price-estimate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('접수되었습니다!');
        setIsScheduleModalOpen(false);
        setSelectedDate(null);
        setSelectedTime('');
        setScheduleForm({
          date: '',
          time: '',
          phoneNumber: '',
          address: '',
          indoorCount: 0,
          outdoorCount: 0,
          privacyConsent: false
        });
      } else {
        alert('예약 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('예약 중 오류가 발생했습니다.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setScheduleForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const formatPhoneNumber = (value) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setScheduleForm(prev => ({
      ...prev,
      phoneNumber: formatted
    }));
  };

  const handleQuantityChange = (field, delta) => {
    setScheduleForm(prev => ({
      ...prev,
      [field]: Math.max(0, prev[field] + delta)
    }));
  };

  const isWithinChatHours = () => {
    // Allow localhost to bypass business hours check
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
      return true;
    }
    
    const now = new Date();
    const koreaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    const day = koreaTime.getDay(); // 0=Sun, 6=Sat
    const totalMinutes = koreaTime.getHours() * 60 + koreaTime.getMinutes();
    return day >= 1 && day <= 5 && totalMinutes >= 600 && totalMinutes < 1020; // 10:00-17:00
  };

  const handleStartChatRequest = async () => {
    if (!chatSessionId) return;
    
    try {
      const customerName = '고객 ' + chatSessionId.split('-')[1].substr(0, 4);
      
      // Create chat on server
      const res = await notificationsAPI.newChat({ 
        sessionId: chatSessionId, 
        customerName 
      });
      
      if (res.data && res.data.chat) {
        setChatStatus('pending');
        setShowChatMenu(false);
        setIsChatOpen(true);
      }
    } catch (err) {
      console.error('Failed to start chat:', err);
      alert('채팅 요청에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleCloseChatFromCustomer = async () => {
    setIsChatOpen(false);
    if (chatStatus === 'pending') {
      // Cancel the pending request
      try {
        await notificationsAPI.deleteChat(chatSessionId);
      } catch (err) {
        console.error('Failed to cancel chat:', err);
      }
      setChatStatus(null);
      setChatMessages([]);
    }
  };

  const handleQuestionFormChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const formatted = formatPhoneNumber(value);
      setQuestionForm(prev => ({
        ...prev,
        [name]: formatted
      }));
    } else {
      setQuestionForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleQuestionSubmit = (e) => {
    e.preventDefault();
    
    // Send question to server - saves to MongoDB, Google Sheets, and sends email
    notificationsAPI.newQuestion({ 
      phone: questionForm.phone, 
      question: questionForm.question 
    }).catch(() => {});

    // Show success message
    alert('질문이 등록되었습니다. 빠른 시일 내에 연락드리겠습니다.');
    
    // Reset form and close
    setQuestionForm({ phone: '', question: '' });
    setShowQuestionForm(false);
  };

  const handleChatSend = async () => {
    if (!chatInput.trim() || !chatSessionId || chatStatus !== 'active') return;

    const messageText = chatInput;
    setChatInput('');

    // Optimistic update - show message immediately
    const tempMessage = {
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
      read: false
    };
    setChatMessages(prev => [...prev, tempMessage]);

    try {
      // Send message to server
      const res = await notificationsAPI.sendMessage(chatSessionId, {
        text: messageText,
        sender: 'user'
      });
      
      // Update with server response
      if (res.data && res.data.chat) {
        setChatMessages(res.data.chat.messages);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleChatKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChatSend();
    }
  };

  const isWeekday = (date) => {
    const day = date.getDay();
    return day !== 0 && day !== 6;
  };

  const isHoliday = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    const holidays = [
      `${year}-01-01`,
      `${year}-03-01`,
      `${year}-05-05`,
      `${year}-06-06`,
      `${year}-08-15`,
      `${year}-10-03`,
      `${year}-10-09`,
      `${year}-12-25`,
    ];
    
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return holidays.includes(dateStr);
  };

  const generateCalendar = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate minimum date (2 business days ahead)
    const getMinimumDate = () => {
      let minDate = new Date(today);
      let businessDaysAdded = 0;
      
      while (businessDaysAdded < 2) {
        minDate.setDate(minDate.getDate() + 1);
        if (isWeekday(minDate) && !isHoliday(minDate)) {
          businessDaysAdded++;
        }
      }
      
      return minDate;
    };
    
    const minimumDate = getMinimumDate();
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const calendar = [];
    let week = new Array(7).fill(null);
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      week[i] = null;
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();
      
      week[dayOfWeek] = {
        day,
        date,
        isAvailable: date >= minimumDate && isWeekday(date) && !isHoliday(date)
      };
      
      if (dayOfWeek === 6 || day === daysInMonth) {
        calendar.push([...week]);
        week = new Array(7).fill(null);
      }
    }
    
    return calendar;
  };

  const heroStyle = {
    backgroundImage: `url(${process.env.PUBLIC_URL}/img/main-page/main-poster-bg.png)`
  };

  return (
    <div className="landing-page">
      <div id="hero-section" className="hero-section" style={heroStyle}>
        <div className="hero-content">
          {/* Main text - center left */}
          <div className="main-text-container">
            <img src={`${process.env.PUBLIC_URL}/img/main-page/main-text.png`} alt="SALT CCTV" className="main-text-image" />
          </div>
          
          {/* Camera - top right corner */}
          <div className="main-cam-container">
            <img src={`${process.env.PUBLIC_URL}/img/main-page/main-cam.png`} alt="Camera" className="main-cam-image" />
          </div>
          
          {/* Display - bottom center */}
          <div className="main-display-container">
            <img src={`${process.env.PUBLIC_URL}/img/main-page/main-display.png`} alt="Display" className="main-display-image" />
          </div>
          
          {/* IoT - on top of display */}
          <div className="main-iot-container">
            <img src={`${process.env.PUBLIC_URL}/img/main-page/main-iot.png`} alt="IoT" className="main-iot-image" />
            <img src={`${process.env.PUBLIC_URL}/img/main-page/main-iot.png`} alt="IoT" className="main-iot-image" />
          </div>
        </div>
        <div className="scroll-indicator" onClick={scrollToContent}>
          <div className="scroll-arrow">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p className="scroll-text">스크롤 하세요</p>
        </div>
      </div>

      {/* Price Chart Section */}
      <div className="price-chart-section">
        <div className="price-chart-container">
          <h2 className="price-chart-title">210만화소 CCTV 월 이용료</h2>
          <p className="price-chart-subtitle">3년 약정 렌탈 · 기본 설치비 포함 · 부가세 별도</p>
          
          <div className="price-chart-table-wrapper">
            <table className="price-chart-table">
              <thead>
                <tr>
                  <th>카메라 수</th>
                  <th>월 이용료</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>2대</td><td>22,000원</td></tr>
                <tr><td>3대</td><td>26,000원</td></tr>
                <tr><td>4대</td><td>30,000원</td></tr>
                <tr><td>5대</td><td>36,000원</td></tr>
                <tr><td>6대</td><td>40,000원</td></tr>
                <tr><td>7대</td><td>44,000원</td></tr>
                <tr><td>8대</td><td>48,000원</td></tr>
                <tr className="contact-row"><td>9대 이상</td><td>상담 문의</td></tr>
              </tbody>
            </table>
          </div>

          <div className="price-chart-notes">
            <div className="price-note-item included">
              <span className="note-icon">✓</span>
              <span>사용 기간 내 출장 A/S 무료</span>
            </div>
            <div className="price-note-item included">
              <span className="note-icon">✓</span>
              <span>기본 설치비 포함</span>
            </div>
            <div className="price-note-item extra">
              <span className="note-icon">※</span>
              <span>특수 공사 시 설치비 별도 (엘리베이터 공사, 층고 4m 이상, 특수 배관, 폴대 설치, 탑차 필요 시)</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="why-choose-section">
        <div className="why-choose-container">
          <h2 className="why-choose-title">왜 솔트를 선택해야 할까요?</h2>
          <p className="why-choose-subtitle">고객의 안전과 만족을 최우선으로 생각하는 솔트만의 특별한 서비스</p>
          
          <div className="why-choose-grid">
            <div className="why-choose-item">
              <div className="why-choose-icon">
                <img src={`${process.env.PUBLIC_URL}/img/gd-thng/fivestarts.png`} alt="5성급 서비스" />
              </div>
              <h3 className="why-choose-item-title">최고 품질의 서비스</h3>
              <p className="why-choose-item-description">
                업계 최고 수준의 장비와 기술력으로<br />
                고객님께 5성급 보안 서비스를 제공합니다
              </p>
            </div>
            
            <div className="why-choose-item">
              <div className="why-choose-icon">
                <img src={`${process.env.PUBLIC_URL}/img/gd-thng/install.PNG`} alt="전문 설치" />
              </div>
              <h3 className="why-choose-item-title">전문가 직접 설치</h3>
              <p className="why-choose-item-description">
                숙련된 전문 기사가 직접 방문하여<br />
                완벽한 설치와 최적화를 보장합니다
              </p>
            </div>
            
            <div className="why-choose-item">
              <div className="why-choose-icon">
                <img src={`${process.env.PUBLIC_URL}/img/gd-thng/call.png`} alt="평생 안심 고객 지원" />
              </div>
              <h3 className="why-choose-item-title">평생 안심 고객 지원</h3>
              <p className="why-choose-item-description">
                사용 기간 내에 무료 유지보수<br />
                고객 지원 센터: 오전 10시 ~ 오후 6시 (월~금)
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="customer-stats-section" ref={counterRef}>
        <div className="customer-stats-container">
          <div className="customer-stats-text">
            <span className="stats-prefix"><strong className="stats-emphasis">솔트는</strong> 오늘도 </span>
            <span className="customer-stats-number">{customerCount.toLocaleString()}</span>
            <span className="stats-suffix">분의 고객님과 <strong className="stats-emphasis">함께 안전을</strong> 만들어가고 있습니다.</span>
          </div>
        </div>
      </div>
      
      <div className="scheduling-section">
        <div className="scheduling-container">
          <div className="scheduling-image">
            <img src={`${process.env.PUBLIC_URL}/img/calendar-selection.png`} alt="일정 선택" />
          </div>
          <div className="scheduling-content">
            <h2 className="scheduling-title">설치를 희망하는 날짜가 있으신가요?</h2>
            <p className="scheduling-description">
              설치를 희망 하는 날짜와 시간을 선택하여<br/>
              전문 기사의 방문 일정을 예약하세요
            </p>
            <button className="schedule-btn" onClick={() => setIsScheduleModalOpen(true)}>
              예약 신청하기
            </button>
          </div>
        </div>
      </div>
      
      <PriceEstimate />
      
      <div id="packages-section" className="packages-section">
        <div className="packages-container">
          <h2 className="packages-title">추천 패키지</h2>
          <p className="packages-subtitle">고객님의 매장 규모에 맞는 최적의 보안 솔루션을 제공합니다</p>
          
          <div className="packages-grid">
            <div className="package-wrapper">
              <h3 className="package-item-title">20평대 소형 매장</h3>
              <div className="package-item">
                <img src={`${process.env.PUBLIC_URL}/img/main-package/pckg1.png`} alt="20평대 소형 매장" />
              </div>
            </div>
            
            <div className="package-wrapper">
              <h3 className="package-item-title">30 ~ 40평대 중형 매장</h3>
              <div className="package-item">
                <img src={`${process.env.PUBLIC_URL}/img/main-package/pckg2.png`} alt="30 ~ 40평대 중형 매장" />
              </div>
            </div>
            
            <div className="package-wrapper">
              <h3 className="package-item-title">40평 ~ 100평 미만 대형 매장</h3>
              <div className="package-item">
                <img src={`${process.env.PUBLIC_URL}/img/main-package/pckg3.png`} alt="40평 ~ 100평 미만 대형 매장" />
              </div>
            </div>
            
            <div className="package-wrapper">
              <h3 className="package-item-title">무인 매장</h3>
              <div className="package-item">
                <img src={`${process.env.PUBLIC_URL}/img/main-package/pckg4.png`} alt="무인 매장" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="resolution-section" className="resolution-section">
        <div className="resolution-container">
          <h2 className="resolution-title">화질 비교</h2>
          <p className="resolution-subtitle">선명한 화질로 더욱 안전한 보안을 제공합니다</p>
          
          <div className="resolution-grid">
            <div className="resolution-item">
              <h3 className="resolution-item-title">500만 화소</h3>
              <div className="video-wrapper">
                <iframe
                  src="https://www.youtube.com/embed/ypYZr1a4Mwk"
                  title="500만 화소"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              <p className="resolution-description">초고화질로 세밀한 부분까지 선명하게</p>
            </div>
            
            <div className="resolution-item">
              <h3 className="resolution-item-title">210만 화소</h3>
              <div className="video-wrapper">
                <iframe
                  src="https://www.youtube.com/embed/mdsZIbqVAe4"
                  title="210만 화소"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              <p className="resolution-description">기본 화질로 경제적인 보안</p>
            </div>
          </div>
        </div>
      </div>

      <div className="installation-section">
        <div className="installation-container">
          <div className="installation-content">
            <div className="installation-text">
              <h2 className="installation-title">수십년간 검증된 솔트의 전문 설치</h2>
              <p className="installation-description">
                숙련된 전문가가 직접 방문하여 현장에 최적화된 위치에 설치합니다.<br/>
                설치부터 사후관리까지 모든 과정을 책임지고 관리합니다.
              </p>
              <ul className="installation-features">
                <li>전문 설치 기사 방문</li>
                <li>현장 맞춤형 설치</li>
                <li>설치 후 동작 테스트 및 사용법 안내</li>
                <li>사용기간 내 고장날 시 무상 교체</li>
              </ul>
            </div>
            <div className="installation-image">
              <img src={`${process.env.PUBLIC_URL}/img/vectors/install.png`} alt="전문 설치" />
            </div>
          </div>
        </div>
      </div>

      <div className="locations-section">
        <div className="locations-container">
          <h2 className="locations-title">다양한 설치사례</h2>
          <p className="locations-subtitle">다양한 공간에서 신뢰받는 솔트의 보안 솔루션</p>
          
          <div className="locations-grid">
            <div className="location-item">
              <div className="location-image-wrapper">
                <img src={`${process.env.PUBLIC_URL}/img/whereever/store.jpg`} alt="매장" className="location-bg" />
                <div className="location-overlay"></div>
                <img src={`${process.env.PUBLIC_URL}/img/price-est/cameraDVR/inside210.png`} alt="Camera" className="location-cam-overlay" />
                <span className="location-text-overlay">매장</span>
                <p className="location-description">의류·음식점·카페·미용실 등 다양한<br/>매장에 맞춤형 보안 솔루션을 제공합니다.</p>
              </div>
            </div>
            
            <div className="location-item">
              <div className="location-image-wrapper">
                <img src={`${process.env.PUBLIC_URL}/img/whereever/gym.jpg`} alt="헬스장" className="location-bg" />
                <div className="location-overlay"></div>
                <img src={`${process.env.PUBLIC_URL}/img/price-est/cameraDVR/inside210.png`} alt="Camera" className="location-cam-overlay" />
                <span className="location-text-overlay">헬스장</span>
                <p className="location-description">온도 감지 센서와 통합 보안 솔루션으로<br/>쾌적함은 물론, 안전까지 책임집니다.</p>
              </div>
            </div>
            
            <div className="location-item">
              <div className="location-image-wrapper">
                <img src={`${process.env.PUBLIC_URL}/img/whereever/bookstore.jpg`} alt="서점" className="location-bg" />
                <div className="location-overlay"></div>
                <img src={`${process.env.PUBLIC_URL}/img/price-est/cameraDVR/inside210.png`} alt="Camera" className="location-cam-overlay" />
                <span className="location-text-overlay">서점</span>
                <p className="location-description">화재 감지 센서와 첨단 보안 솔루션으로<br/>소중한 공간과 자산을 안전하게 보호합니다.</p>
              </div>
            </div>
            
            <div className="location-item">
              <div className="location-image-wrapper">
                <img src={`${process.env.PUBLIC_URL}/img/whereever/parkinglot.jpg`} alt="주차장" className="location-bg" />
                <div className="location-overlay"></div>
                <img src={`${process.env.PUBLIC_URL}/img/price-est/cameraDVR/inside210.png`} alt="Camera" className="location-cam-overlay" />
                <span className="location-text-overlay">주차장</span>
                <p className="location-description">500만 화소 초고화질 CCTV로 차량<br/>입출차를 선명하고 정확하게 관리합니다.</p>
              </div>
            </div>
            
            <div className="location-item">
              <div className="location-image-wrapper">
                <img src={`${process.env.PUBLIC_URL}/img/whereever/mall.jpg`} alt="쇼핑센터" className="location-bg" />
                <div className="location-overlay"></div>
                <img src={`${process.env.PUBLIC_URL}/img/price-est/cameraDVR/inside210.png`} alt="Camera" className="location-cam-overlay" />
                <span className="location-text-overlay">쇼핑센터</span>
                <p className="location-description">500만 화소 초고화질 CCTV로 대형<br/>쇼핑센터의 보안을 빈틈없이 관리합니다.</p>
              </div>
            </div>
            
            <div className="location-item">
              <div className="location-image-wrapper">
                <img src={`${process.env.PUBLIC_URL}/img/whereever/office.jpg`} alt="오피스" className="location-bg" />
                <div className="location-overlay"></div>
                <img src={`${process.env.PUBLIC_URL}/img/price-est/cameraDVR/inside210.png`} alt="Camera" className="location-cam-overlay" />
                <span className="location-text-overlay">오피스</span>
                <p className="location-description">지문·카드 출입통제로 사무실과 학원을<br/>더욱 안전하고 체계적으로 보호합니다.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Modal */}
      {isScheduleModalOpen && (
        <div className="modal-overlay" onClick={() => setIsScheduleModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsScheduleModalOpen(false)}>×</button>
            <h2 className="modal-title">
              설치를 희망하는 날짜와 시간을 알려주세요.<br/>
              <span className="modal-note">설치팀의 일정에 따라 조정될 수 있습니다.</span>
            </h2>
            
            <form onSubmit={handleScheduleSubmit}>
              <div className="datetime-content-modal">
                <div className="calendar-section">
                  <h4 className="section-label">방문 날짜 선택 *</h4>
                  <div className="calendar-header">
                    <button 
                      type="button"
                      className="month-nav-btn" 
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                    >
                      ◀
                    </button>
                    <h3>{currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월</h3>
                    <button 
                      type="button"
                      className="month-nav-btn" 
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                    >
                      ▶
                    </button>
                  </div>
                  <table className="calendar">
                    <thead>
                      <tr>
                        <th>일</th>
                        <th>월</th>
                        <th>화</th>
                        <th>수</th>
                        <th>목</th>
                        <th>금</th>
                        <th>토</th>
                      </tr>
                    </thead>
                    <tbody>
                      {generateCalendar().map((week, weekIndex) => (
                        <tr key={weekIndex}>
                          {week.map((dayInfo, dayIndex) => (
                            <td key={dayIndex}>
                              {dayInfo && (
                                <button
                                  type="button"
                                  className={`calendar-day ${!dayInfo.isAvailable ? 'disabled' : ''} ${selectedDate && selectedDate.getTime() === dayInfo.date.getTime() ? 'selected' : ''}`}
                                  onClick={() => dayInfo.isAvailable && setSelectedDate(dayInfo.date)}
                                  disabled={!dayInfo.isAvailable}
                                >
                                  {dayInfo.day}
                                </button>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="time-section">
                  <h4 className="section-label">방문 시간 선택 *</h4>
                  <div className="time-group">
                    <h5>오전</h5>
                    <div className="time-slots">
                      {timeSlots.morning.map(time => (
                        <button
                          key={time}
                          type="button"
                          className={`time-slot ${selectedTime === time ? 'selected' : ''}`}
                          onClick={() => setSelectedTime(time)}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="time-group">
                    <h5>오후</h5>
                    <div className="time-slots">
                      {timeSlots.afternoon.map(time => (
                        <button
                          key={time}
                          type="button"
                          className={`time-slot ${selectedTime === time ? 'selected' : ''}`}
                          onClick={() => setSelectedTime(time)}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>연락처 *</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={scheduleForm.phoneNumber}
                  onChange={handlePhoneChange}
                  placeholder="010-0000-0000"
                  maxLength="13"
                  required
                />
              </div>

              <div className="form-group">
                <label>주소 *</label>
                <input
                  type="text"
                  name="address"
                  value={scheduleForm.address}
                  onChange={handleInputChange}
                  placeholder="주소를 입력하세요"
                  required
                />
              </div>

              <div className="form-group">
                <label>실내 카메라 *</label>
                <div className="quantity-control">
                  <button type="button" className="qty-btn" onClick={() => handleQuantityChange('indoorCount', -1)}>−</button>
                  <span className="qty-value">{scheduleForm.indoorCount}</span>
                  <button type="button" className="qty-btn" onClick={() => handleQuantityChange('indoorCount', 1)}>+</button>
                </div>
              </div>

              <div className="form-group">
                <label>실외 카메라 *</label>
                <div className="quantity-control">
                  <button type="button" className="qty-btn" onClick={() => handleQuantityChange('outdoorCount', -1)}>−</button>
                  <span className="qty-value">{scheduleForm.outdoorCount}</span>
                  <button type="button" className="qty-btn" onClick={() => handleQuantityChange('outdoorCount', 1)}>+</button>
                </div>
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="privacyConsent"
                    checked={scheduleForm.privacyConsent}
                    onChange={handleInputChange}
                    required
                  />
                  <span>개인정보 수집 및 이용에 동의합니다 *</span>
                </label>
              </div>

              <button type="submit" className="modal-submit-btn">
                예약 신청하기
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Chat System */}
      <div className={`chat-button ${isChatOpen || showChatMenu ? 'hidden' : ''}`} onClick={() => setShowChatMenu(true)}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
        </svg>
      </div>

      {/* Chat Menu */}
      {showChatMenu && !isChatOpen && (
        <div className="chat-menu">
          <div className="chat-menu-header">
            <h3>고객센터</h3>
            <button className="chat-close" onClick={() => setShowChatMenu(false)}>×</button>
          </div>
          <div className="chat-menu-options">
            <a href="tel:1522-0687" className="chat-menu-option">
              <div className="menu-icon">📞</div>
              <div className="menu-text">
                <strong>신규가입</strong>
                <span>1522-0687</span>
              </div>
            </a>
            <a href="tel:1644-6674" className="chat-menu-option">
              <div className="menu-icon">🔧</div>
              <div className="menu-text">
                <strong>A/S문의</strong>
                <span>1644-6674</span>
              </div>
            </a>
            <button className="chat-menu-option" onClick={() => alert('상담 시간: 평일 09:00 - 18:00')}>
              <div className="menu-icon">🕐</div>
              <div className="menu-text">
                <strong>상담시간</strong>
                <span>평일 오전 9시 ~ 오후 6시</span>
              </div>
            </button>
            <button
              className="chat-menu-option"
              onClick={() => {
                if (isWithinChatHours()) {
                  handleStartChatRequest();
                } else {
                  alert('지금은 상담 시간이 아닙니다. \n평일 오전 10시 ~ 오후 6시에 다시 문의해 주세요.');
                }
              }}
              style={!isWithinChatHours() ? { opacity: 0.45, cursor: 'not-allowed' } : {}}
            >
              <div className="menu-icon">💬</div>
              <div className="menu-text">
                <strong>상담원과 채팅하기</strong>
                {isWithinChatHours() ? (
                  <span>실시간 문의 이용시간 <br />이용시간: 평일 오전 10시 ~ 오후 6시</span>
                ) : (
                  <span style={{ color: '#e53935' }}>지금은 상담 시간이 아닙니다.<br />이용시간: 평일 오전 10시 ~ 오후 6시</span>
                )}
              </div>
            </button>
            <button className="chat-menu-option" onClick={() => { setShowChatMenu(false); setShowQuestionForm(true); }}>
              <div className="menu-icon">📝</div>
              <div className="menu-text">
                <strong>질문 남기기</strong>
                <span>전화번호 남기고 답변 받기</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Question Form */}
      {showQuestionForm && (
        <div className="chat-box">
          <div className="chat-header">
            <h3>질문 남기기</h3>
            <button className="chat-close" onClick={() => setShowQuestionForm(false)}>×</button>
          </div>
          <div className="question-form-container">
            <div className="question-form-intro">
              <p>전화번호와 질문을 남겨주시면</p>
              <p>빠른 시일 내에 연락드리겠습니다.</p>
            </div>
            <form onSubmit={handleQuestionSubmit} className="question-form">
              <div className="form-group">
                <label htmlFor="phone">전화번호 *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={questionForm.phone}
                  onChange={handleQuestionFormChange}
                  placeholder="010-1234-5678"
                  required
                  pattern="[0-9]{3}-[0-9]{4}-[0-9]{4}"
                  className="question-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="question">질문 내용 *</label>
                <textarea
                  id="question"
                  name="question"
                  value={questionForm.question}
                  onChange={handleQuestionFormChange}
                  placeholder="궁금하신 내용을 자세히 입력해주세요..."
                  required
                  rows="8"
                  className="question-textarea"
                />
              </div>
              <button type="submit" className="question-submit-btn">
                질문 등록하기
              </button>
            </form>
          </div>
        </div>
      )}

      {isChatOpen && (
        <div className="chat-box">
          <div className="chat-header">
            <h3>상담 채팅</h3>
            <button className="chat-close" onClick={handleCloseChatFromCustomer}>×</button>
          </div>
          
          {chatStatus === 'pending' && (
            <div className="chat-status-message">
              <div className="status-icon">⏳</div>
              <p>상담원 연결 중입니다...</p>
              <p className="status-subtitle">잠시만 기다려주세요</p>
            </div>
          )}

          {chatStatus === 'ended' && (
            <div className="chat-status-message">
              <div className="status-icon">👋</div>
              <p>상담이 종료되었습니다</p>
              <p className="status-subtitle">이용해 주셔서 감사합니다</p>
              <button
                onClick={() => {
                  // Create new session for new chat
                  const newSessionId = `customer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                  localStorage.setItem('chatSessionId', newSessionId);
                  setChatSessionId(newSessionId);
                  setChatStatus(null);
                  setChatMessages([]);
                  setIsChatOpen(false);
                  setShowChatMenu(true);
                }}
                style={{
                  marginTop: '20px',
                  padding: '12px 32px',
                  background: '#0099b0',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
              >
                새 상담 시작하기
              </button>
              {chatMessages.length > 0 && (
                <div className="chat-messages-readonly" ref={chatMessagesRef}>
                  {chatMessages.map(message => (
                    <div key={message.id} className={`chat-message ${message.sender}`}>
                      {message.sender === 'employee' && message.employeeName && (
                        <div className="message-sender-name">{message.employeeName} 상담사</div>
                      )}
                      <div className="message-content">{message.text}</div>
                      <div className="message-time">
                        {new Date(message.timestamp).toLocaleTimeString('ko-KR', { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          timeZone: 'Asia/Seoul'
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {chatStatus === 'active' && (
            <>
              <div className="chat-messages" ref={chatMessagesRef}>
                {chatMessages.length === 0 ? (
                  <div className="chat-welcome">
                    <p>안녕하세요! 솔트 CCTV입니다.</p>
                    <p>무엇을 도와드릴까요?</p>
                  </div>
                ) : (
                  chatMessages.map(message => (
                    <div key={message.id} className={`chat-message ${message.sender}`}>
                      {message.sender === 'employee' && message.employeeName && (
                        <div className="message-sender-name">{message.employeeName} 상담사</div>
                      )}
                      <div className="message-content">{message.text}</div>
                      <div className="message-time">
                        {new Date(message.timestamp).toLocaleTimeString('ko-KR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="chat-input-container">
                <input
                  type="text"
                  className="chat-input"
                  placeholder="메시지를 입력하세요..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={handleChatKeyPress}
                />
                <button className="chat-send-btn" onClick={handleChatSend}>
                  전송
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <footer className="footer">
        <div className="footer-container">
          <div className="footer-info">
            <span>OK CCTV</span>
            <span className="footer-divider">|</span>
            <span>대표번호 1522-0687</span>
            <span className="footer-divider">|</span>
            <span>서울특별시 송파구 가락로 113 금도빌딩 5층</span>
            <span className="footer-divider">|</span>
            <span>사업자등록번호 665-13-01752</span>
            <span className="footer-divider">|</span>
            <span>대표자 : 이호혁</span>
          </div>
          <div className="footer-copyright">
            COPYRIGHT ⓒ 2022 BY OK CCTV ALL Rights Reserved. www.saltcctv.com
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
