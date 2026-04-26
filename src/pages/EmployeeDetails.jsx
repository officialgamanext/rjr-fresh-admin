import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  doc, 
  getDoc, 
  updateDoc,
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  addDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Info, 
  Clock, 
  Calendar,
  Edit2, 
  X, 
  Loader2, 
  Plus,
  CheckCircle,
  AlertCircle,
  IndianRupee,
  History,
  TrendingDown,
  TrendingUp,
  Briefcase,
  Heart,
  Award
} from 'lucide-react';
import toast from 'react-hot-toast';
import '../css/pages/dashboard.css';
import '../css/components/table.css';
import '../css/components/modal.css';
import '../css/pages/employee-details.css';

const EmployeeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  
  // Advance State
  const [advances, setAdvances] = useState([]);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [savingAdvance, setSavingAdvance] = useState(false);

  // Installment State
  const [isInstallmentModalOpen, setIsInstallmentModalOpen] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState(null);
  const [installmentAmount, setInstallmentAmount] = useState('');
  const [savingInstallment, setSavingInstallment] = useState(false);

  // Checkins State
  const [checkins, setCheckins] = useState([]);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const docRef = doc(db, 'employees', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setEmployee({ id: docSnap.id, ...docSnap.data() });
        } else {
          toast.error("Employee not found");
          navigate('/employees');
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [id, navigate]);

  // Fetch Advances & Installments
  useEffect(() => {
    if (activeTab === 'advance') {
      const q = query(collection(db, `employees/${id}/advances`), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const advancesData = [];
        for (const advanceDoc of snapshot.docs) {
          const adv = { id: advanceDoc.id, ...advanceDoc.data() };
          // Fetch installments for this advance
          const instQ = query(collection(db, `employees/${id}/advances/${adv.id}/installments`), orderBy('createdAt', 'desc'));
          // Since we can't easily do nested onSnapshot in a loop, we'll just fetch once or restructure.
          // For now, I'll use a simpler approach: store installments count/total in the advance doc itself or just fetch them.
          // Actually, let's just use a separate effect or sub-component for better management.
          advancesData.push(adv);
        }
        setAdvances(advancesData);
      });
      return () => unsubscribe();
    }
  }, [activeTab, id]);

  // Fetch Checkins
  useEffect(() => {
    if (activeTab === 'checkins') {
      const q = query(collection(db, `employees/${id}/checkins`), orderBy('timestamp', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setCheckins(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return () => unsubscribe();
    }
  }, [activeTab, id]);

  const handleAddAdvance = async (e) => {
    e.preventDefault();
    setSavingAdvance(true);
    try {
      await addDoc(collection(db, `employees/${id}/advances`), {
        amount: parseFloat(advanceAmount),
        paidAmount: 0,
        status: 'Pending',
        createdAt: new Date().toISOString()
      });
      toast.success("Advance added!");
      setIsAdvanceModalOpen(false);
      setAdvanceAmount('');
    } catch (error) {
      toast.error("Failed to add advance");
    } finally {
      setSavingAdvance(false);
    }
  };

  const handleAddInstallment = async (e) => {
    e.preventDefault();
    setSavingInstallment(true);
    try {
      const instAmount = parseFloat(installmentAmount);
      await addDoc(collection(db, `employees/${id}/advances/${selectedAdvance.id}/installments`), {
        amount: instAmount,
        createdAt: new Date().toISOString()
      });

      // Update total paid in advance doc
      const newPaid = (selectedAdvance.paidAmount || 0) + instAmount;
      const newStatus = newPaid >= selectedAdvance.amount ? 'Completed' : 'Pending';
      await updateDoc(doc(db, `employees/${id}/advances`, selectedAdvance.id), {
        paidAmount: newPaid,
        status: newStatus
      });

      toast.success("Installment added!");
      setIsInstallmentModalOpen(false);
      setInstallmentAmount('');
    } catch (error) {
      toast.error("Failed to add installment");
    } finally {
      setSavingInstallment(false);
    }
  };

  const totalAdvance = advances.reduce((acc, curr) => acc + curr.amount, 0);
  const totalPaid = advances.reduce((acc, curr) => acc + (curr.paidAmount || 0), 0);
  const pendingAmount = totalAdvance - totalPaid;

  if (loading) return <div className="loader-container"><Loader2 className="spinner" /></div>;
  if (!employee) return null;

  return (
    <div className="employee-details-page">
      <div className="page-header">
        <div>
          <button onClick={() => navigate('/employees')} className="back-link">
            <ArrowLeft size={16} /> Back to Employees
          </button>
          <div className="header-main">
            <div className="employee-avatar-lg">{employee.name.charAt(0)}</div>
            <div>
              <h1>{employee.name}</h1>
              <div className="employee-meta">
                <span><Briefcase size={14} /> {employee.role}</span>
                <span><Clock size={14} /> Joined {new Date(employee.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="tabs-container-premium">
        <button className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}><Info size={18} /> Personal Info</button>
        <button className={`tab-btn ${activeTab === 'checkins' ? 'active' : ''}`} onClick={() => setActiveTab('checkins')}><Clock size={18} /> Check-ins</button>
        <button className={`tab-btn ${activeTab === 'advance' ? 'active' : ''}`} onClick={() => setActiveTab('advance')}><IndianRupee size={18} /> Advance & Analytics</button>
      </div>

      <div className="tab-content-area">
        {activeTab === 'info' && (
          <div className="info-grid-layout">
            <div className="card details-card">
              <div className="card-header">
                <h3><User size={18} /> Personal Details</h3>
              </div>
              <div className="details-list">
                <div className="detail-item">
                  <div className="icon-label"><Phone size={16} /> Mobile</div>
                  <div className="detail-value">{employee.mobile}</div>
                </div>
                <div className="detail-item">
                  <div className="icon-label"><Mail size={16} /> Email</div>
                  <div className="detail-value">{employee.email || 'N/A'}</div>
                </div>
                <div className="detail-item">
                  <div className="icon-label"><MapPin size={16} /> Address</div>
                  <div className="detail-value">{employee.address}</div>
                </div>
              </div>
            </div>

            <div className="card details-card">
              <div className="card-header">
                <h3><Heart size={18} /> Emergency Contact</h3>
              </div>
              <div className="details-list">
                <div className="detail-item">
                  <div className="icon-label">Relation</div>
                  <div className="detail-value">{employee.emergencyContact.relation}</div>
                </div>
                <div className="detail-item">
                  <div className="icon-label">Contact Name</div>
                  <div className="detail-value">{employee.emergencyContact.name}</div>
                </div>
                <div className="detail-item">
                  <div className="icon-label"><Phone size={16} /> Contact Mobile</div>
                  <div className="detail-value">{employee.emergencyContact.mobile}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'checkins' && (
          <div className="card">
            <div className="card-header">
              <h3>Attendance History</h3>
            </div>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>DATE</th>
                    <th>CHECK-IN TIME</th>
                    <th>LOCATION</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {checkins.length === 0 ? (
                    <tr><td colSpan="4" className="text-center">No check-in records found</td></tr>
                  ) : (
                    checkins.map(ci => (
                      <tr key={ci.id}>
                        <td>{new Date(ci.timestamp).toLocaleDateString()}</td>
                        <td>{new Date(ci.timestamp).toLocaleTimeString()}</td>
                        <td>{ci.locationName || 'Main Office'}</td>
                        <td><span className="status-badge status-success">Present</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'advance' && (
          <div className="advance-section-layout">
            <div className="analytics-grid">
              <div className="stat-card total">
                <div className="stat-icon"><TrendingUp /></div>
                <div className="stat-data">
                  <span className="stat-label">Total Advance</span>
                  <span className="stat-value">₹{totalAdvance.toLocaleString()}</span>
                </div>
              </div>
              <div className="stat-card paid">
                <div className="stat-icon"><CheckCircle /></div>
                <div className="stat-data">
                  <span className="stat-label">Total Paid</span>
                  <span className="stat-value">₹{totalPaid.toLocaleString()}</span>
                </div>
              </div>
              <div className="stat-card pending">
                <div className="stat-icon"><AlertCircle /></div>
                <div className="stat-data">
                  <span className="stat-label">Pending Amount</span>
                  <span className="stat-value">₹{pendingAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="card advances-list-card">
              <div className="card-header">
                <h3>Advances History</h3>
                <button className="btn-primary" onClick={() => setIsAdvanceModalOpen(true)}>
                  <Plus size={18} /> Add Advance
                </button>
              </div>
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>DATE</th>
                      <th>TOTAL AMOUNT</th>
                      <th>PAID AMOUNT</th>
                      <th>PENDING</th>
                      <th>STATUS</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {advances.length === 0 ? (
                      <tr><td colSpan="6" className="text-center">No advance records found</td></tr>
                    ) : (
                      advances.map(adv => (
                        <tr key={adv.id}>
                          <td>{new Date(adv.createdAt).toLocaleDateString()}</td>
                          <td className="font-bold">₹{adv.amount}</td>
                          <td className="text-success">₹{adv.paidAmount || 0}</td>
                          <td className="text-danger">₹{adv.amount - (adv.paidAmount || 0)}</td>
                          <td>
                            <span className={`status-badge ${adv.status === 'Completed' ? 'status-success' : 'status-warning'}`}>
                              {adv.status}
                            </span>
                          </td>
                          <td>
                            <button 
                              className="btn-success-sm" 
                              onClick={() => { setSelectedAdvance(adv); setIsInstallmentModalOpen(true); }}
                              disabled={adv.status === 'Completed'}
                            >
                              Add Installment
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Advance Modal */}
      {isAdvanceModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content custom-modal">
            <div className="modal-header">
              <h2>Add Advance Amount</h2>
              <button className="close-btn" onClick={() => setIsAdvanceModalOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleAddAdvance}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Amount (₹)</label>
                  <div className="input-with-icon-premium">
                    <div className="icon-wrapper"><IndianRupee size={18} /></div>
                    <input 
                      type="number" 
                      className="form-control premium-input" 
                      value={advanceAmount} 
                      onChange={(e) => setAdvanceAmount(e.target.value)} 
                      required 
                      placeholder="Enter amount"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary-premium" onClick={() => setIsAdvanceModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary-premium" disabled={savingAdvance}>
                  {savingAdvance ? <Loader2 size={18} className="spinner" /> : 'Save Advance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Installment Modal */}
      {isInstallmentModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content custom-modal">
            <div className="modal-header">
              <h2>Add Installment</h2>
              <button className="close-btn" onClick={() => setIsInstallmentModalOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleAddInstallment}>
              <div className="modal-body">
                <div className="info-summary-box">
                  <div>Advance Amount: <strong>₹{selectedAdvance.amount}</strong></div>
                  <div>Already Paid: <strong>₹{selectedAdvance.paidAmount || 0}</strong></div>
                  <div className="pending">Pending: <strong>₹{selectedAdvance.amount - (selectedAdvance.paidAmount || 0)}</strong></div>
                </div>
                <div className="form-group" style={{ marginTop: '20px' }}>
                  <label>Installment Amount (₹)</label>
                  <div className="input-with-icon-premium">
                    <div className="icon-wrapper"><IndianRupee size={18} /></div>
                    <input 
                      type="number" 
                      className="form-control premium-input" 
                      value={installmentAmount} 
                      onChange={(e) => setInstallmentAmount(e.target.value)} 
                      required 
                      max={selectedAdvance.amount - (selectedAdvance.paidAmount || 0)}
                      placeholder="Enter amount"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary-premium" onClick={() => setIsInstallmentModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary-premium" disabled={savingInstallment}>
                  {savingInstallment ? <Loader2 size={18} className="spinner" /> : 'Save Installment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default EmployeeDetails;
