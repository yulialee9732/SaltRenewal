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
      setMessage('Service request created successfully!');
      setShowServiceModal(false);
      setFormData({});
      fetchData();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error creating service request');
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    try {
      await contactFormAPI.create(formData);
      setMessage('Contact form submitted successfully!');
      setShowContactModal(false);
      setFormData({});
      fetchData();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error submitting contact form');
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
        <h1>Customer Dashboard</h1>
        
        {message && <div className="alert alert-success">{message}</div>}

        <div className="dashboard-actions">
          <button onClick={() => setShowServiceModal(true)} className="btn btn-primary">
            New A/S Request
          </button>
          <button onClick={() => setShowContactModal(true)} className="btn btn-secondary">
            New Contact Form
          </button>
        </div>

        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'serviceRequests' ? 'active' : ''}`}
            onClick={() => setActiveTab('serviceRequests')}
          >
            A/S Requests ({serviceRequests.length})
          </button>
          <button 
            className={`tab ${activeTab === 'contactForms' ? 'active' : ''}`}
            onClick={() => setActiveTab('contactForms')}
          >
            Contact Forms ({contactForms.length})
          </button>
        </div>

        {activeTab === 'serviceRequests' && (
          <div className="card">
            <h3 className="card-header">My Service Requests</h3>
            {serviceRequests.length === 0 ? (
              <p>No service requests yet.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceRequests.map((request) => (
                    <tr key={request._id}>
                      <td>{request.subject}</td>
                      <td>{request.category}</td>
                      <td><span className={`badge badge-${request.status}`}>{request.status}</span></td>
                      <td>{request.priority}</td>
                      <td>{new Date(request.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'contactForms' && (
          <div className="card">
            <h3 className="card-header">My Contact Forms</h3>
            {contactForms.length === 0 ? (
              <p>No contact forms yet.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {contactForms.map((form) => (
                    <tr key={form._id}>
                      <td>{form.subject}</td>
                      <td>{form.email}</td>
                      <td><span className={`badge badge-${form.status}`}>{form.status}</span></td>
                      <td>{new Date(form.createdAt).toLocaleDateString()}</td>
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
              <h3 className="modal-header">New Service Request</h3>
              <form onSubmit={handleServiceSubmit}>
                <div className="form-group">
                  <label>Subject</label>
                  <input type="text" name="subject" onChange={onChange} className="form-control" required />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea name="description" onChange={onChange} className="form-control" required />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select name="category" onChange={onChange} className="form-control">
                    <option value="warranty">Warranty</option>
                    <option value="repair">Repair</option>
                    <option value="replacement">Replacement</option>
                    <option value="consultation">Consultation</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Product Name</label>
                  <input type="text" name="productInfo.name" onChange={(e) => setFormData({...formData, productInfo: {...formData.productInfo, name: e.target.value}})} className="form-control" />
                </div>
                <div className="modal-footer">
                  <button type="button" onClick={() => setShowServiceModal(false)} className="btn btn-secondary">Cancel</button>
                  <button type="submit" className="btn btn-primary">Submit</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Contact Form Modal */}
        {showContactModal && (
          <div className="modal-overlay" onClick={() => setShowContactModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3 className="modal-header">New Contact Form</h3>
              <form onSubmit={handleContactSubmit}>
                <div className="form-group">
                  <label>Name</label>
                  <input type="text" name="name" onChange={onChange} className="form-control" required />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" name="email" onChange={onChange} className="form-control" required />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input type="tel" name="phone" onChange={onChange} className="form-control" />
                </div>
                <div className="form-group">
                  <label>Subject</label>
                  <input type="text" name="subject" onChange={onChange} className="form-control" required />
                </div>
                <div className="form-group">
                  <label>Message</label>
                  <textarea name="message" onChange={onChange} className="form-control" required />
                </div>
                <div className="modal-footer">
                  <button type="button" onClick={() => setShowContactModal(false)} className="btn btn-secondary">Cancel</button>
                  <button type="submit" className="btn btn-primary">Submit</button>
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
