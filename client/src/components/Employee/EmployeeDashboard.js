import React, { useState, useEffect, useRef } from 'react';
import { priceEstimateAPI, authAPI, notificationsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import '../Customer/Dashboard.css';
import doorbellSound from '../../assets/doorbell.wav';
import positiveSound from '../../assets/positive.wav';

// Format date as "26.02.02 오전 04:25" in KST
const formatDate = (dateInput) => {
  if (!dateInput) return '';
  // Parse Korean locale string: "2026. 2. 2. 오전 4:25:00"
  const koreanMatch = String(dateInput).match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.\s*(오전|오후)\s*(\d{1,2}):(\d{2})/);
  if (koreanMatch) {
    const [, year, month, day, meridiem, hour, minute] = koreanMatch;
    return `${String(year).slice(2)}.${String(month).padStart(2,'0')}.${String(day).padStart(2,'0')} ${meridiem} ${String(hour).padStart(2,'0')}:${minute}`;
  }
  // For ISO strings or Date objects
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return String(dateInput);
    const parts = new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: true
    }).formatToParts(date);
    const p = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return `${String(p.year).slice(2)}.${p.month}.${p.day} ${p.dayPeriod} ${p.hour}:${p.minute}`;
  } catch { return String(dateInput); }
};

// Format address to split into multiple lines based on length
const formatAddress = (address) => {
  if (!address) return '-';
  const len = address.length;
  if (len <= 15) return address;
  if (len <= 30) {
    // Split in half
    const mid = Math.ceil(len / 2);
    const spaceIndex = address.indexOf(' ', mid - 5);
    const splitAt = spaceIndex > 0 && spaceIndex < mid + 5 ? spaceIndex : mid;
    return (
      <>
        {address.slice(0, splitAt)}<br/>
        {address.slice(splitAt).trim()}
      </>
    );
  }
  // Split in three
  const third = Math.ceil(len / 3);
  let first = address.indexOf(' ', third - 3);
  if (first < 0 || first > third + 3) first = third;
  let second = address.indexOf(' ', first + third - 3);
  if (second < 0 || second > first + third + 3) second = first + third;
  return (
    <>
      {address.slice(0, first)}<br/>
      {address.slice(first, second).trim()}<br/>
      {address.slice(second).trim()}
    </>
  );
};

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [estimateSubTab, setEstimateSubTab] = useState('inProgress');
  const [sheetEstimates, setSheetEstimates] = useState({ 
    quickEstimates: [], 
    saltConsultations: [], 
    ktConsultations: [] 
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [selectedEstimate, setSelectedEstimate] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isEditingDetail, setIsEditingDetail] = useState(false);
  const [editedEstimate, setEditedEstimate] = useState(null);
  const [memos, setMemos] = useState({});
  const [editingMemo, setEditingMemo] = useState(null);
  const [memoText, setMemoText] = useState('');
  const [statuses, setStatuses] = useState({});
  const [activeMainTab, setActiveMainTab] = useState('estimates'); // New state for main tabs
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedChatRoom, setSelectedChatRoom] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [chatSubTab, setChatSubTab] = useState('pending'); // 'pending', 'active', 'ended'
  const [customerQuestions, setCustomerQuestions] = useState([]);
  const [pendingEmployees, setPendingEmployees] = useState([]);
  const [currentPage, setCurrentPage] = useState({
    inProgress: 0,
    completed: 0,
    pendingChat: 0,
    activeChat: 0,
    endedChat: 0,
    questions: 0
  });
  const [hasNewItems, setHasNewItems] = useState(false);
  const chatMessagesRef = useRef(null);
  const prevPendingChatCount = useRef(null);
  const prevEstimatesCount = useRef(null);
  const prevQuestionsCount = useRef(null);
  const prevActiveChatsUnreadCount = useRef(null);
  const originalTitleRef = useRef('직원 대시보드');
  const ITEMS_PER_PAGE = 20;

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Load memos from localStorage
    const savedMemos = localStorage.getItem('estimateMemos');
    if (savedMemos) {
      setMemos(JSON.parse(savedMemos));
    }
    // Load statuses from localStorage
    const savedStatuses = localStorage.getItem('estimateStatuses');
    if (savedStatuses) {
      setStatuses(JSON.parse(savedStatuses));
    }
    // Load chat rooms from localStorage
    loadChatRooms();
    // Load customer questions from localStorage
    loadQuestions();

    // Load pending employees (admin only)
    if (user?.name === '이승연') {
      loadPendingEmployees();
    }

    // Continuous polling for real-time updates (silent background updates)
    const estimatesInterval = setInterval(() => {
      fetchData(false); // false = don't show loading indicator
    }, 5000); // Poll Google Sheets every 5 seconds

    const chatsInterval = setInterval(() => {
      loadChatRooms();
    }, 2000); // Poll chats every 2 seconds

    const questionsInterval = setInterval(() => {
      loadQuestions();
    }, 2000); // Poll questions every 2 seconds

    const pendingInterval = user?.name === '이승연'
      ? setInterval(loadPendingEmployees, 30000)
      : null;

    return () => {
      clearInterval(estimatesInterval);
      clearInterval(chatsInterval);
      clearInterval(questionsInterval);
      if (pendingInterval) clearInterval(pendingInterval);
    };
  }, []);

  // Browser tab notification when new items arrive (static, no blinking)
  useEffect(() => {
    if (hasNewItems) {
      document.title = '🔴🔴🔴 새 알림 🔴🔴🔴';
    } else {
      document.title = originalTitleRef.current;
    }
  }, [hasNewItems]);

  // Clear new items notification when window gets focus and immediately refresh data
  useEffect(() => {
    const handleFocus = () => {
      setHasNewItems(false);
    };
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Immediately refresh all data when tab becomes visible
        fetchData(false);
        loadChatRooms();
        loadQuestions();
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.title = originalTitleRef.current;
    };
  }, []);

  const loadChatRooms = async () => {
    try {
      const res = await notificationsAPI.getChats();
      if (res.data && res.data.chats) {
        const rooms = res.data.chats.map(chat => ({
          id: chat.sessionId,
          customerName: chat.customerName || '고객',
          messages: chat.messages || [],
          status: chat.status || 'pending',
          createdAt: chat.createdAt,
          acceptedBy: chat.acceptedBy,
          acceptedAt: chat.acceptedAt,
          endedAt: chat.endedAt,
          endedBy: chat.endedBy,
          lastMessage: chat.messages?.[chat.messages.length - 1],
          unreadCount: chat.messages?.filter(m => m.sender === 'user' && !m.read).length || 0
        }));
        setChatRooms(rooms);
        
        // Auto-update selected chat room if it has new messages
        setSelectedChatRoom(prev => {
          if (!prev) return prev;
          const updatedRoom = rooms.find(r => r.id === prev.id);
          if (updatedRoom && updatedRoom.messages.length !== prev.messages.length) {
            return updatedRoom;
          }
          return prev;
        });
      }
    } catch (err) {
      console.error('Failed to load chats:', err);
    }
  };

  const loadQuestions = async () => {
    try {
      const res = await notificationsAPI.getQuestions();
      if (res.data && res.data.questions) {
        setCustomerQuestions(res.data.questions);
      }
    } catch (e) {
      console.error('Failed to load questions:', e);
    }
  };

  const loadPendingEmployees = async () => {
    try {
      const res = await authAPI.getPendingEmployees();
      setPendingEmployees(res.data);
    } catch (e) {
      console.error('Failed to load pending employees', e);
    }
  };

  const handleApproveEmployee = async (id) => {
    try {
      await authAPI.approveEmployee(id);
      setPendingEmployees(prev => prev.filter(e => e._id !== id));
    } catch (e) {
      alert('승인 중 오류가 발생했습니다.');
    }
  };

  const handleRejectEmployee = async (id, name) => {
    if (!window.confirm(`${name} 요청을 거절하시겠습니까?`)) return;
    try {
      await authAPI.rejectEmployee(id);
      setPendingEmployees(prev => prev.filter(e => e._id !== id));
    } catch (e) {
      alert('거절 중 오류가 발생했습니다.');
    }
  };

  const handleMarkQuestionAsRead = async (questionId) => {
    const updatedQuestions = customerQuestions.map(q =>
      (q._id || q.id) === questionId ? { ...q, read: true } : q
    );
    setCustomerQuestions(updatedQuestions);
    try {
      await notificationsAPI.markQuestionRead(questionId, true);
    } catch (e) {
      console.error('Failed to mark question as read:', e);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    const updatedQuestions = customerQuestions.filter(q => (q._id || q.id) !== questionId);
    setCustomerQuestions(updatedQuestions);
    try {
      await notificationsAPI.deleteQuestion(questionId);
    } catch (e) {
      console.error('Failed to delete question:', e);
    }
  };

  // Remove estimate from UI (in-progress and completed)
  const handleDeleteEstimate = (estimateId) => {
    setSheetEstimates(prev => ({
      ...prev,
      saltConsultations: prev.saltConsultations.filter(e => (e.id || `${e.type}-${e.submittedAt}`) !== estimateId),
      ktConsultations: prev.ktConsultations.filter(e => (e.id || `${e.type}-${e.submittedAt}`) !== estimateId),
      quickEstimates: prev.quickEstimates.filter(e => (e.id || `${e.type}-${e.submittedAt}`) !== estimateId)
    }));
    setMemos(prev => {
      const copy = { ...prev };
      delete copy[estimateId];
      return copy;
    });
    setStatuses(prev => {
      const copy = { ...prev };
      delete copy[estimateId];
      return copy;
    });
  };

  // Auto-scroll to bottom when chat room or messages change
  useEffect(() => {
    if (chatMessagesRef.current && selectedChatRoom) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [selectedChatRoom]);

  // Play doorbell sound when a new pending chat arrives
  useEffect(() => {
    const pendingCount = chatRooms.filter(r => r.status === 'pending').length;
    if (prevPendingChatCount.current !== null && pendingCount > prevPendingChatCount.current) {
      setHasNewItems(true);
      try {
        const audio = new Audio(doorbellSound);
        audio.volume = 0.8;
        audio.play().catch(err => console.log('Audio play failed:', err));
      } catch (e) {
        console.log('Audio error:', e);
      }
      // Show browser notification when tab is hidden
      if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('새 채팅 요청', { body: '새로운 채팅 상담 요청이 있습니다.', icon: '/favicon.ico' });
      }
    }
    prevPendingChatCount.current = pendingCount;
  }, [chatRooms]);

  // Play positive sound when a new estimate submission arrives
  useEffect(() => {
    const count = (sheetEstimates.saltConsultations?.length || 0) + (sheetEstimates.ktConsultations?.length || 0);
    if (prevEstimatesCount.current !== null && count > prevEstimatesCount.current) {
      setHasNewItems(true);
      try {
        const audio = new Audio(positiveSound);
        audio.volume = 0.8;
        audio.play().catch(err => console.log('Audio play failed:', err));
      } catch (e) {
        console.log('Audio error:', e);
      }
      // Show browser notification when tab is hidden
      if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('새 상담 신청', { body: '새로운 상담 신청이 접수되었습니다.', icon: '/favicon.ico' });
      }
    }
    prevEstimatesCount.current = count;
  }, [sheetEstimates]);

  // Play positive sound when a new question arrives
  useEffect(() => {
    const count = customerQuestions.length;
    if (prevQuestionsCount.current !== null && count > prevQuestionsCount.current) {
      setHasNewItems(true);
      try {
        const audio = new Audio(positiveSound);
        audio.volume = 0.8;
        audio.play().catch(err => console.log('Audio play failed:', err));
      } catch (e) {
        console.log('Audio error:', e);
      }
      // Show browser notification when tab is hidden
      if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('새 고객 질문', { body: '새로운 고객 질문이 접수되었습니다.', icon: '/favicon.ico' });
      }
    }
    prevQuestionsCount.current = count;
  }, [customerQuestions]);

  // Play sound when new message arrives in active chats
  useEffect(() => {
    // Count total unread messages from user in active chats
    const totalUnread = chatRooms
      .filter(r => r.status === 'active')
      .reduce((sum, r) => sum + (r.unreadCount || 0), 0);
    
    if (prevActiveChatsUnreadCount.current !== null && totalUnread > prevActiveChatsUnreadCount.current) {
      setHasNewItems(true);
      try {
        const audio = new Audio(positiveSound);
        audio.volume = 0.8;
        audio.play().catch(err => console.log('Audio play failed:', err));
      } catch (e) {
        console.log('Audio error:', e);
      }
      // Show browser notification when tab is hidden
      if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('새 채팅 메시지', { body: '고객으로부터 새 메시지가 도착했습니다.', icon: '/favicon.ico' });
      }
    }
    prevActiveChatsUnreadCount.current = totalUnread;
  }, [chatRooms]);

  const fetchData = async (showLoadingIndicator = true) => {
    try {
      if (showLoadingIndicator) {
        setLoading(true);
        setMessage('');
      }
      
      console.log('📊 Fetching Google Sheets data...');
      const sheetRes = await priceEstimateAPI.getSheetData();
      console.log('📊 Sheet data:', sheetRes.data);
      
      const quickCount = sheetRes.data.quickEstimates?.length || 0;
      const saltCount = sheetRes.data.saltConsultations?.length || 0;
      const ktCount = sheetRes.data.ktConsultations?.length || 0;
      
      console.log(`✓ Google Sheets data received:`, {
        quickEstimates: quickCount,
        saltConsultations: saltCount,
        ktConsultations: ktCount,
        total: quickCount + saltCount + ktCount
      });
      
      // Apply saved edits from localStorage
      const savedEdits = JSON.parse(localStorage.getItem('estimateEdits') || '{}');
      const applyEdits = (list) => list.map(e => {
        const eId = e.id || `${e.type}-${e.submittedAt}`;
        return savedEdits[eId] ? { ...e, ...savedEdits[eId] } : e;
      });
      
      setSheetEstimates({
        quickEstimates: applyEdits(sheetRes.data.quickEstimates || []),
        saltConsultations: applyEdits(sheetRes.data.saltConsultations || []),
        ktConsultations: applyEdits(sheetRes.data.ktConsultations || [])
      });
    } catch (error) {
      console.error('❌ Error fetching sheet data:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      if (showLoadingIndicator) {
        setMessage('Google Sheets 데이터를 불러올 수 없습니다: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      if (showLoadingIndicator) {
        setLoading(false);
      }
    }
  };

  const handleViewDetails = (estimate) => {
    setSelectedEstimate(estimate);
    setEditedEstimate({ ...estimate });
    setIsEditingDetail(false);
    setShowDetailModal(true);
  };

  const handleSaveEditedEstimate = () => {
    const estimateId = editedEstimate.id || `${editedEstimate.type}-${editedEstimate.submittedAt}`;
    
    // Save edited estimate to localStorage
    const savedEdits = JSON.parse(localStorage.getItem('estimateEdits') || '{}');
    savedEdits[estimateId] = editedEstimate;
    localStorage.setItem('estimateEdits', JSON.stringify(savedEdits));
    
    // Also update memos if memo was edited
    if (editedEstimate.memo !== undefined) {
      const newMemos = { ...memos, [estimateId]: editedEstimate.memo };
      setMemos(newMemos);
      localStorage.setItem('estimateMemos', JSON.stringify(newMemos));
    }
    
    // Update the sheet estimates with edited data
    setSheetEstimates(prev => {
      const updateList = (list) => list.map(e => {
        const eId = e.id || `${e.type}-${e.submittedAt}`;
        return eId === estimateId ? { ...e, ...editedEstimate } : e;
      });
      return {
        ...prev,
        quickEstimates: updateList(prev.quickEstimates),
        saltConsultations: updateList(prev.saltConsultations),
        ktConsultations: updateList(prev.ktConsultations)
      };
    });
    
    setSelectedEstimate(editedEstimate);
    setIsEditingDetail(false);
    setMessage('저장되었습니다');
    setTimeout(() => setMessage(''), 2000);
  };

  const handleEditFieldChange = (field, value) => {
    setEditedEstimate(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveMemo = (estimateId) => {
    const newMemos = { ...memos, [estimateId]: memoText };
    setMemos(newMemos);
    localStorage.setItem('estimateMemos', JSON.stringify(newMemos));
    setEditingMemo(null);
    setMemoText('');
  };

  const handleEditMemo = (estimateId, sheetMemo = '') => {
    setEditingMemo(estimateId);
    setMemoText(memos[estimateId] || sheetMemo || '');
  };

  const handleStatusChange = (estimateId, newStatus) => {
    const updatedStatuses = {
      ...statuses,
      [estimateId]: newStatus
    };
    setStatuses(updatedStatuses);
    localStorage.setItem('estimateStatuses', JSON.stringify(updatedStatuses));
  };

  const handleSelectChatRoom = async (room) => {
    setSelectedChatRoom(room);
    // Mark user messages as read
    try {
      await notificationsAPI.markMessagesRead(room.id, 'user');
      loadChatRooms();
    } catch (err) {
      console.error('Failed to mark messages as read:', err);
    }
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || !selectedChatRoom) return;

    const messageText = chatInput;
    setChatInput('');

    try {
      const res = await notificationsAPI.sendMessage(selectedChatRoom.id, {
        text: messageText,
        sender: 'employee',
        employeeName: user?.name || '직원'
      });
      
      if (res.data && res.data.chat) {
        // Update local state
        setSelectedChatRoom(prev => ({
          ...prev,
          messages: res.data.chat.messages
        }));
        loadChatRooms();
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleChatKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendChatMessage();
    }
  };

  const handleAcceptChat = async (room) => {
    try {
      const res = await notificationsAPI.acceptChat(room.id, user?.name || '직원');
      if (res.data && res.data.chat) {
        loadChatRooms();
        setChatSubTab('active');
        setSelectedChatRoom({ ...room, status: 'active', acceptedBy: user?.name || '직원' });
      }
    } catch (err) {
      console.error('Failed to accept chat:', err);
    }
  };

  const handleRejectChat = async (room) => {
    try {
      await notificationsAPI.deleteChat(room.id);
      loadChatRooms();
      setSelectedChatRoom(null);
    } catch (err) {
      console.error('Failed to reject chat:', err);
    }
  };

  const handleEndChat = async (room) => {
    try {
      await notificationsAPI.endChat(room.id, user?.name || '직원');
      loadChatRooms();
      setSelectedChatRoom(null);
      setChatSubTab('ended');
    } catch (err) {
      console.error('Failed to end chat:', err);
    }
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  // 진행 중: 간편 신청 제외, SALT/KT 정식 상담 신청만
  const consultationEstimates = [
    ...(sheetEstimates.saltConsultations || []).map(e => ({ ...e, type: e.cameraType ? '정식 상담 신청' : '간편 신청' })),
    ...(sheetEstimates.ktConsultations || []).map(e => ({ ...e, type: e.cameraType ? 'KT 정식 상담 신청' : '간편 신청' }))
  ];

  // Filter by status
  const inProgressEstimates = consultationEstimates.filter(estimate => {
    const estimateId = estimate.id || `${estimate.type}-${estimate.submittedAt}`;
    const status = statuses[estimateId] || '대기중';
    return status !== '상담완료' && status !== '계약완료';
  });

  const completedEstimates = consultationEstimates.filter(estimate => {
    const estimateId = estimate.id || `${estimate.type}-${estimate.submittedAt}`;
    const status = statuses[estimateId] || '대기중';
    return status === '상담완료' || status === '계약완료';
  });

  const 상담완료Count = completedEstimates.filter(estimate => {
    const estimateId = estimate.id || `${estimate.type}-${estimate.submittedAt}`;
    return statuses[estimateId] === '상담완료';
  }).length;

  const 계약완료Count = completedEstimates.filter(estimate => {
    const estimateId = estimate.id || `${estimate.type}-${estimate.submittedAt}`;
    return statuses[estimateId] === '계약완료';
  }).length;

  const 계약률 = (상담완료Count + 계약완료Count) > 0
    ? Math.round((계약완료Count / (상담완료Count + 계약완료Count)) * 100)
    : 0;

  // Pagination logic
  const getPaginatedData = (data, page) => {
    const startIndex = page * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (dataLength) => {
    return Math.ceil(dataLength / ITEMS_PER_PAGE);
  };

  const handlePageChange = (section, direction) => {
    setCurrentPage(prev => ({
      ...prev,
      [section]: Math.max(0, prev[section] + direction)
    }));
  };

  // Paginated data
  const paginatedInProgress = getPaginatedData(inProgressEstimates, currentPage.inProgress);
  const paginatedCompleted = getPaginatedData(completedEstimates, currentPage.completed);
  const paginatedPendingChats = getPaginatedData(chatRooms.filter(r => r.status === 'pending'), currentPage.pendingChat);
  const paginatedActiveChats = getPaginatedData(chatRooms.filter(r => r.status === 'active'), currentPage.activeChat);
  const paginatedEndedChats = getPaginatedData(chatRooms.filter(r => r.status === 'ended'), currentPage.endedChat);
  const paginatedQuestions = getPaginatedData(customerQuestions, currentPage.questions);

  // Pagination controls component
  const PaginationControls = ({ section, dataLength, currentPageNum }) => {
    const totalPages = getTotalPages(dataLength);
    if (totalPages <= 1) return null;

    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        gap: '15px',
        marginTop: '20px',
        padding: '10px'
      }}>
        <button
          onClick={() => handlePageChange(section, -1)}
          disabled={currentPageNum === 0}
          style={{
            padding: '8px 16px',
            background: currentPageNum === 0 ? '#ccc' : '#0099b0',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: currentPageNum === 0 ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: '600'
          }}
        >
          ← 이전
        </button>
        <span style={{ fontSize: '14px', fontWeight: '500' }}>
          페이지 {currentPageNum + 1} / {totalPages}
        </span>
        <button
          onClick={() => handlePageChange(section, 1)}
          disabled={currentPageNum >= totalPages - 1}
          style={{
            padding: '8px 16px',
            background: currentPageNum >= totalPages - 1 ? '#ccc' : '#0099b0',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: currentPageNum >= totalPages - 1 ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: '600'
          }}
        >
          다음 →
        </button>
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
          <h1 style={{ margin: 0 }}>직원 대시보드</h1>
          <div style={{ position: 'relative', display: 'inline-block' }}
            onMouseEnter={e => e.currentTarget.querySelector('.sound-tooltip').style.display = 'block'}
            onMouseLeave={e => e.currentTarget.querySelector('.sound-tooltip').style.display = 'none'}
          >
            <button
              onClick={() => {
                const d = new Audio(doorbellSound); d.volume = 0.8; d.play();
                setTimeout(() => { const p = new Audio(positiveSound); p.volume = 0.8; p.play(); }, 1500);
              }}
              style={{
                background: 'none',
                border: '1px solid #ccc',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#666',
                padding: 0
              }}
              title="알림 소리 테스트"
            >
              🔊
            </button>
            <div className="sound-tooltip" style={{
              display: 'none',
              position: 'absolute',
              top: '36px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#333',
              color: 'white',
              padding: '5px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              whiteSpace: 'nowrap',
              zIndex: 100
            }}>
              알림 소리 테스트
            </div>
          </div>
        </div>
        <p style={{ marginBottom: '30px' }}>환영합니다, {user?.name}님</p>
        
        {message && <div className="alert alert-success">{message}</div>}

        {/* Main Tabs */}
        <div className="main-tabs" style={{ marginBottom: '20px', borderBottom: '2px solid #ddd', display: 'flex', alignItems: 'center' }}>
          <button 
            className={`main-tab ${activeMainTab === 'estimates' ? 'active' : ''}`}
            onClick={() => setActiveMainTab('estimates')}
            style={{ 
              padding: '12px 30px', 
              border: 'none', 
              background: activeMainTab === 'estimates' ? '#0099b0' : 'transparent',
              color: activeMainTab === 'estimates' ? 'white' : '#333',
              cursor: 'pointer',
              borderRadius: '8px 8px 0 0',
              fontSize: '16px',
              fontWeight: '600',
              marginRight: '5px',
              position: 'relative'
            }}
          >
            📋 상담 신청
            {consultationEstimates.filter(estimate => {
              const estimateId = estimate.id || `${estimate.type}-${estimate.submittedAt}`;
              const status = statuses[estimateId] || '대기중';
              return status === '대기중';
            }).length > 0 && (
              <span style={{
                position: 'absolute',
                top: '5px',
                right: '5px',
                background: '#ff4444',
                color: 'white',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {consultationEstimates.filter(estimate => {
                  const estimateId = estimate.id || `${estimate.type}-${estimate.submittedAt}`;
                  const status = statuses[estimateId] || '대기중';
                  return status === '대기중';
                }).length}
              </span>
            )}
          </button>
          <button 
            className={`main-tab ${activeMainTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveMainTab('chat')}
            style={{ 
              padding: '12px 30px', 
              border: 'none', 
              background: activeMainTab === 'chat' ? '#0099b0' : 'transparent',
              color: activeMainTab === 'chat' ? 'white' : '#333',
              cursor: 'pointer',
              borderRadius: '8px 8px 0 0',
              fontSize: '16px',
              fontWeight: '600',
              position: 'relative'
            }}
          >
            💬 채팅
            {(chatRooms.filter(room => room.status === 'pending').length > 0 || 
              chatRooms.filter(r => r.status === 'active').reduce((sum, r) => sum + (r.unreadCount || 0), 0) > 0) && (
              <span style={{
                position: 'absolute',
                top: '5px',
                right: '5px',
                background: '#ff4444',
                color: 'white',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {chatRooms.filter(room => room.status === 'pending').length + 
                 chatRooms.filter(r => r.status === 'active').reduce((sum, r) => sum + (r.unreadCount || 0), 0)}
              </span>
            )}
          </button>
          <button 
            className={`main-tab ${activeMainTab === 'questions' ? 'active' : ''}`}
            onClick={() => setActiveMainTab('questions')}
            style={{ 
              padding: '12px 30px', 
              border: 'none', 
              background: activeMainTab === 'questions' ? '#0099b0' : 'transparent',
              color: activeMainTab === 'questions' ? 'white' : '#333',
              cursor: 'pointer',
              borderRadius: '8px 8px 0 0',
              fontSize: '16px',
              fontWeight: '600',
              position: 'relative',
              marginLeft: '5px'
            }}
          >
            📝 질문 관리
            {customerQuestions.filter(q => !q.read).length > 0 && (
              <span style={{
                position: 'absolute',
                top: '5px',
                right: '5px',
                background: '#ff4444',
                color: 'white',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {customerQuestions.filter(q => !q.read).length}
              </span>
            )}
          </button>
          {/* Admin-only: employee join requests tab */}
          {user?.name === '이승연' && (
            <button
              className={`main-tab ${activeMainTab === 'joinRequests' ? 'active' : ''}`}
              onClick={() => setActiveMainTab('joinRequests')}
              style={{
                padding: '12px 30px',
                border: 'none',
                background: activeMainTab === 'joinRequests' ? '#e53935' : 'transparent',
                color: activeMainTab === 'joinRequests' ? 'white' : '#333',
                cursor: 'pointer',
                borderRadius: '8px 8px 0 0',
                fontSize: '16px',
                fontWeight: '600',
                position: 'relative',
                marginLeft: '5px'
              }}
            >
              👥 직원 권한 요청
              {pendingEmployees.length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '5px',
                  right: '5px',
                  background: '#ff4444',
                  color: 'white',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>{pendingEmployees.length}</span>
              )}
            </button>
          )}
        </div>

        {activeMainTab === 'estimates' ? (
        <div className="card">
          <h3 className="card-header">상담 신청</h3>
          
          <div className="sub-tabs" style={{ marginBottom: '20px', borderBottom: '1px solid #ddd', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
            <button 
              className={`sub-tab ${estimateSubTab === 'inProgress' ? 'active' : ''}`}
              onClick={() => setEstimateSubTab('inProgress')}
              style={{ 
                padding: '10px 20px', 
                border: 'none', 
                background: estimateSubTab === 'inProgress' ? '#0099b0' : 'transparent',
                color: estimateSubTab === 'inProgress' ? 'white' : '#333',
                cursor: 'pointer',
                borderRadius: '5px 5px 0 0',
                fontSize: '15px',
                fontWeight: '500'
              }}
            >
              진행 중 ({inProgressEstimates.length})
            </button>
            <button 
              className={`sub-tab ${estimateSubTab === 'completed' ? 'active' : ''}`}
              onClick={() => setEstimateSubTab('completed')}
              style={{ 
                padding: '10px 20px', 
                border: 'none', 
                background: estimateSubTab === 'completed' ? '#0099b0' : 'transparent',
                color: estimateSubTab === 'completed' ? 'white' : '#333',
                cursor: 'pointer',
                borderRadius: '5px 5px 0 0',
                marginLeft: '5px',
                fontSize: '15px',
                fontWeight: '500'
              }}
            >
              상담완료 ({completedEstimates.length})
            </button>
            </div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', paddingBottom: '8px', fontSize: '13px' }}>
              <span style={{ color: '#555' }}>상담완료 <strong style={{ color: '#0099b0' }}>{상담완료Count}</strong></span>
              <span style={{ color: '#555' }}>계약완료 <strong style={{ color: '#28a745' }}>{계약완료Count}</strong></span>
              <span style={{
                background: 계약률 >= 50 ? '#28a745' : 계약률 >= 30 ? '#ffc107' : '#dc3545',
                color: '#fff',
                padding: '3px 10px',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '13px'
              }}>계약률 {계약률}%</span>
            </div>
          </div>

          {estimateSubTab === 'inProgress' ? (
            inProgressEstimates.length === 0 ? (
              <div>
                <p>진행 중인 상담이 없습니다.</p>
                <p style={{ fontSize: '12px', color: '#666' }}>
                  (SALT: {sheetEstimates.saltConsultations?.length || 0}, 
                   KT: {sheetEstimates.ktConsultations?.length || 0})
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>현황</th>
                      <th>시간</th>
                      <th>타입</th>
                      <th>연락처</th>
                      <th>댓수</th>
                      <th>주소</th>
                      <th>메모</th>
                      <th>작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedInProgress.map((estimate, index) => {
                      const estimateId = estimate.id || `${estimate.type}-${estimate.submittedAt}`;
                      const currentMemo = memos[estimateId] || estimate.memo || '';
                      const isEditing = editingMemo === estimateId;
                      const currentStatus = statuses[estimateId] || '대기중';
                      const indoor = Number(estimate.indoorCount || 0);
                      const outdoor = Number(estimate.outdoorCount || 0);
                      const total = indoor + outdoor;
                      return (
                        <tr key={estimateId}>
                          <td>
                            <select
                              value={currentStatus}
                              onChange={(e) => handleStatusChange(estimateId, e.target.value)}
                              style={{ 
                                padding: '4px 8px', 
                                fontSize: '12px',
                                backgroundColor: currentStatus === '대기중' ? '#ffd700' : currentStatus === '진행중' ? '#4caf50' : 'white',
                                color: currentStatus === '진행중' ? 'white' : '#333',
                                fontWeight: '500',
                                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                                border: '1px solid #ddd',
                                borderRadius: '4px'
                              }}
                            >
                              <option value="대기중">대기중</option>
                              <option value="진행중">진행중</option>
                              <option value="상담완료">상담완료</option>
                              <option value="계약완료">계약완료</option>
                            </select>
                          </td>
                          <td style={{ minWidth: '170px' }}>{formatDate(estimate.submittedAt)}</td>
                          <td style={{ minWidth: '120px' }}>{estimate.type}</td>
                          <td style={{ minWidth: '150px' }}>{estimate.phoneNumber}</td>
                          <td style={{ minWidth: '50px' }}>{total}대</td>
                          <td style={{ minWidth: '150px', maxWidth: '150px' }}>{formatAddress(estimate.address)}</td>
                          <td style={{ minWidth: '200px' }}>
                            {isEditing ? (
                              <div style={{ display: 'flex', gap: '5px' }}>
                                <input
                                  type="text"
                                  value={memoText}
                                  onChange={(e) => setMemoText(e.target.value)}
                                  style={{ flex: 1, padding: '4px 8px' }}
                                  placeholder="메모를 입력하세요"
                                />
                                <button
                                  onClick={() => handleSaveMemo(estimateId)}
                                  style={{ padding: '4px 8px', fontSize: '12px' }}
                                >
                                  저장
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingMemo(null);
                                    setMemoText('');
                                  }}
                                  style={{ padding: '4px 8px', fontSize: '12px' }}
                                >
                                  취소
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                <span style={{ flex: 1 }}>
                                  {currentMemo || '-'}
                                </span>
                                <button
                                  onClick={() => handleEditMemo(estimateId, estimate.memo)}
                                  style={{ padding: '4px 8px', fontSize: '12px' }}
                                >
                                  {currentMemo ? '메모수정' : '메모추가'}
                                </button>
                              </div>
                            )}
                          </td>
                          <td>
                            <button
                              onClick={() => handleViewDetails(estimate)}
                              style={{ padding: '4px 12px', fontSize: '12px' }}
                            >
                              자세히 보기
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <PaginationControls 
                  section="inProgress" 
                  dataLength={inProgressEstimates.length} 
                  currentPageNum={currentPage.inProgress} 
                />
              </div>
            )
          ) : (
            completedEstimates.length === 0 ? (
              <p>상담완료된 견적이 없습니다.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>현황</th>
                      <th>시간</th>
                      <th>타입</th>
                      <th>연락처</th>
                      <th>댓수</th>
                      <th>주소</th>
                      <th>메모</th>
                      <th>작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCompleted.map((estimate, index) => {
                      const estimateId = estimate.id || `${estimate.type}-${estimate.submittedAt}`;
                      const currentMemo = memos[estimateId] || estimate.memo || '';
                      const isEditing = editingMemo === estimateId;
                      const currentStatus = statuses[estimateId] || '대기중';
                      const indoor = Number(estimate.indoorCount || 0);
                      const outdoor = Number(estimate.outdoorCount || 0);
                      const total = indoor + outdoor;
                      return (
                        <tr key={estimateId}>
                          <td>
                            <select
                              value={currentStatus}
                              onChange={(e) => handleStatusChange(estimateId, e.target.value)}
                              style={{ 
                                padding: '4px 8px', 
                                fontSize: '12px',
                                backgroundColor: 
                                  currentStatus === '대기중' ? '#ffd700' : 
                                  currentStatus === '진행중' ? '#4caf50' : 
                                  currentStatus === '계약완료' ? '#2196f3' : 
                                  'white',
                                color: (currentStatus === '진행중' || currentStatus === '계약완료') ? 'white' : '#333',
                                fontWeight: '500',
                                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                                border: '1px solid #ddd',
                                borderRadius: '4px'
                              }}
                            >
                              <option value="대기중">대기중</option>
                              <option value="진행중">진행중</option>
                              <option value="상담완료">상담완료</option>
                              <option value="계약완료">계약완료</option>
                            </select>
                          </td>
                          <td style={{ minWidth: '150px' }}>{formatDate(estimate.submittedAt)}</td>
                          <td>{estimate.type}</td>
                          <td>{estimate.phoneNumber}</td>
                          <td>{total}대</td>
                          <td style={{ minWidth: '120px', maxWidth: '180px' }}>{formatAddress(estimate.address)}</td>
                          <td style={{ minWidth: '200px' }}>
                            {isEditing ? (
                              <div style={{ display: 'flex', gap: '5px' }}>
                                <input
                                  type="text"
                                  value={memoText}
                                  onChange={(e) => setMemoText(e.target.value)}
                                  style={{ flex: 1, padding: '4px 8px' }}
                                  placeholder="메모를 입력하세요"
                                />
                                <button
                                  onClick={() => handleSaveMemo(estimateId)}
                                  style={{ padding: '4px 8px', fontSize: '12px' }}
                                >
                                  저장
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingMemo(null);
                                    setMemoText('');
                                  }}
                                  style={{ padding: '4px 8px', fontSize: '12px' }}
                                >
                                  취소
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                <span style={{ flex: 1 }}>
                                  {currentMemo || '-'}
                                </span>
                                <button
                                  onClick={() => handleEditMemo(estimateId, currentMemo)}
                                  style={{ marginLeft: '8px', padding: '2px 8px', fontSize: '12px' }}
                                >
                                  메모수정
                                </button>
                              </div>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '5px' }}>
                              <button
                                onClick={() => handleViewDetails(estimate)}
                                style={{ padding: '4px 12px', fontSize: '12px' }}
                              >
                                자세히 보기
                              </button>
                              <button
                                onClick={() => handleDeleteEstimate(estimateId)}
                                style={{ padding: '4px 8px', fontSize: '12px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px' }}
                              >
                                삭제
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <PaginationControls 
                  section="completed" 
                  dataLength={completedEstimates.length} 
                  currentPageNum={currentPage.completed} 
                />
              </div>
            )
          )}
          
          {/* Detail Modal */}
          {showDetailModal && selectedEstimate && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000
            }}>
              <div style={{
                backgroundColor: 'white',
                padding: '30px',
                borderRadius: '8px',
                maxWidth: '800px',
                width: '90%',
                maxHeight: '80vh',
                overflowY: 'auto'
              }}>
                <h3 style={{ marginBottom: '12px' }}>상담 상세 정보</h3>
                
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '17px', marginBottom: '6px', color: '#888' }}>고객정보</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '6px', alignItems: 'center' }}>
                    <div>연락처</div>
                    {isEditingDetail ? (
                      <input
                        type="text"
                        value={editedEstimate?.phoneNumber || ''}
                        onChange={(e) => handleEditFieldChange('phoneNumber', e.target.value)}
                        style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: '4px' }}
                      />
                    ) : (
                      <div>{selectedEstimate.phoneNumber}</div>
                    )}
                    <div>주소</div>
                    {isEditingDetail ? (
                      <input
                        type="text"
                        value={editedEstimate?.address || ''}
                        onChange={(e) => handleEditFieldChange('address', e.target.value)}
                        style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: '4px' }}
                      />
                    ) : (
                      <div>{selectedEstimate.address}</div>
                    )}
                    <div>장소타입</div>
                    {isEditingDetail ? (
                      <input
                        type="text"
                        value={editedEstimate?.locationType || ''}
                        onChange={(e) => handleEditFieldChange('locationType', e.target.value)}
                        style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: '4px' }}
                      />
                    ) : (
                      <div>{selectedEstimate.locationType || '-'}</div>
                    )}
                  </div>
                </div>
                <hr style={{ border: 0, borderTop: '1.5px solid #eee', margin: '10px 0' }} />
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '17px', marginBottom: '6px', color: '#888' }}>상담내용</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '6px', alignItems: 'center' }}>
                    <div>화소</div>
                    {isEditingDetail ? (
                      <select
                        value={editedEstimate?.cameraType || ''}
                        onChange={(e) => handleEditFieldChange('cameraType', e.target.value)}
                        style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: '4px' }}
                      >
                        <option value="">선택</option>
                        <option value="200만">200만</option>
                        <option value="500만">500만</option>
                        <option value="800만">800만</option>
                      </select>
                    ) : (
                      <div>{selectedEstimate.cameraType || '-'}</div>
                    )}
                    <div>실외</div>
                    {isEditingDetail ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => handleEditFieldChange('outdoorCount', Math.max(0, (editedEstimate?.outdoorCount || 0) - 1))}
                          style={{ width: '28px', height: '28px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', background: '#f5f5f5', fontSize: '16px' }}
                        >
                          ▼
                        </button>
                        <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: '500' }}>{editedEstimate?.outdoorCount || 0}</span>
                        <button
                          type="button"
                          onClick={() => handleEditFieldChange('outdoorCount', (editedEstimate?.outdoorCount || 0) + 1)}
                          style={{ width: '28px', height: '28px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', background: '#f5f5f5', fontSize: '16px' }}
                        >
                          ▲
                        </button>
                      </div>
                    ) : (
                      <div>{selectedEstimate.outdoorCount || 0}대</div>
                    )}
                    <div>실내</div>
                    {isEditingDetail ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => handleEditFieldChange('indoorCount', Math.max(0, (editedEstimate?.indoorCount || 0) - 1))}
                          style={{ width: '28px', height: '28px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', background: '#f5f5f5', fontSize: '16px' }}
                        >
                          ▼
                        </button>
                        <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: '500' }}>{editedEstimate?.indoorCount || 0}</span>
                        <button
                          type="button"
                          onClick={() => handleEditFieldChange('indoorCount', (editedEstimate?.indoorCount || 0) + 1)}
                          style={{ width: '28px', height: '28px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', background: '#f5f5f5', fontSize: '16px' }}
                        >
                          ▲
                        </button>
                      </div>
                    ) : (
                      <div>{selectedEstimate.indoorCount || 0}대</div>
                    )}
                    <div>IoT</div>
                    {isEditingDetail ? (
                      <input
                        type="text"
                        value={editedEstimate?.iotOptions || ''}
                        onChange={(e) => handleEditFieldChange('iotOptions', e.target.value)}
                        style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: '4px' }}
                        placeholder="예: 문열림감지, 움직임감지"
                      />
                    ) : (
                      <div>{selectedEstimate.iotOptions || '-'}</div>
                    )}
                    <div>특수 공사</div>
                    {isEditingDetail ? (
                      <input
                        type="text"
                        value={editedEstimate?.specialOptions || ''}
                        onChange={(e) => handleEditFieldChange('specialOptions', e.target.value)}
                        style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: '4px' }}
                        placeholder="예: 엘리베이터 공사, 층고 4m 이상"
                      />
                    ) : (
                      <div>{selectedEstimate.specialOptions || '-'}</div>
                    )}
                    <div>인터넷</div>
                    {isEditingDetail ? (
                      <select
                        value={editedEstimate?.hasInternet || ''}
                        onChange={(e) => handleEditFieldChange('hasInternet', e.target.value)}
                        style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: '4px' }}
                      >
                        <option value="">선택</option>
                        <option value="있음">있음</option>
                        <option value="없음">없음</option>
                        <option value="모름">모름</option>
                      </select>
                    ) : (
                      <div>{selectedEstimate.hasInternet || '-'}</div>
                    )}
                  </div>
                </div>
                <hr style={{ border: 0, borderTop: '1.5px solid #eee', margin: '10px 0' }} />
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '17px', marginBottom: '6px', color: '#888' }}>설치 희망</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '6px', alignItems: 'center' }}>
                    <div>날짜</div>
                    {isEditingDetail ? (
                      <input
                        type="text"
                        value={editedEstimate?.appointmentDate || ''}
                        onChange={(e) => handleEditFieldChange('appointmentDate', e.target.value)}
                        style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: '4px' }}
                        placeholder="예: 2026-02-25"
                      />
                    ) : (
                      <div>{selectedEstimate.appointmentDate || '-'}</div>
                    )}
                    <div>시간</div>
                    {isEditingDetail ? (
                      <input
                        type="text"
                        value={editedEstimate?.appointmentTime || ''}
                        onChange={(e) => handleEditFieldChange('appointmentTime', e.target.value)}
                        style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: '4px' }}
                        placeholder="예: 오전, 오후, 상관없음"
                      />
                    ) : (
                      <div>{selectedEstimate.appointmentTime || '-'}</div>
                    )}
                  </div>
                </div>
                <hr style={{ border: 0, borderTop: '1.5px solid #eee', margin: '10px 0' }} />
                <div style={{ marginBottom: '6px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '17px', marginBottom: '6px', color: '#888' }}>추가정보</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '6px', alignItems: 'center' }}>
                    <div>전환여부</div>
                    <div>{selectedEstimate.converted ? 'O' : 'X'}</div>
                    <div>IP주소</div>
                    <div>{selectedEstimate.ipAddress || '-'}</div>
                    <div>메모</div>
                    {isEditingDetail ? (
                      <textarea
                        value={editedEstimate?.memo || memos[selectedEstimate.id || `${selectedEstimate.type}-${selectedEstimate.submittedAt}`] || ''}
                        onChange={(e) => handleEditFieldChange('memo', e.target.value)}
                        style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: '4px', minHeight: '60px', resize: 'vertical' }}
                        placeholder="메모를 입력하세요"
                      />
                    ) : (
                      <div>{memos[selectedEstimate.id || `${selectedEstimate.type}-${selectedEstimate.submittedAt}`] || selectedEstimate.memo || '-'}</div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                  {isEditingDetail ? (
                    <>
                      <button
                        onClick={() => {
                          setIsEditingDetail(false);
                          setEditedEstimate({ ...selectedEstimate });
                        }}
                        style={{ padding: '8px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        취소
                      </button>
                      <button
                        onClick={handleSaveEditedEstimate}
                        style={{ padding: '8px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        저장
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setIsEditingDetail(true)}
                        style={{ padding: '8px 20px', background: '#0099b0', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        수정하기
                      </button>
                      <button
                        onClick={() => {
                          setShowDetailModal(false);
                          setSelectedEstimate(null);
                          setIsEditingDetail(false);
                        }}
                        style={{ padding: '8px 20px' }}
                      >
                        창 닫기
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        ) : activeMainTab === 'chat' ? (
          /* Chat Section */
          <div className="card">
            <h3 className="card-header">고객 채팅</h3>
            
            {/* Chat Sub-tabs */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #e0e0e0' }}>
              <button
                onClick={() => { setChatSubTab('pending'); setSelectedChatRoom(null); }}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  background: chatSubTab === 'pending' ? '#0099b0' : 'transparent',
                  color: chatSubTab === 'pending' ? 'white' : '#666',
                  cursor: 'pointer',
                  borderBottom: chatSubTab === 'pending' ? '3px solid #0099b0' : 'none',
                  fontWeight: chatSubTab === 'pending' ? '600' : '400',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
              >
                대기 중
                {chatRooms.filter(r => r.status === 'pending').length > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    background: '#ff4444',
                    color: 'white',
                    borderRadius: '10px',
                    padding: '2px 6px',
                    fontSize: '11px',
                    fontWeight: '600'
                  }}>
                    {chatRooms.filter(r => r.status === 'pending').length}
                  </span>
                )}
              </button>
              <button
                onClick={() => { setChatSubTab('active'); setSelectedChatRoom(null); }}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  background: chatSubTab === 'active' ? '#0099b0' : 'transparent',
                  color: chatSubTab === 'active' ? 'white' : '#666',
                  cursor: 'pointer',
                  borderBottom: chatSubTab === 'active' ? '3px solid #0099b0' : 'none',
                  fontWeight: chatSubTab === 'active' ? '600' : '400',
                  transition: 'all 0.2s'
                }}
              >
                진행 중 ({chatRooms.filter(r => r.status === 'active').length})
              </button>
              <button
                onClick={() => { setChatSubTab('ended'); setSelectedChatRoom(null); }}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  background: chatSubTab === 'ended' ? '#0099b0' : 'transparent',
                  color: chatSubTab === 'ended' ? 'white' : '#666',
                  cursor: 'pointer',
                  borderBottom: chatSubTab === 'ended' ? '3px solid #0099b0' : 'none',
                  fontWeight: chatSubTab === 'ended' ? '600' : '400',
                  transition: 'all 0.2s'
                }}
              >
                종료됨 ({chatRooms.filter(r => r.status === 'ended').length})
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px', height: 'calc(100vh - 300px)', minHeight: '400px' }}>
              {/* Chat Room List */}
              <div style={{ borderRight: '1px solid #e0e0e0', overflowY: 'auto' }}>
                <h4 style={{ padding: '10px', margin: 0, borderBottom: '1px solid #e0e0e0', fontSize: '14px' }}>
                  {chatSubTab === 'pending' && '대기 중인 상담'}
                  {chatSubTab === 'active' && '진행 중인 상담'}
                  {chatSubTab === 'ended' && '종료된 상담'}
                </h4>
                {chatRooms.filter(r => r.status === chatSubTab).length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                    {chatSubTab === 'pending' && '대기 중인 상담이 없습니다'}
                    {chatSubTab === 'active' && '진행 중인 상담이 없습니다'}
                    {chatSubTab === 'ended' && '종료된 상담이 없습니다'}
                  </div>
                ) : (
                  <>
                    {(chatSubTab === 'pending' ? paginatedPendingChats : 
                      chatSubTab === 'active' ? paginatedActiveChats : 
                      paginatedEndedChats).map(room => (
                      <div
                        key={room.id}
                        onClick={() => handleSelectChatRoom(room)}
                        style={{
                          padding: '15px',
                          borderBottom: '1px solid #f0f0f0',
                          cursor: 'pointer',
                          background: selectedChatRoom?.id === room.id ? '#f8f9fa' : 'white',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
                        onMouseLeave={(e) => e.currentTarget.style.background = selectedChatRoom?.id === room.id ? '#f8f9fa' : 'white'}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: '14px' }}>{room.customerName}</strong>
                          {room.unreadCount > 0 && (
                            <span style={{
                              background: '#ff4444',
                              color: 'white',
                              borderRadius: '10px',
                              padding: '2px 8px',
                              fontSize: '11px'
                            }}>
                              {room.unreadCount}
                            </span>
                          )}
                        </div>
                        {room.lastMessage && (
                          <div style={{ fontSize: '12px', color: '#666', marginTop: '5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {room.lastMessage.text}
                          </div>
                        )}
                        {room.lastMessage && (
                          <div style={{ fontSize: '11px', color: '#999', marginTop: '3px' }}>
                            {formatDate(room.lastMessage.timestamp)}
                          </div>
                        )}
                      </div>
                    ))}
                    <PaginationControls 
                      section={chatSubTab === 'pending' ? 'pendingChat' : chatSubTab === 'active' ? 'activeChat' : 'endedChat'}
                      dataLength={chatRooms.filter(r => r.status === chatSubTab).length} 
                      currentPageNum={chatSubTab === 'pending' ? currentPage.pendingChat : chatSubTab === 'active' ? currentPage.activeChat : currentPage.endedChat} 
                    />
                  </>
                )}
              </div>

              {/* Chat Messages */}
              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
                {!selectedChatRoom ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                    {chatSubTab === 'pending' && '대기 중인 상담을 선택하세요'}
                    {chatSubTab === 'active' && '진행 중인 상담을 선택하세요'}
                    {chatSubTab === 'ended' && '종료된 상담을 선택하세요'}
                  </div>
                ) : selectedChatRoom.status === 'pending' ? (
                  <>
                    <div style={{ padding: '15px', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>{selectedChatRoom.customerName}</strong>
                      <span style={{ fontSize: '12px', color: '#ff9800', fontWeight: '600' }}>⏳ 대기 중</span>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '40px' }}>
                      <div style={{ fontSize: '3rem' }}>💬</div>
                      <p style={{ fontSize: '1.1rem', fontWeight: '600', color: '#333' }}>새로운 상담 요청</p>
                      <p style={{ color: '#666', textAlign: 'center' }}>
                        {selectedChatRoom.customerName}님이 상담을 요청했습니다.<br/>
                        상담을 수락하시겠습니까?
                      </p>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          onClick={() => handleAcceptChat(selectedChatRoom)}
                          style={{
                            padding: '12px 32px',
                            background: '#0099b0',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: '600',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#007a8c'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#0099b0'}
                        >
                          수락
                        </button>
                        <button
                          onClick={() => handleRejectChat(selectedChatRoom)}
                          style={{
                            padding: '12px 32px',
                            background: '#e0e0e0',
                            color: '#666',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: '600',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#d0d0d0'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = '#e0e0e0'; }}
                        >
                          거절
                        </button>
                      </div>
                      <div style={{ marginTop: '20px', fontSize: '12px', color: '#999' }}>
                        요청 시간: {formatDate(selectedChatRoom.createdAt)}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ padding: '15px', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>{selectedChatRoom.customerName}</strong>
                        {selectedChatRoom.status === 'active' && (
                          <span style={{ marginLeft: '10px', fontSize: '12px', color: '#4caf50', fontWeight: '600' }}>● 진행 중</span>
                        )}
                        {selectedChatRoom.status === 'ended' && (
                          <span style={{ marginLeft: '10px', fontSize: '12px', color: '#999', fontWeight: '600' }}>종료됨</span>
                        )}
                      </div>
                      {selectedChatRoom.status === 'active' && (
                        <button
                          onClick={() => handleEndChat(selectedChatRoom)}
                          style={{
                            padding: '6px 16px',
                            background: '#ff5252',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: '600'
                          }}
                        >
                          상담 종료
                        </button>
                      )}
                    </div>
                    
                    <div ref={chatMessagesRef} style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#f8f9fa' }}>
                      {selectedChatRoom.messages.map(msg => (
                        <div
                          key={msg.id}
                          style={{
                            marginBottom: '15px',
                            display: 'flex',
                            justifyContent: msg.sender === 'user' ? 'flex-start' : 'flex-end'
                          }}
                        >
                          <div style={{ maxWidth: '70%' }}>
                            <div style={{
                              padding: '10px 15px',
                              borderRadius: '12px',
                              background: msg.sender === 'user' ? 'white' : '#0099b0',
                              color: msg.sender === 'user' ? '#333' : 'white',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}>
                              {msg.text}
                            </div>
                            <div style={{ 
                              fontSize: '11px', 
                              color: '#999', 
                              marginTop: '4px',
                              textAlign: msg.sender === 'user' ? 'left' : 'right'
                            }}>
                              {msg.sender === 'employee' && `${msg.employeeName || '직원'} • `}
                              {new Date(msg.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Seoul' })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {selectedChatRoom.status === 'active' ? (
                      <div style={{ padding: '15px', borderTop: '1px solid #e0e0e0', background: 'white', display: 'flex', gap: '10px' }}>
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyPress={handleChatKeyPress}
                          placeholder="메시지를 입력하세요..."
                          style={{
                            flex: 1,
                            padding: '10px 15px',
                            border: '1px solid #e0e0e0',
                            borderRadius: '20px',
                            fontSize: '14px'
                          }}
                        />
                        <button
                          onClick={handleSendChatMessage}
                          style={{
                            padding: '10px 25px',
                            background: '#0099b0',
                            color: 'white',
                            border: 'none',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            fontWeight: '600'
                          }}
                        >
                          전송
                        </button>
                      </div>
                    ) : (
                      <div style={{ padding: '15px', borderTop: '1px solid #e0e0e0', background: '#f5f5f5', textAlign: 'center', color: '#999' }}>
                        이 상담은 종료되었습니다
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ) : activeMainTab === 'questions' ? (
          /* Questions Section */
          <div className="card">
            <h3 className="card-header">고객 질문 관리</h3>
            
            <div style={{ padding: '20px' }}>
              {customerQuestions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📝</div>
                  <p>등록된 질문이 없습니다</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {paginatedQuestions.map(question => (
                    <div
                      key={question._id || question.id}
                      style={{
                        padding: '20px',
                        background: question.read ? 'white' : '#f0f9fa',
                        border: question.read ? '1px solid #e0e0e0' : '2px solid #0099b0',
                        borderRadius: '12px',
                        position: 'relative'
                      }}
                    >
                      {!question.read && (
                        <span style={{
                          position: 'absolute',
                          top: '15px',
                          right: '15px',
                          background: '#ff4444',
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          NEW
                        </span>
                      )}
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '15px', marginBottom: '15px' }}>
                        <div style={{ fontWeight: '600', color: '#666' }}>전화번호:</div>
                        <div style={{ fontWeight: '600', color: '#0099b0' }}>
                          <a href={`tel:${question.phone}`} style={{ color: '#0099b0', textDecoration: 'none' }}>
                            {question.phone}
                          </a>
                        </div>
                        
                        <div style={{ fontWeight: '600', color: '#666' }}>등록 시간:</div>
                        <div>{formatDate(question.createdAt || question.timestamp)}</div>
                      </div>
                      
                      <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #e0e0e0' }}>
                        <div style={{ fontWeight: '600', color: '#333', marginBottom: '10px' }}>질문 내용:</div>
                        <div style={{ 
                          padding: '15px', 
                          background: 'white', 
                          borderRadius: '8px',
                          border: '1px solid #e0e0e0',
                          whiteSpace: 'pre-wrap',
                          lineHeight: '1.6'
                        }}>
                          {question.question}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '10px', marginTop: '15px', justifyContent: 'flex-end' }}>
                        {!question.read && (
                          <button
                            onClick={() => handleMarkQuestionAsRead(question._id || question.id)}
                            style={{
                              padding: '8px 20px',
                              background: '#0099b0',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: '600'
                            }}
                          >
                            확인 완료
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (window.confirm('이 질문을 삭제하시겠습니까?')) {
                              handleDeleteQuestion(question._id || question.id);
                            }
                          }}
                          style={{
                            padding: '8px 20px',
                            background: '#ff5252',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600'
                          }}
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <PaginationControls 
                section="questions" 
                dataLength={customerQuestions.length} 
                currentPageNum={currentPage.questions} 
              />
            </div>
          </div>
        ) : activeMainTab === 'joinRequests' && user?.name === '이승연' ? (
          <div className="card">
            <h3 className="card-header">직원 권한 요청 관리</h3>
            <div style={{ padding: '20px' }}>
              {pendingEmployees.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '20px' }}>👥</div>
                  <p>대기 중인 직원 권한 요청이 없습니다</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {pendingEmployees.map(emp => (
                    <div key={emp._id} style={{
                      padding: '20px',
                      background: '#fff8e1',
                      border: '2px solid #ffc107',
                      borderRadius: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px' }}>
                        <div style={{ fontWeight: '600', color: '#666' }}>이름:</div>
                        <div style={{ fontWeight: '700', color: '#333' }}>{emp.name}</div>
                        <div style={{ fontWeight: '600', color: '#666' }}>아이디:</div>
                        <div style={{ color: '#0099b0' }}>{emp.username}</div>
                        <div style={{ fontWeight: '600', color: '#666' }}>전화:</div>
                        <div>{emp.phone}</div>
                        <div style={{ fontWeight: '600', color: '#666' }}>요청일:</div>
                        <div>{formatDate(emp.createdAt)}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          onClick={() => handleApproveEmployee(emp._id)}
                          style={{
                            padding: '10px 24px',
                            background: '#0099b0',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '700',
                            fontSize: '14px'
                          }}
                        >✅ 승인</button>
                        <button
                          onClick={() => handleRejectEmployee(emp._id, emp.name)}
                          style={{
                            padding: '10px 24px',
                            background: '#ff5252',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '700',
                            fontSize: '14px'
                          }}
                        >❌ 거절</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default EmployeeDashboard;
