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
  Heart
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
import { db } from '../firebase';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
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
    emergencyContact: {
      relation: '',
      name: '',
      mobile: ''
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

  const handleOpenModal = (employee = null) => {
    if (employee) {
      setSelectedEmployee(employee);
      setFormData({
        name: employee.name,
        mobile: employee.mobile,
        email: employee.email || '',
        address: employee.address,
        role: employee.role,
        emergencyContact: employee.emergencyContact || { relation: '', name: '', mobile: '' }
      });
    } else {
      setSelectedEmployee(null);
      setFormData({
        name: '',
        mobile: '',
        email: '',
        address: '',
        role: '',
        emergencyContact: { relation: '', name: '', mobile: '' }
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
        await updateDoc(doc(db, 'employees', selectedEmployee.id), {
          ...formData,
          updatedAt: new Date().toISOString()
        });
        toast.success('Employee updated!', { id: saveToast });
      } else {
        await addDoc(collection(db, 'employees'), {
          ...formData,
          createdAt: new Date().toISOString()
        });
        toast.success('Employee added!', { id: saveToast });
      }
      handleCloseModal();
    } catch (error) {
      console.error("Error saving employee:", error);
      toast.error('Failed to save employee', { id: saveToast });
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
            <form onSubmit={handleSaveEmployee}>
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
                        <select name="emergency.relation" className="form-control premium-input" value={formData.emergencyContact.relation} onChange={handleInputChange} required>
                          <option value="">Select Relation</option>
                          <option value="Father">Father</option>
                          <option value="Mother">Mother</option>
                          <option value="Spouse">Spouse</option>
                          <option value="Sibling">Sibling</option>
                          <option value="Friend">Friend</option>
                          <option value="Other">Other</option>
                        </select>
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
