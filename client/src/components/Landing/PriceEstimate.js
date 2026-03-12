import React, { useState, useRef, useEffect } from 'react';
import './PriceEstimate.css';

const PriceEstimate = () => {
  const [step, setStep] = useState(1); // 1: selection, 2: price display, 3: form, 4: date/time
  const sectionRef = useRef(null);
  const containerRef = useRef(null);
  const priceSummaryRef = useRef(null);
  
  // Scroll to appropriate position when step changes
  useEffect(() => {
    if (step > 1) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        const navbarHeight = 100;
        let targetRef = containerRef;
        if (targetRef.current) {
          const elementPosition = targetRef.current.getBoundingClientRect().top + window.pageYOffset;
          window.scrollTo({
            top: elementPosition - navbarHeight,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  }, [step]);
  
  // Calendar month navigation
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Step 1 - Selection state
  const [cameraType, setCameraType] = useState('210만');
  const [indoorCount, setIndoorCount] = useState(0);
  const [outdoorCount, setOutdoorCount] = useState(0);
  const [iotOptions, setIotOptions] = useState([]);
  const [specialOptions, setSpecialOptions] = useState([]);
  const [ptzCount, setPtzCount] = useState(0);
  const [monitorInstall, setMonitorInstall] = useState(false);
  const [showIotOptions, setShowIotOptions] = useState(false);
  const [showStorageOptions, setShowStorageOptions] = useState(false);
  const [showSpecialOptions, setShowSpecialOptions] = useState(false);
  const [storageOption, setStorageOption] = useState('');

  // Accordion toggle functions - close others when one opens
  const toggleIotSection = () => {
    setShowIotOptions(!showIotOptions);
    if (!showIotOptions) {
      setShowStorageOptions(false);
      setShowSpecialOptions(false);
    }
  };

  const toggleStorageSection = () => {
    setShowStorageOptions(!showStorageOptions);
    if (!showStorageOptions) {
      setShowIotOptions(false);
      setShowSpecialOptions(false);
    }
  };

  const toggleSpecialSection = () => {
    setShowSpecialOptions(!showSpecialOptions);
    if (!showSpecialOptions) {
      setShowIotOptions(false);
      setShowStorageOptions(false);
    }
  };
  
  // Storage options list
  const storageOptionsList = [
    { id: '2달', name: '저장기간 약 2달' },
    { id: '3달', name: '저장기간 약 3달' },
    { id: '4달', name: '저장기간 약 4달' }
  ];
  
  // Step 3 - Form state
  const [phoneNumber, setPhoneNumber] = useState('010-');
  const [address, setAddress] = useState('');
  const [locationType, setLocationType] = useState('');
  const [hasInternet, setHasInternet] = useState('');
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  
  // Step 4 - Date/Time state
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  
  // Save initial selection for comparison
  const [initialSelection, setInitialSelection] = useState(null);

  const iotOptionsList = [
    { id: 'fingerprint', name: '지문형 출입통제', image: '/img/price-est/iot/finger.png' },
    { id: 'card', name: '카드형 출입통제', image: '/img/price-est/iot/card.png' },
    { id: 'door', name: '문열림 감지센서', image: '/img/price-est/iot/door.png' },
    { id: 'motion', name: '움직임 감지센서', image: '/img/price-est/iot/move.png' },
    { id: 'fire', name: '화재 경보 센서', image: '/img/price-est/iot/fire.png' },
    { id: 'temp', name: '온도 감지 센서', image: '/img/price-est/iot/temp.png' }
  ];

  const specialOptionsList = [
    { id: 'height', name: '층고 4m 이상', image: '/img/price-est/special/4m.png' },
    { id: 'elevator', name: '엘리베이터 공사', image: '/img/price-est/special/elevator.png' },
    { id: 'pipe', name: '특수 배관 공사', image: '/img/price-est/special/wire.png' },
    { id: 'pole', name: '폴대 (SUS)', image: '/img/price-est/special/sus.png' },
    { id: 'sky', name: '탑차 (스카이차, 탑차)', image: '/img/price-est/special/sky.png' }
  ];

  const timeSlots = {
    morning: ['8am', '8:30am', '9am', '9:30am', '10am', '10:30am', '11am', '11:30am'],
    afternoon: ['12pm', '12:30pm', '1pm', '1:30pm', '2pm', '2:30pm', '3pm', '3:30pm', '4pm', '4:30pm', '5pm', '5:30pm']
  };

  const calculatePrice = () => {
    const totalCameras = indoorCount + outdoorCount;
    
    // Price map for 210만화소
    const priceMap = {
      2: 22000, 3: 26000, 4: 30000, 5: 36000, 6: 40000, 7: 44000, 8: 48000,
      9: 60000, 10: 64000, 11: 68000, 12: 72000, 13: 76000, 14: 80000,
      15: 84000, 16: 88000
    };
    
    return priceMap[totalCameras] || 0;
  };

  const toggleIotOption = (optionId) => {
    setIotOptions(prev => 
      prev.includes(optionId) 
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    );
  };

  const toggleSpecialOption = (optionId) => {
    setSpecialOptions(prev => 
      prev.includes(optionId) 
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    );
  };

  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/[^0-9]/g, '');
    
    if (!value.startsWith('010')) {
      value = '010' + value.slice(3);
    }
    
    if (value.length <= 3) {
      setPhoneNumber('010-');
    } else if (value.length <= 7) {
      setPhoneNumber(`010-${value.slice(3)}-`);
    } else if (value.length <= 11) {
      setPhoneNumber(`010-${value.slice(3, 7)}-${value.slice(7, 11)}`);
    }
  };

  const handleSubmit = () => {
    // Save initial selection
    setInitialSelection({
      cameraType,
      indoorCount,
      outdoorCount,
      ptzCount,
      monitorInstall,
      iotOptions: [...iotOptions],
      specialOptions: [...specialOptions],
      storageOption
    });
    
    // Just move to step 2 to show price (no submission yet)
    setStep(2);
  };

  const handleFormSubmit = () => {
    if (!phoneNumber || phoneNumber.replace(/-/g, '').length !== 11 || !address || !locationType || !hasInternet || !privacyConsent) {
      alert('모든 필수 항목을 입력해주세요.');
      return;
    }
    setStep(4);
  };

  const handleFinalSubmit = async () => {
    // Convert option IDs to display names
    const iotNames = iotOptions.map(id => iotOptionsList.find(opt => opt.id === id)?.name || id);
    const specialNames = specialOptions.map(id => specialOptionsList.find(opt => opt.id === id)?.name || id);
    const storageOptionName = storageOption ? storageOptionsList.find(opt => opt.id === storageOption)?.name || storageOption : '';
    
    const formData = {
      initialSelection,
      currentSelection: {
        cameraType,
        indoorCount,
        outdoorCount,
        ptzCount,
        monitorInstall,
        iotOptions: iotNames,
        specialOptions: specialNames,
        storageOption: storageOptionName
      },
      contactInfo: {
        phoneNumber,
        address,
        locationType,
        hasInternet
      },
      appointment: {
        date: selectedDate,
        time: selectedTime
      },
      price: calculatePrice(),
      submittedAt: new Date().toISOString()
    };

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      
      // Submit to SALT 상담신청 (full consultation)
      const response = await fetch(`${API_URL}/price-estimate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ 견적이 저장되었습니다:', result);
        
        alert('견적 신청이 완료되었습니다!');
        // Reset form
        resetForm();
      } else {
        const error = await response.json();
        console.error('❌ 저장 실패:', error);
        alert('견적 신청 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('❌ Error submitting form:', error);
      alert('오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const handleRestart = async () => {
    // Convert option IDs to display names
    const iotNames = iotOptions.map(id => iotOptionsList.find(opt => opt.id === id)?.name || id);
    const specialNames = specialOptions.map(id => specialOptionsList.find(opt => opt.id === id)?.name || id);
    const storageOptionName = storageOption ? storageOptionsList.find(opt => opt.id === storageOption)?.name || storageOption : '';
    
    // Submit as quick estimate with converted = false
    const formData = {
      initialSelection,
      currentSelection: {
        cameraType,
        indoorCount,
        outdoorCount,
        ptzCount,
        monitorInstall,
        iotOptions: iotNames,
        specialOptions: specialNames,
        storageOption: storageOptionName
      },
      contactInfo: {
        phoneNumber: '',
        address: '',
        locationType: '',
        hasInternet: ''
      },
      appointment: {
        date: null,
        time: ''
      },
      price: calculatePrice(),
      submittedAt: new Date().toISOString()
    };

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${API_URL}/price-estimate/quick`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        console.log('✅ 간편견적이 저장되었습니다 (전환: X)');
        // Reset form and go back to step 1
        resetForm();
      } else {
        console.error('❌ 간편견적 저장 실패');
        // Still reset even if tracking fails
        resetForm();
      }
    } catch (error) {
      console.error('❌ Error submitting quick estimate:', error);
      // Still reset even if tracking fails
      resetForm();
    }
  };

  const resetForm = () => {
    setStep(1);
    setCameraType('210만');
    setIndoorCount(0);
    setOutdoorCount(0);
    setPtzCount(0);
    setMonitorInstall(false);
    setIotOptions([]);
    setSpecialOptions([]);
    setPhoneNumber('010-');
    setAddress('');
    setLocationType('');
    setHasInternet('');
    setPrivacyConsent(false);
    setSelectedDate(null);
    setSelectedTime('');
    setInitialSelection(null);
  };

  const isWeekday = (date) => {
    const day = date.getDay();
    return day !== 0 && day !== 6; // Not Sunday or Saturday
  };

  const isHoliday = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    // Fixed holidays
    const holidays = [
      `${year}-01-01`, // New Year
      `${year}-03-01`, // Independence Day
      `${year}-05-05`, // Children's Day
      `${year}-06-06`, // Memorial Day
      `${year}-08-15`, // Liberation Day
      `${year}-10-03`, // National Foundation Day
      `${year}-10-09`, // Hangeul Day
      `${year}-12-25`, // Christmas
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

  return (
    <div id="self-quote" className="price-estimate-section" ref={sectionRef}>
      {step === 1 && (
        <div className="price-estimate-container">
          <div className="left-info">
            <p className="info-small">든든한 보안 파트너가 되어드립니다</p>
            <h2 className="info-large">지금 필요한 견적을<br/>바로 확인해보세요</h2>
            <p className="info-description">
              딱 맞는 보안 솔루션을 찾고 계신가요?<br/>
              걱정 마세요, 저희가 차근차근 도와드릴게요.
            </p>
            <div className="contact-info">
              <div className="contact-item">
                <span className="contact-icon">📞</span>
                <span>신규가입 <a href="tel:1522-0687">1522-0687</a></span>
              </div>
              <div className="contact-item">
                <span className="contact-icon">🔧</span>
                <span>A/S문의 <a href="tel:1644-6674">1644-6674</a></span>
              </div>
            </div>
          </div>

          <div className="right-form">
            {/* Camera Type Selection */}
            <div className="camera-type-section">
              <h3>카메라</h3>
              <label className="camera-type-checkbox">
                <input type="checkbox" checked readOnly />
                <span>210만화소</span>
              </label>
            </div>

            {/* Camera Quantity */}
            <div className="camera-quantity-section">
              <div className="camera-box">
                <div className="camera-header">
                  <span>실내 카메라</span>
                  <img src={`${process.env.PUBLIC_URL}/img/price-est/cameraDVR/inside210.png`} alt="실내 카메라" />
                </div>
                <div className="quantity-controls">
                  <button onClick={() => setIndoorCount(Math.max(0, indoorCount - 1))}>-</button>
                  <span>{indoorCount}</span>
                  <button onClick={() => setIndoorCount(indoorCount + 1)}>+</button>
                </div>
              </div>

              <div className="camera-box">
                <div className="camera-header">
                  <span>실외 카메라</span>
                  <img src={`${process.env.PUBLIC_URL}/img/price-est/cameraDVR/outside210.png`} alt="실외 카메라" />
                </div>
                <div className="quantity-controls">
                  <button onClick={() => setOutdoorCount(Math.max(0, outdoorCount - 1))}>-</button>
                  <span>{outdoorCount}</span>
                  <button onClick={() => setOutdoorCount(outdoorCount + 1)}>+</button>
                </div>
              </div>
            </div>

            {/* IoT and Special Options */}
            <div className="options-row">
              <div className="left-options">
                <div className="ptz-section">
                  <div className="ptz-header">
                    <span>PTZ 줌 카메라 추가</span>
                    <div className="quantity-controls">
                      <button onClick={() => setPtzCount(Math.max(0, ptzCount - 1))}>-</button>
                      <span>{ptzCount}</span>
                      <button onClick={() => setPtzCount(ptzCount + 1)}>+</button>
                    </div>
                  </div>
                </div>

                <div className="monitor-section">
                  <div className="monitor-header">
                    <span>모니터 설치가 필요하신가요?</span>
                    <label className="monitor-checkbox">
                      <input 
                        type="checkbox" 
                        checked={monitorInstall}
                        onChange={(e) => setMonitorInstall(e.target.checked)}
                      />
                      <span>네</span>
                    </label>
                  </div>
                </div>

              <div className="iot-section">
                <h3 
                  className="iot-header clickable"
                  onClick={toggleIotSection}
                >
                  <div className="header-content">
                    <span>알람센서 옵션추가</span>
                    {!showIotOptions && iotOptions.length > 0 && (
                      <span className="selected-summary">
                        {iotOptions.map(id => iotOptionsList.find(o => o.id === id)?.name).join(', ')}
                      </span>
                    )}
                  </div>
                  <span className={`expand-arrow ${showIotOptions ? 'expanded' : ''}`}>▼</span>
                </h3>
                {showIotOptions && (
                  <div className="options-grid">
                    {iotOptionsList.map(option => (
                      <div 
                        key={option.id}
                        className={`option-box ${iotOptions.includes(option.id) ? 'selected' : ''}`}
                        onClick={() => toggleIotOption(option.id)}
                      >
                        {iotOptions.includes(option.id) && (
                          <div className="check-circle">✓</div>
                        )}
                        <img src={process.env.PUBLIC_URL + option.image} alt={option.name} />
                        <p>{option.name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="storage-section">
                <h3 
                  className="storage-header clickable"
                  onClick={toggleStorageSection}
                >
                  <div className="header-content">
                    <span>저장용량 선택</span>
                    {!showStorageOptions && storageOption && (
                      <span className="selected-summary">
                        {storageOptionsList.find(o => o.id === storageOption)?.name}
                      </span>
                    )}
                  </div>
                  <span className={`expand-arrow ${showStorageOptions ? 'expanded' : ''}`}>▼</span>
                </h3>
                {showStorageOptions && (
                  <div className="storage-options">
                    {storageOptionsList.map(option => (
                      <div 
                        key={option.id}
                        className={`storage-option ${storageOption === option.id ? 'selected' : ''}`}
                        onClick={() => setStorageOption(storageOption === option.id ? '' : option.id)}
                      >
                        <div className="radio-circle">
                          {storageOption === option.id && <span className="checkmark">✓</span>}
                        </div>
                        <span>{option.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="special-section">
                <h3 
                  className="special-header clickable"
                  onClick={toggleSpecialSection}
                >
                  <div className="header-content">
                    <span>특수 공사</span>
                    {!showSpecialOptions && specialOptions.length > 0 && (
                      <span className="selected-summary">
                        {specialOptions.map(id => specialOptionsList.find(o => o.id === id)?.name).join(', ')}
                      </span>
                    )}
                  </div>
                  <span className={`expand-arrow ${showSpecialOptions ? 'expanded' : ''}`}>▼</span>
                </h3>
                {showSpecialOptions && (
                  <div className="special-options">
                    {specialOptionsList.map(option => (
                      <div 
                        key={option.id}
                        className={`special-option ${specialOptions.includes(option.id) ? 'selected' : ''}`}
                        onClick={() => toggleSpecialOption(option.id)}
                      >
                        <div className="radio-circle">
                          {specialOptions.includes(option.id) && <span className="checkmark">✓</span>}
                        </div>
                        <span>{option.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            </div>

            {/* Submit Button */}
            <button 
              className="submit-button"
              onClick={handleSubmit}
              disabled={indoorCount + outdoorCount < 2}
            >
              견적 확인하기
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="price-estimate-container" ref={containerRef}>
          <div className="left-info">
            <p className="info-small">든든한 보안 파트너가 되어드립니다</p>
            <h2 className="info-large">지금 필요한 견적을<br/>바로 확인해보세요</h2>
            <p className="info-description">
              딱 맞는 보안 솔루션을 찾고 계신가요?<br/>
              걱정 마세요, 저희가 차근차근 도와드릴게요.
            </p>
            <div className="contact-info">
              <div className="contact-item">
                <span className="contact-icon">📞</span>
                <span>신규가입 <a href="tel:1522-0687">1522-0687</a></span>
              </div>
              <div className="contact-item">
                <span className="contact-icon">🔧</span>
                <span>A/S문의 <a href="tel:1644-6674">1644-6674</a></span>
              </div>
            </div>
          </div>

          <div className="right-form">
            <div className="price-summary" ref={priceSummaryRef}>
              {indoorCount + outdoorCount > 16 ? (
                <div className="price-item main-price">
                  <span style={{ color: '#ff6b6b', fontWeight: 'bold', fontSize: '18px' }}>
                    16대 이상은 상담원에게 문의해 주세요
                  </span>
                </div>
              ) : (
                <div className="price-item main-price">
                  <span>210만화소 카메라 {indoorCount + outdoorCount}대 기본 월정액 (3년 약정)</span>
                  <span>{calculatePrice().toLocaleString()}원 /월</span>
                </div>
              )}
              {ptzCount > 0 && (
                <div className="price-item">
                  <span>PTZ 줌 카메라 {ptzCount}대</span>
                  <span>문의</span>
                </div>
              )}
              {monitorInstall && (
                <div className="price-item">
                  <span>모니터 설치</span>
                  <span>문의</span>
                </div>
              )}
              {iotOptions.map(optionId => {
                const option = iotOptionsList.find(o => o.id === optionId);
                return (
                  <div key={optionId} className="price-item">
                    <span>{option?.name}</span>
                    <span>문의</span>
                  </div>
                );
              })}
              {specialOptions.map(optionId => {
                const option = specialOptionsList.find(o => o.id === optionId);
                return (
                  <div key={optionId} className="price-item">
                    <span>{option?.name}</span>
                    <span>문의</span>
                  </div>
                );
              })}
              {storageOption && (
                <div className="price-item">
                  <span>저장용량 추가: {storageOptionsList.find(o => o.id === storageOption)?.name}</span>
                  <span>문의</span>
                </div>
              )}
              <p className="price-note">
                *가입 후에는 가격 인상 없이 최초 상담 내용 그대로 유지 됩니다.*<br/>
                *난이도가 높지 않은 기본 설치는 추가 설치비 없이 진행 됩니다.*
              </p>
            </div>

            <button className="consultation-button" onClick={() => setStep(3)}>
              ⟶ 이 내용 그대로 상담 신청하기
            </button>
            
            <button className="restart-button" onClick={handleRestart}>
              다시 견적 내기
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="consultation-form-container" ref={containerRef}>
          <div className="form-left-summary">
            <h3>상담 신청 내용</h3>
            <div className="summary-content">
              <p><strong>카메라:</strong></p>
              <ul>
                <li>210만화소</li>
                <li>실내 카메라 {indoorCount}대</li>
                {outdoorCount > 0 && <li>실외 카메라 {outdoorCount}대</li>}
              </ul>
              <div className="divider"></div>
              {indoorCount + outdoorCount > 16 ? (
                <p className="price-display" style={{ color: '#ff6b6b' }}>16대 이상은 상담원에게 문의해 주세요</p>
              ) : (
                <p className="price-display">기본 금액 {calculatePrice().toLocaleString()}원</p>
              )}
              <div className="divider"></div>
              <p><strong>추가 사항</strong></p>
              {ptzCount > 0 && (
                <>
                  <p>PTZ 줌 카메라:</p>
                  <ul>
                    <li>{ptzCount}대</li>
                  </ul>
                </>
              )}
              {monitorInstall && (
                <>
                  <p>모니터 설치:</p>
                  <ul>
                    <li>예</li>
                  </ul>
                </>
              )}
              <p>IoT :</p>
              <ul>
                {iotOptions.map(optionId => {
                  const option = iotOptionsList.find(o => o.id === optionId);
                  return <li key={optionId}>{option?.name}</li>;
                })}
              </ul>
              <p>특수 공사:</p>
              <ul>
                {specialOptions.map(optionId => {
                  const option = specialOptionsList.find(o => o.id === optionId);
                  return <li key={optionId}>{option?.name}</li>;
                })}
              </ul>
              {storageOption && (
                <>
                  <p>저장용량 추가:</p>
                  <ul>
                    <li>{storageOptionsList.find(o => o.id === storageOption)?.name}</li>
                  </ul>
                </>
              )}
            </div>
            <button className="edit-button" onClick={() => setStep(1)}>
              상담 내용 편집
            </button>
          </div>

          <div className="form-right">
            <div className="form-field">
              <label>전화번호</label>
              <input 
                type="text" 
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="010-0000-0000"
              />
            </div>

            <div className="form-field">
              <label>주소</label>
              <input 
                type="text" 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="주소를 입력하세요"
              />
            </div>

            <div className="form-field">
              <label>장소 타입</label>
              <input 
                type="text" 
                value={locationType}
                onChange={(e) => setLocationType(e.target.value)}
                placeholder="예) 사무실, 학원, 주택 etc."
              />
            </div>

            <div className="form-field">
              <label>현장에 인터넷이 있나요?</label>
              <div className="radio-options">
                <label>
                  <input 
                    type="radio" 
                    name="internet" 
                    value="있음"
                    checked={hasInternet === '있음'}
                    onChange={(e) => setHasInternet(e.target.value)}
                  />
                  있음
                </label>
                <label>
                  <input 
                    type="radio" 
                    name="internet" 
                    value="없음"
                    checked={hasInternet === '없음'}
                    onChange={(e) => setHasInternet(e.target.value)}
                  />
                  없음
                </label>
                <label>
                  <input 
                    type="radio" 
                    name="internet" 
                    value="CCTV와 함께 설치 희망"
                    checked={hasInternet === 'CCTV와 함께 설치 희망'}
                    onChange={(e) => setHasInternet(e.target.value)}
                  />
                  CCTV와 함께 설치 희망
                </label>
              </div>
            </div>

            <div className="form-field">
              <label className="checkbox-label privacy-checkbox">
                <input 
                  type="checkbox" 
                  checked={privacyConsent}
                  onChange={(e) => setPrivacyConsent(e.target.checked)}
                />
                <span>개인 정보 수집 동의</span>
                <span className="detail-link" onClick={(e) => { e.preventDefault(); setShowPrivacyModal(true); }}>자세히보기</span>
              </label>
            </div>

            <button className="next-button" onClick={handleFormSubmit}>
              다음
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="datetime-selection-container" ref={containerRef}>
          <h2>설치를 희망하는 날짜와 시간<br/>
            <span className="note">* 설치팀의 상황에 따라 조정될 수 있습니다. *</span>
          </h2>

          <div className="datetime-content">
            <div className="calendar-section">
              <div className="calendar-header">
                <button 
                  className="month-nav-btn" 
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                >
                  ◀
                </button>
                <h3>{currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월</h3>
                <button 
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
              <div className="time-group">
                <h4>오전</h4>
                <div className="time-slots">
                  {timeSlots.morning.map(time => (
                    <button
                      key={time}
                      className={`time-slot ${selectedTime === time ? 'selected' : ''}`}
                      onClick={() => setSelectedTime(time)}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
              <div className="time-group">
                <h4>오후</h4>
                <div className="time-slots">
                  {timeSlots.afternoon.map(time => (
                    <button
                      key={time}
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

          <div className="datetime-actions">
            <button className="back-button" onClick={() => setStep(3)}>
              이전
            </button>
            <button 
              className="submit-final-button" 
              onClick={handleFinalSubmit}
              disabled={!selectedDate || !selectedTime}
            >
              신청하기
            </button>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="privacy-modal-overlay" onClick={() => setShowPrivacyModal(false)}>
          <div className="privacy-modal" onClick={(e) => e.stopPropagation()}>
            <h3>개인정보 수집 및 이용 동의</h3>
            <div className="privacy-content">
              <p><strong>1. 수집하는 개인정보 항목</strong></p>
              <ul>
                <li>연락처 (전화번호)</li>
                <li>설치 희망 주소</li>
                <li>설치 희망 일시</li>
              </ul>
              
              <p><strong>2. 개인정보의 수집 및 이용 목적</strong></p>
              <ul>
                <li>CCTV 설치 상담 및 견적 안내</li>
                <li>설치 일정 조율</li>
                <li>서비스 관련 연락</li>
              </ul>
              
              <p><strong>3. 개인정보의 보유 및 이용 기간</strong></p>
              <ul>
                <li>상담 완료 후 1년간 보관</li>
                <li>동의 철회 시 즉시 파기</li>
              </ul>
              
              <p><strong>4. 동의 거부 권리</strong></p>
              <p>개인정보 수집에 동의하지 않을 권리가 있으나, 동의 거부 시 상담 신청이 제한됩니다.</p>
            </div>
            <button className="privacy-close-btn" onClick={() => setShowPrivacyModal(false)}>
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceEstimate;
