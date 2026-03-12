import React, { useState, useEffect } from 'react';
import { serviceRequestAPI, contactFormAPI } from '../../services/api';
import './Dashboard.css';

const CustomerDashboard = () => {
  const [activeTab, setActiveTab] = useState('serviceRequests');
  const [serviceRequests, setServiceRequests] = useState([]);
  const [contactForms, setContactForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [serviceRes, contactRes] = await Promise.all([
        serviceRequestAPI.getAll(),
        contactFormAPI.getAll()
      ]);
      setServiceRequests(serviceRes.data);
      setContactForms(contactRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    try {
      await serviceRequestAPI.create(formData);
      setMessage('서비스 요청이 성공적으로 생성되었습니다!');
      setShowServiceModal(false);
      setFormData({});
      fetchData();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || '서비스 요청 생성 중 오류가 발생했습니다');
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    try {
      await contactFormAPI.create(formData);
      setMessage('문의가 성공적으로 제출되었습니다!');
      setShowContactModal(false);
      setFormData({});
      fetchData();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || '문의 제출 중 오류가 발생했습니다');
    }
  };

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div className="dashboard-container">
      <div className="container">
        <h1>고객 대시보드</h1>
        
        {message && <div className="alert alert-success">{message}</div>}

        <div className="dashboard-actions">
          <button onClick={() => setShowServiceModal(true)} className="btn btn-primary">
            새 A/S 요청
          </button>
          <button onClick={() => setShowContactModal(true)} className="btn btn-secondary">
            새 문의하기
          </button>
        </div>

        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'serviceRequests' ? 'active' : ''}`}
            onClick={() => setActiveTab('serviceRequests')}
          >
            A/S 요청 ({serviceRequests.length})
          </button>
          <button 
            className={`tab ${activeTab === 'contactForms' ? 'active' : ''}`}
            onClick={() => setActiveTab('contactForms')}
          >
            문의 내역 ({contactForms.length})
          </button>
        </div>

        {activeTab === 'serviceRequests' && (
          <div className="card">
            <h3 className="card-header">내 A/S 요청</h3>
            {serviceRequests.length === 0 ? (
              <p>아직 서비스 요청이 없습니다.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>제목</th>
                    <th>카테고리</th>
                    <th>상태</th>
                    <th>우선순위</th>
                    <th>생성일</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceRequests.map((request) => (
                    <tr key={request._id}>
                      <td>{request.subject}</td>
                      <td>{request.category}</td>
                      <td><span className={`badge badge-${request.status}`}>{request.status}</span></td>
                      <td>{request.priority}</td>
                      <td>{new Date(request.createdAt).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'contactForms' && (
          <div className="card">
            <h3 className="card-header">내 문의 내역</h3>
            {contactForms.length === 0 ? (
              <p>아직 문의 내역이 없습니다.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>제목</th>
                    <th>이메일</th>
                    <th>상태</th>
                    <th>생성일</th>
                  </tr>
                </thead>
                <tbody>
                  {contactForms.map((form) => (
                    <tr key={form._id}>
                      <td>{form.subject}</td>
                      <td>{form.email}</td>
                      <td><span className={`badge badge-${form.status}`}>{form.status}</span></td>
                      <td>{new Date(form.createdAt).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Service Request Modal */}
        {showServiceModal && (
          <div className="modal-overlay" onClick={() => setShowServiceModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3 className="modal-header">새 서비스 요청</h3>
              <form onSubmit={handleServiceSubmit}>
                <div className="form-group">
                  <label>제목</label>
                  <input type="text" name="subject" onChange={onChange} className="form-control" required />
                </div>
                <div className="form-group">
                  <label>설명</label>
                  <textarea name="description" onChange={onChange} className="form-control" required />
                </div>
                <div className="form-group">
                  <label>카테고리</label>
                  <select name="category" onChange={onChange} className="form-control">
                    <option value="warranty">보증</option>
                    <option value="repair">수리</option>
                    <option value="replacement">교체</option>
                    <option value="consultation">상담</option>
                    <option value="other">기타</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>제품명</label>
                  <input type="text" name="productInfo.name" onChange={(e) => setFormData({...formData, productInfo: {...formData.productInfo, name: e.target.value}})} className="form-control" />
                </div>
                <div className="modal-footer">
                  <button type="button" onClick={() => setShowServiceModal(false)} className="btn btn-secondary">취소</button>
                  <button type="submit" className="btn btn-primary">제출</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Contact Form Modal */}
        {showContactModal && (
          <div className="modal-overlay" onClick={() => setShowContactModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3 className="modal-header">새 문의하기</h3>
              <form onSubmit={handleContactSubmit}>
                <div className="form-group">
                  <label>이름</label>
                  <input type="text" name="name" onChange={onChange} className="form-control" required />
                </div>
                <div className="form-group">
                  <label>이메일</label>
                  <input type="email" name="email" onChange={onChange} className="form-control" required />
                </div>
                <div className="form-group">
                  <label>전화번호</label>
                  <input type="tel" name="phone" onChange={onChange} className="form-control" />
                </div>
                <div className="form-group">
                  <label>제목</label>
                  <input type="text" name="subject" onChange={onChange} className="form-control" required />
                </div>
                <div className="form-group">
                  <label>메시지</label>
                  <textarea name="message" onChange={onChange} className="form-control" required />
                </div>
                <div className="modal-footer">
                  <button type="button" onClick={() => setShowContactModal(false)} className="btn btn-secondary">취소</button>
                  <button type="submit" className="btn btn-primary">제출</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;
