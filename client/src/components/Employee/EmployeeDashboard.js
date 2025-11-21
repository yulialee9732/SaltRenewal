import React, { useState, useEffect } from 'react';
import { serviceRequestAPI, contactFormAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import '../Customer/Dashboard.css';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('serviceRequests');
  const [serviceRequests, setServiceRequests] = useState([]);
  const [contactForms, setContactForms] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({ note: '', status: '' });
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

  const handleEdit = (item, type) => {
    setSelectedItem({ ...item, type });
    setEditData({ note: '', status: item.status });
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      if (selectedItem.type === 'service') {
        await serviceRequestAPI.update(selectedItem._id, editData);
      } else {
        await contactFormAPI.update(selectedItem._id, editData);
      }
      setMessage('Updated successfully!');
      setShowEditModal(false);
      fetchData();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error updating');
    }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      if (type === 'service') {
        await serviceRequestAPI.delete(id);
      } else {
        await contactFormAPI.delete(id);
      }
      setMessage('Deleted successfully!');
      fetchData();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error deleting');
    }
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div className="dashboard-container">
      <div className="container">
        <h1>Employee Dashboard</h1>
        <p>Welcome, {user?.name}</p>
        
        {message && <div className="alert alert-success">{message}</div>}

        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'serviceRequests' ? 'active' : ''}`}
            onClick={() => setActiveTab('serviceRequests')}
          >
            Service Requests ({serviceRequests.length})
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
            <h3 className="card-header">All Service Requests</h3>
            {serviceRequests.length === 0 ? (
              <p>No service requests yet.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Subject</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceRequests.map((request) => (
                    <tr key={request._id}>
                      <td>{request.customer?.name}</td>
                      <td>{request.subject}</td>
                      <td>{request.category}</td>
                      <td><span className={`badge badge-${request.status}`}>{request.status}</span></td>
                      <td>{request.priority}</td>
                      <td>{new Date(request.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button onClick={() => handleEdit(request, 'service')} className="btn btn-primary btn-sm">Edit</button>
                        <button onClick={() => handleDelete(request._id, 'service')} className="btn btn-danger btn-sm">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'contactForms' && (
          <div className="card">
            <h3 className="card-header">All Contact Forms</h3>
            {contactForms.length === 0 ? (
              <p>No contact forms yet.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Subject</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contactForms.map((form) => (
                    <tr key={form._id}>
                      <td>{form.customer?.name}</td>
                      <td>{form.name}</td>
                      <td>{form.email}</td>
                      <td>{form.subject}</td>
                      <td><span className={`badge badge-${form.status}`}>{form.status}</span></td>
                      <td>{new Date(form.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button onClick={() => handleEdit(form, 'contact')} className="btn btn-primary btn-sm">Edit</button>
                        <button onClick={() => handleDelete(form._id, 'contact')} className="btn btn-danger btn-sm">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedItem && (
          <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3 className="modal-header">Edit {selectedItem.type === 'service' ? 'Service Request' : 'Contact Form'}</h3>
              
              <div className="item-details">
                <p><strong>Subject:</strong> {selectedItem.subject}</p>
                <p><strong>Current Status:</strong> <span className={`badge badge-${selectedItem.status}`}>{selectedItem.status}</span></p>
                {selectedItem.editHistory && selectedItem.editHistory.length > 0 && (
                  <div>
                    <p><strong>Edit History:</strong></p>
                    <ul>
                      {selectedItem.editHistory.map((edit, idx) => (
                        <li key={idx}>
                          {new Date(edit.editedAt).toLocaleString()} - {edit.editedBy?.name}: {edit.note}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <form onSubmit={handleUpdate}>
                <div className="form-group">
                  <label>Status</label>
                  <select 
                    value={editData.status} 
                    onChange={(e) => setEditData({...editData, status: e.target.value})}
                    className="form-control"
                  >
                    {selectedItem.type === 'service' ? (
                      <>
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </>
                    ) : (
                      <>
                        <option value="new">New</option>
                        <option value="read">Read</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </>
                    )}
                  </select>
                </div>
                <div className="form-group">
                  <label>Note (required)</label>
                  <textarea 
                    value={editData.note} 
                    onChange={(e) => setEditData({...editData, note: e.target.value})}
                    className="form-control" 
                    required 
                  />
                </div>
                <div className="modal-footer">
                  <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">Cancel</button>
                  <button type="submit" className="btn btn-primary">Update</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDashboard;
