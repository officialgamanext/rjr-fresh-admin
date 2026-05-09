import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  ShieldAlert, 
  Calendar, 
  Loader2,
  MapPin,
  Clock,
  ChevronRight
} from 'lucide-react';
import '../css/Global.css';

const EmployeeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

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

      <div className="employee-details-container" style={{ marginTop: '24px' }}>
        <div className="info-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          
          {/* Basic Info */}
          <div className="info-card-modern" style={{ height: 'fit-content' }}>
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
                <Calendar size={20} color="var(--primary-color)" />
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Joined Date</p>
                  <p style={{ fontWeight: '600' }}>{employee.createdAt?.toDate().toLocaleDateString() || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="info-card-modern" style={{ height: 'fit-content' }}>
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

        {/* Placeholder for future modules like attendance/salary */}
        <div className="placeholder-section" style={{ marginTop: '24px', padding: '40px', background: 'white', borderRadius: '16px', textAlign: 'center', border: '1px dashed var(--border-color)' }}>
          <Clock size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
          <h4 style={{ color: 'var(--text-main)' }}>Employee Activity & Attendance</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>This module will track daily attendance, check-ins, and performance metrics.</p>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetails;
