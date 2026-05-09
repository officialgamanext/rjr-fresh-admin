import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, firebaseConfig } from '../firebase';
import { initializeApp, deleteApp, getApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { 
  Users, 
  Plus, 
  Search, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  Phone, 
  User, 
  Key, 
  ShieldAlert,
  Loader2,
  X,
  ChevronRight,
  Save,
  MapPin
} from 'lucide-react';
import '../css/Global.css';
import '../css/Employees.css';
import { useLocation } from '../LocationContext';

const Employees = () => {
  const navigate = useNavigate();
  const { locations } = useLocation();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form State
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    username: '',
    password: '',
    locationId: '',
    locationName: '',
    emergencyContact: {
      name: '',
      relation: '',
      mobile: ''
    }
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const list = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setEmployees(list);
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.username || !formData.password) {
      alert("Please fill all required fields");
      return;
    }

    try {
      setIsSaving(true);
      
      if (editingEmployee) {
        await updateDoc(doc(db, "users", editingEmployee.id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
      } else {
        // Initialize secondary app to create user without logging out admin
        let secondaryApp;
        try {
          secondaryApp = getApp("Secondary");
        } catch (e) {
          secondaryApp = initializeApp(firebaseConfig, "Secondary");
        }
        
        const secondaryAuth = getAuth(secondaryApp);
        
        // Handle case where username is already an email
        const userEmail = formData.username.includes('@') 
          ? formData.username.toLowerCase() 
          : `${formData.username.toLowerCase()}@rjrfresh.com`;

        // Create in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(
          secondaryAuth, 
          userEmail, 
          formData.password
        );
        
        // Save to Firestore with Auth UID
        await addDoc(collection(db, "users"), {
          ...formData,
          authUid: userCredential.user.uid,
          role: 'Employee',
          createdAt: serverTimestamp()
        });

        // Sign out and delete secondary app to clean up
        await secondaryAuth.signOut();
        // await deleteApp(secondaryApp); // deleteApp might cause issues if reused, better to just signOut
      }
      setShowAddModal(false);
      resetForm();
      fetchEmployees();
    } catch (error) {
      alert("Error saving employee: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      mobile: '',
      username: '',
      password: '',
      locationId: '',
      locationName: '',
      emergencyContact: {
        name: '',
        relation: '',
        mobile: ''
      }
    });
    setEditingEmployee(null);
  };

  const handleEdit = (e, emp) => {
    e.stopPropagation();
    setEditingEmployee(emp);
    setFormData({
      name: emp.name || '',
      mobile: emp.mobile || '',
      username: emp.username || '',
      password: emp.password || '',
      locationId: emp.locationId || '',
      locationName: emp.locationName || '',
      emergencyContact: emp.emergencyContact || { name: '', relation: '', mobile: '' }
    });
    setShowAddModal(true);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this employee?")) {
      try {
        await deleteDoc(doc(db, "users", id));
        fetchEmployees();
      } catch (error) {
        alert("Error deleting employee");
      }
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.mobile?.includes(searchTerm)
  );

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="header-text-group">
          <h2 className="page-title">Employees</h2>
          <p className="breadcrumb">Management / Employees</p>
        </div>
        <button className="btn-primary" onClick={() => { resetForm(); setShowAddModal(true); }}>
          <Plus size={20} /> Add Employee
        </button>
      </div>

      <div className="search-filter-section">
        <div className="search-bar-modern">
          <Search size={20} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by name, username or mobile..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <Loader2 size={40} className="animate-spin" />
        </div>
      ) : (
        <div className="employees-grid">
          {filteredEmployees.map(emp => (
            <div 
              key={emp.id} 
              className="employee-card-modern"
              onClick={() => navigate(`/employees/${emp.id}`)}
            >
              <div className="emp-card-header">
                <div className="emp-avatar">
                  <User size={24} />
                </div>
                <div className="emp-actions">
                  <button className="btn-icon-sm" onClick={(e) => handleEdit(e, emp)}><Edit3 size={16} /></button>
                  <button className="btn-icon-sm delete" onClick={(e) => handleDelete(e, emp.id)}><Trash2 size={16} /></button>
                </div>
              </div>
              <div className="emp-card-body">
                <h3 className="emp-name">{emp.name}</h3>
                <p className="emp-username">@{emp.username}</p>
                
                <div className="emp-meta-list">
                  <div className="emp-meta-item">
                    <Phone size={14} />
                    <span>{emp.mobile}</span>
                  </div>
                  {emp.locationName && (
                    <div className="emp-meta-item">
                      <MapPin size={14} />
                      <span>{emp.locationName}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="emp-card-footer">
                <span className="view-details-text">View Details</span>
                <ChevronRight size={16} />
              </div>
            </div>
          ))}
          {filteredEmployees.length === 0 && (
            <div className="no-results">
              <Users size={48} />
              <p>No employees found.</p>
            </div>
          )}
        </div>
      )}

      {/* ADD/EDIT EMPLOYEE MODAL */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-container emp-modal">
            <div className="modal-header">
              <h3>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</h3>
              <button className="btn-close" onClick={() => setShowAddModal(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleSave} className="modal-form">
              <div className="form-section">
                <h4 className="section-title"><User size={16} /> Basic Information</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Enter full name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Mobile Number</label>
                    <input 
                      type="text" 
                      placeholder="Enter mobile number"
                      value={formData.mobile}
                      onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Assigned Location</label>
                    <select 
                      value={formData.locationId}
                      onChange={(e) => {
                        const loc = locations.find(l => l.id === e.target.value);
                        setFormData({
                          ...formData, 
                          locationId: e.target.value,
                          locationName: loc ? loc.name : ''
                        });
                      }}
                    >
                      <option value="">Select Location</option>
                      {locations.filter(l => l.id !== 'all').map(loc => (
                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4 className="section-title"><Key size={16} /> Login Credentials</h4>
                <div className="form-grid two-col">
                  <div className="form-group">
                    <label>Username *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Choose username"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Password *</label>
                    <input 
                      type="password" 
                      required
                      placeholder="Set password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4 className="section-title"><ShieldAlert size={16} /> Emergency Contact</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Contact Name</label>
                    <input 
                      type="text" 
                      placeholder="Name"
                      value={formData.emergencyContact.name}
                      onChange={(e) => setFormData({
                        ...formData, 
                        emergencyContact: { ...formData.emergencyContact, name: e.target.value }
                      })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Relation</label>
                    <input 
                      type="text" 
                      placeholder="Relation (e.g. Parent)"
                      value={formData.emergencyContact.relation}
                      onChange={(e) => setFormData({
                        ...formData, 
                        emergencyContact: { ...formData.emergencyContact, relation: e.target.value }
                      })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Contact Mobile</label>
                    <input 
                      type="text" 
                      placeholder="Mobile"
                      value={formData.emergencyContact.mobile}
                      onChange={(e) => setFormData({
                        ...formData, 
                        emergencyContact: { ...formData.emergencyContact, mobile: e.target.value }
                      })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={isSaving}>
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {editingEmployee ? 'Update Employee' : 'Save Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
