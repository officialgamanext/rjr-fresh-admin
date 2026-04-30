import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  User, 
  MoreVertical, 
  Edit, 
  Trash2, 
  X, 
  Loader2,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Eye,
  Heart,
  Lock
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  deleteDoc, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, secondaryAuth } from '../firebase';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import CustomDropdown from '../components/CustomDropdown';
import '../css/pages/dashboard.css';
import '../css/components/table.css';
import '../css/components/modal.css';
import '../css/pages/employees.css';

const Employees = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    address: '',
    role: '',
    username: '',
    password: '',
    emergencyContact: {
      relation: '',
      name: '',
      mobile: ''
    },
    access: {
      admin: {
        dashboard: false,
        shops: false,
        shopVisits: false,
        shopOrders: false,
        returnOrders: false,
        payments: false,
        customers: false,
        customerOrders: false,
        customerPrices: false,
        batches: false,
        items: false,
        categories: false,
        priceList: false,
        employees: false
      },
      app: {
        enabled: false,
        saleOrders: false,
        saleOrdersList: false,
        customerOrders: false,
        payments: false,
        returnOrders: false,
        shops: false
      }
    }
  });

  useEffect(() => {
    const q = query(collection(db, 'employees'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('emergency')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        emergencyContact: {
          ...prev.emergencyContact,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAccessChange = (type, field, checked) => {
    setFormData(prev => ({
      ...prev,
      access: {
        ...prev.access,
        [type]: {
          ...prev.access[type],
          [field]: checked
        }
      }
    }));
  };

  const handleOpenModal = (employee = null) => {
    if (employee) {
      setSelectedEmployee(employee);
      setFormData({
        name: employee.name,
        mobile: employee.mobile,
        email: employee.email || '',
        address: employee.address,
        role: employee.role,
        username: employee.username || '',
        password: '', // Don't show existing password for security
        emergencyContact: employee.emergencyContact || { relation: '', name: '', mobile: '' },
        access: employee.access || {
          admin: { dashboard: false, shops: false, shopVisits: false, shopOrders: false, returnOrders: false, payments: false, customers: false, customerOrders: false, customerPrices: false, batches: false, items: false, categories: false, priceList: false, employees: false },
          app: { enabled: false, saleOrders: false, saleOrdersList: false, customerOrders: false, payments: false, returnOrders: false, shops: false }
        }
      });
    } else {
      setSelectedEmployee(null);
      setFormData({
        name: '',
        mobile: '',
        email: '',
        address: '',
        role: '',
        username: '',
        password: '',
        emergencyContact: { relation: '', name: '', mobile: '' },
        access: {
          admin: { dashboard: false, shops: false, shopVisits: false, shopOrders: false, returnOrders: false, payments: false, customers: false, customerOrders: false, customerPrices: false, batches: false, items: false, categories: false, priceList: false, employees: false },
          app: { enabled: false, saleOrders: false, saleOrdersList: false, customerOrders: false, payments: false, returnOrders: false, shops: false }
        }
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEmployee(null);
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    setSaving(true);
    const saveToast = toast.loading(selectedEmployee ? 'Updating employee...' : 'Adding employee...');
    
    try {
      if (selectedEmployee) {
        // Update Firestore
        await updateDoc(doc(db, 'employees', selectedEmployee.id), {
          name: formData.name,
          mobile: formData.mobile,
          email: formData.email,
          address: formData.address,
          role: formData.role,
          username: formData.username,
          emergencyContact: formData.emergencyContact,
          access: formData.access,
          updatedAt: new Date().toISOString()
        });
        toast.success('Employee updated!', { id: saveToast });
      } else {
        // 1. Create Auth User
        const authEmail = `${formData.username.toLowerCase().trim()}@rjrfresh.com`;
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, authEmail, formData.password);
        const uid = userCredential.user.uid;

        // 2. Save to Firestore
        await addDoc(collection(db, 'employees'), {
          ...formData,
          uid: uid,
          authEmail: authEmail,
          createdAt: new Date().toISOString()
        });
        toast.success('Employee added with credentials!', { id: saveToast });
      }
      handleCloseModal();
    } catch (error) {
      console.error("Error saving employee:", error);
      let errorMsg = 'Failed to save employee';
      if (error.code === 'auth/email-already-in-use') errorMsg = 'Username already exists!';
      if (error.code === 'auth/weak-password') errorMsg = 'Password is too weak!';
      toast.error(errorMsg, { id: saveToast });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEmployee = (employee) => {
    setSelectedEmployee(employee);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteDoc(doc(db, 'employees', selectedEmployee.id));
      toast.success('Employee deleted');
      setIsDeleteModalOpen(false);
    } catch (error) {
      toast.error('Failed to delete employee');
    }
  };

  return (
    <div className="employees-page">
      <div className="page-header">
        <div>
          <h1>Employees Management</h1>
          <div className="breadcrumb">
            <span>Home</span>
            <span>&gt;</span>
            <span className="active">Employees List</span>
          </div>
        </div>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={20} />
          Add Employee
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="search-container">
            <Search size={18} className="search-icon" />
            <input type="text" placeholder="Search employees..." className="form-control" />
          </div>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>NAME</th>
                <th>ROLE</th>
                <th>CONTACT</th>
                <th>EMERGENCY CONTACT</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center"><Loader2 className="spinner" /></td></tr>
              ) : employees.length === 0 ? (
                <tr><td colSpan="5" className="text-center">No employees found</td></tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      <div className="user-info">
                        <div className="user-avatar">{emp.name.charAt(0)}</div>
                        <div>
                          <div className="user-name">{emp.name}</div>
                          <div className="user-email">{emp.email || 'No email'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="role-badge">{emp.role}</span>
                    </td>
                    <td>
                      <div className="contact-info">
                        <Phone size={14} /> {emp.mobile}
                      </div>
                    </td>
                    <td>
                      <div className="emergency-info">
                        <div className="emergency-name">{emp.emergencyContact.name} ({emp.emergencyContact.relation})</div>
                        <div className="emergency-mobile">{emp.emergencyContact.mobile}</div>
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="action-btn-ui view" onClick={() => navigate(`/employees/${emp.id}`)} title="View Details">
                          <Eye size={18} color="var(--primary-color)" />
                        </button>
                        <button className="action-btn-ui edit" onClick={() => handleOpenModal(emp)} title="Edit">
                          <Edit size={18} color="var(--warning)" />
                        </button>
                        <button className="action-btn-ui delete" onClick={() => handleDeleteEmployee(emp)} title="Delete">
                          <Trash2 size={18} color="var(--danger)" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay full-screen">
          <div className="modal-content full-screen-modal">
            <div className="modal-header">
              <div className="header-left">
                <div className="header-icon-box">
                  <User size={24} color="var(--primary-color)" />
                </div>
                <div>
                  <h2>{selectedEmployee ? 'Edit Employee' : 'Add New Employee'}</h2>
                  <p>Enter comprehensive employee information below</p>
                </div>
              </div>
              <button className="close-btn" onClick={handleCloseModal}><X size={28} /></button>
            </div>
            <form onSubmit={handleSaveEmployee} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body">
                <div className="modal-sections-grid">
                  <div className="modal-section">
                    <h3 className="section-title"><User size={18} /> Personal Details</h3>
                    <div className="form-group">
                      <label>Full Name</label>
                      <div className="input-with-icon-premium">
                        <div className="icon-wrapper"><User size={18} /></div>
                        <input type="text" name="name" className="form-control premium-input" value={formData.name} onChange={handleInputChange} required placeholder="Enter employee full name" />
                      </div>
                    </div>
                    <div className="form-row-grid">
                      <div className="form-group">
                        <label>Mobile Number</label>
                        <div className="input-with-icon-premium">
                          <div className="icon-wrapper"><Phone size={18} /></div>
                          <input type="text" name="mobile" className="form-control premium-input" value={formData.mobile} onChange={handleInputChange} required placeholder="10-digit number" />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Email (Optional)</label>
                        <div className="input-with-icon-premium">
                          <div className="icon-wrapper"><Mail size={18} /></div>
                          <input type="email" name="email" className="form-control premium-input" value={formData.email} onChange={handleInputChange} placeholder="email@example.com" />
                        </div>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Address</label>
                      <div className="input-with-icon-premium align-top">
                        <div className="icon-wrapper"><MapPin size={18} /></div>
                        <textarea name="address" className="form-control premium-input" rows="3" value={formData.address} onChange={handleInputChange} required placeholder="Complete residence address"></textarea>
                      </div>
                    </div>

                    {!selectedEmployee && (
                      <div className="credentials-box" style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #f1f5f9' }}>
                        <h4 className="sub-section-title"><User size={16} /> App Credentials</h4>
                        <div className="form-row-grid">
                          <div className="form-group">
                            <label>Username</label>
                            <input type="text" name="username" className="form-control premium-input" value={formData.username} onChange={handleInputChange} required placeholder="e.g. siva_krishna" style={{ paddingLeft: '14px !important' }} />
                          </div>
                          <div className="form-group">
                            <label>Password</label>
                            <input type="password" name="password" className="form-control premium-input" value={formData.password} onChange={handleInputChange} required placeholder="Min 6 characters" style={{ paddingLeft: '14px !important' }} />
                          </div>
                        </div>
                        <p style={{ fontSize: '11px', color: '#64748b', marginTop: '8px' }}>Login email will be <b>{formData.username || 'username'}@rjrfresh.com</b></p>
                      </div>
                    )}
                  </div>

                  <div className="modal-section">
                    <h3 className="section-title"><Briefcase size={18} /> Work & Emergency Details</h3>
                    <div className="form-group">
                      <label>Role / Designation</label>
                      <div className="input-with-icon-premium">
                        <div className="icon-wrapper"><Briefcase size={18} /></div>
                        <input type="text" name="role" className="form-control premium-input" value={formData.role} onChange={handleInputChange} required placeholder="e.g. Sales Executive, Delivery Boy" />
                      </div>
                    </div>
                    
                    <div className="emergency-box">
                      <h4 className="sub-section-title"><Heart size={16} /> Emergency Contact</h4>
                      <div className="form-group">
                        <label>Relation</label>
                        <CustomDropdown
                          options={[
                            { value: 'Father', label: 'Father' },
                            { value: 'Mother', label: 'Mother' },
                            { value: 'Spouse', label: 'Spouse' },
                            { value: 'Sibling', label: 'Sibling' },
                            { value: 'Friend', label: 'Friend' },
                            { value: 'Other', label: 'Other' }
                          ]}
                          value={formData.emergencyContact.relation}
                          onChange={(val) => handleInputChange({ target: { name: 'emergency.relation', value: val } })}
                          placeholder="Select Relation"
                        />
                      </div>
                      <div className="form-row-grid">
                        <div className="form-group">
                          <label>Contact Name</label>
                          <input type="text" name="emergency.name" className="form-control premium-input" value={formData.emergencyContact.name} onChange={handleInputChange} required placeholder="Full Name" style={{ paddingLeft: '14px !important' }} />
                        </div>
                        <div className="form-group">
                          <label>Contact Mobile</label>
                          <input type="text" name="emergency.mobile" className="form-control premium-input" value={formData.emergencyContact.mobile} onChange={handleInputChange} required placeholder="Mobile Number" style={{ paddingLeft: '14px !important' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-section" style={{ maxWidth: '1200px', margin: '24px auto 0' }}>
                  <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                    <Lock size={18} /> Access Permissions
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    
                    {/* Admin Access Column */}
                    <div className="access-column" style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                      <h4 style={{ margin: '0 0 20px 0', fontSize: '15px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-color)' }}></div>
                        Admin Panel Access
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                        {Object.keys(formData.access.admin).map((key) => (
                          <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', cursor: 'pointer', color: '#475569', fontWeight: 500 }}>
                            <input 
                              type="checkbox" 
                              checked={formData.access.admin[key]} 
                              onChange={(e) => handleAccessChange('admin', key, e.target.checked)}
                              style={{ width: '18px', height: '18px', accentColor: 'var(--primary-color)', cursor: 'pointer' }}
                            />
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* App Access Column */}
                    <div className="access-column" style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h4 style={{ margin: 0, fontSize: '15px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8b5cf6' }}></div>
                          Mobile App Access
                        </h4>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#8b5cf6', cursor: 'pointer', background: 'rgba(139, 92, 246, 0.1)', padding: '6px 12px', borderRadius: '20px' }}>
                          <input 
                            type="checkbox" 
                            checked={formData.access.app.enabled} 
                            onChange={(e) => handleAccessChange('app', 'enabled', e.target.checked)}
                            style={{ width: '16px', height: '16px', accentColor: '#8b5cf6', cursor: 'pointer' }}
                          />
                          Enable App Access
                        </label>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', opacity: formData.access.app.enabled ? 1 : 0.4, pointerEvents: formData.access.app.enabled ? 'auto' : 'none', transition: 'opacity 0.2s' }}>
                        {Object.keys(formData.access.app).filter(k => k !== 'enabled').map((key) => (
                          <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', cursor: 'pointer', color: '#475569', fontWeight: 500 }}>
                            <input 
                              type="checkbox" 
                              checked={formData.access.app[key]} 
                              onChange={(e) => handleAccessChange('app', key, e.target.checked)}
                              style={{ width: '18px', height: '18px', accentColor: '#8b5cf6', cursor: 'pointer' }}
                            />
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </label>
                        ))}
                      </div>
                    </div>
                    
                  </div>
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary-premium" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="btn-primary-premium lg" disabled={saving}>
                  {saving ? <Loader2 size={18} className="spinner" /> : (selectedEmployee ? 'Update Employee' : 'Save Employee Details')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Employee"
        message={`Are you sure you want to delete ${selectedEmployee?.name}? This action will permanently remove all associated records.`}
      />

    </div>
  );
};

export default Employees;
