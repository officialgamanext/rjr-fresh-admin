import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  ShieldAlert, 
  Calendar, 
  Loader2,
  MapPin,
  Clock,
  ChevronRight,
  Info,
  History
} from 'lucide-react';
import '../css/Global.css';

const EmployeeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [checkins, setCheckins] = useState([]);
  const [checkinsLoading, setCheckinsLoading] = useState(false);

  const tabs = [
    { id: 'info', label: 'Info', icon: Info },
    { id: 'checkins', label: 'Check-ins', icon: History }
  ];

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        setLoading(true);
        const docRef = doc(db, "users", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setEmployee({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Error fetching employee details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'checkins') {
      fetchCheckins();
    }
  }, [activeTab]);

  const fetchCheckins = async () => {
    try {
      setCheckinsLoading(true);
      // Using global checkins collection and filtering by employeeId
      const q = query(
        collection(db, "checkins"), 
        where("employeeId", "==", id),
        orderBy('timestamp', 'desc')
      );
      const snapshot = await getDocs(q);
      const list = [];
      snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      setCheckins(list);
    } catch (error) {
      console.error("Error fetching checkins:", error);
    } finally {
      setCheckinsLoading(false);
    }
  };

  if (loading) return <div className="page-wrapper"><div className="loading-state"><Loader2 size={40} className="animate-spin" /></div></div>;
  if (!employee) return <div className="page-wrapper"><div className="no-data">Employee not found.</div></div>;

  return (
    <div className="page-wrapper">
      <div className="page-header details-header">
        <div className="header-left-group">
          <button className="btn-back" onClick={() => navigate('/employees')}><ArrowLeft size={20} /></button>
          <div>
            <h2 className="page-title">{employee.name}</h2>
            <p className="breadcrumb">Employees / {employee.name}</p>
          </div>
        </div>
        <div className="status-badge-lg employee">Employee</div>
      </div>

      <div className="tabs-container" style={{ marginTop: '24px' }}>
        {tabs.map(tab => (
          <button 
            key={tab.id} 
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`} 
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-content" style={{ marginTop: '24px' }}>
        {activeTab === 'info' && (
          <div className="info-tab-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {/* Basic Info */}
            <div className="info-card-modern">
              <h3 style={{ marginBottom: '20px', fontSize: '16px', color: 'var(--text-muted)' }}>Basic Information</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <User size={20} color="var(--primary-color)" />
                  <div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Username</p>
                    <p style={{ fontWeight: '600' }}>@{employee.username}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Phone size={20} color="var(--primary-color)" />
                  <div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Mobile</p>
                    <p style={{ fontWeight: '600' }}>{employee.mobile || 'N/A'}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <MapPin size={20} color="var(--primary-color)" />
                  <div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Location</p>
                    <p style={{ fontWeight: '600' }}>{employee.locationName || 'N/A'}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Calendar size={20} color="var(--primary-color)" />
                  <div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Joined Date</p>
                    <p style={{ fontWeight: '600' }}>{employee.createdAt?.toDate().toLocaleDateString() || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="info-card-modern">
              <h3 style={{ marginBottom: '20px', fontSize: '16px', color: 'var(--text-muted)' }}>Emergency Contact</h3>
              {employee.emergencyContact ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <ShieldAlert size={20} color="#ef4444" />
                    <div>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Name</p>
                      <p style={{ fontWeight: '600' }}>{employee.emergencyContact.name || 'N/A'}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <User size={20} color="var(--text-muted)" />
                    <div>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Relation</p>
                      <p style={{ fontWeight: '600' }}>{employee.emergencyContact.relation || 'N/A'}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Phone size={20} color="var(--text-muted)" />
                    <div>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Mobile</p>
                      <p style={{ fontWeight: '600' }}>{employee.emergencyContact.mobile || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="no-data">No emergency contact details provided.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'checkins' && (
          <div className="checkins-tab-container">
            <div className="tab-header"><h3>Check-in History</h3></div>
            {checkinsLoading ? (
              <div className="loading-state"><Loader2 className="animate-spin" /></div>
            ) : (
              <div className="checkins-list">
                {checkins.length === 0 ? <p className="no-data">No check-ins recorded for this employee.</p> : (
                  <div className="data-table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Date & Time</th>
                          <th>Shop Name</th>
                          <th>Shop Address</th>
                          <th>Location</th>
                          <th>Distance</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {checkins.map(ci => (
                          <tr key={ci.id}>
                            <td>
                              <div className="ci-datetime">
                                <p className="ci-date" style={{ fontWeight: '600' }}>{ci.date}</p>
                                <p className="ci-time" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{ci.time}</p>
                              </div>
                            </td>
                            <td>
                              <div className="ci-shop">
                                <p className="shop-name" style={{ fontWeight: '600' }}>{ci.shopName}</p>
                              </div>
                            </td>
                            <td style={{ maxWidth: '200px', fontSize: '12px' }}>{ci.shopAddress}</td>
                            <td>{ci.locationName}</td>
                            <td>{ci.distance}m</td>
                            <td><span className={`status-tag ${ci.status.toLowerCase()}`}>{ci.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDetails;
