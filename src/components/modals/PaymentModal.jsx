import React, { useState, useEffect, useMemo } from 'react';
import { X, Loader2, IndianRupee, CheckSquare, Square, Info } from 'lucide-react';
import { collection, query, where, getDocs, updateDoc, doc, addDoc, writeBatch, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import toast from 'react-hot-toast';
import CustomDropdown from '../CustomDropdown';

const PaymentModal = ({ isOpen, onClose, shop: initialShop }) => {
  const [selectedShop, setSelectedShop] = useState(initialShop || null);
  const [shops, setShops] = useState([]);
  const [amount, setAmount] = useState('0');
  const [pendingOrders, setPendingOrders] = useState([]);
  const [selectedOrderIds, setSelectedOrderIds] = useState(new Set());
  const [loadingShops, setLoadingShops] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isManualAmountEntry, setIsManualAmountEntry] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedShop(initialShop || null);
      setAmount('0');
      setPendingOrders([]);
      setSelectedOrderIds(new Set());
      setIsManualAmountEntry(false);
      
      if (!initialShop) {
        fetchShops();
      }
    }
  }, [isOpen, initialShop]);

  const [shopTotals, setShopTotals] = useState({ totalPaid: 0, totalDue: 0 });

  useEffect(() => {
    if (!selectedShop || !isOpen) return;

    setLoadingOrders(true);
    // Fetch all orders for the shop and filter locally to avoid index/type issues
    const q = query(collection(db, 'orders'), where('shopId', '==', selectedShop.id));
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const pending = [];
      let totalDueSum = 0;
      let totalPaidSum = 0;
      const initialIds = new Set();

      snap.docs.forEach(docSnap => {
        const d = docSnap.data();
        
        // Robust parsing of all possible financial fields
        const grandTotal = parseFloat(d.grandTotal || d.total || d.totalAmount || 0);
        const paid = parseFloat(d.paymentReceived || d.paidAmount || 0);
        const balanceField = d.balance !== undefined ? parseFloat(d.balance) : null;
        
        const due = balanceField !== null ? balanceField : (grandTotal - paid);
        
        totalPaidSum += paid;
        totalDueSum += due;

        // Loosened check: if there's any non-trivial balance, include it
        if (Math.abs(due) > 0.01) {
          pending.push({ 
            id: docSnap.id, 
            ...d, 
            pendingAmount: due,
            grandTotal: grandTotal,
            paymentReceived: paid
          });
          initialIds.add(docSnap.id);
        }
      });

      // Sort locally by createdAt asc (FIFO)
      pending.sort((a, b) => {
        const timeA = new Date(a.createdAt || a.date || 0).getTime();
        const timeB = new Date(b.createdAt || b.date || 0).getTime();
        return (isNaN(timeA) ? 0 : timeA) - (isNaN(timeB) ? 0 : timeB);
      });

      setPendingOrders(pending);
      setShopTotals({ totalPaid: totalPaidSum, totalDue: totalDueSum });
      setSelectedOrderIds(initialIds);
      
      const totalToPay = pending.reduce((sum, o) => sum + o.pendingAmount, 0);
      setAmount(totalToPay.toFixed(2));
      setLoadingOrders(false);
    }, (err) => {
      console.error("Error fetching orders:", err);
      toast.error("Failed to load orders");
      setLoadingOrders(false);
    });

    return () => unsubscribe();
  }, [selectedShop, isOpen]);

  const fetchShops = async () => {
    setLoadingShops(true);
    try {
      const snap = await getDocs(query(collection(db, 'shops'), orderBy('name', 'asc')));
      setShops(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load shops");
    } finally {
      setLoadingShops(false);
    }
  };

  // Handle Amount Change -> Auto-select orders
  const handleAmountChange = (val) => {
    setAmount(val);
    setIsManualAmountEntry(true);
    const numVal = parseFloat(val) || 0;
    let remaining = numVal;
    const newSelected = new Set();

    for (const order of pendingOrders) {
      if (remaining <= 0) break;
      newSelected.add(order.id);
      remaining -= order.pendingAmount;
    }
    setSelectedOrderIds(newSelected);
  };

  // Handle Checkbox Change -> Update Amount
  const toggleOrderSelection = (orderId) => {
    const newSelected = new Set(selectedOrderIds);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrderIds(newSelected);
    setIsManualAmountEntry(false);

    // Recalculate amount based on selected orders
    let newAmount = 0;
    pendingOrders.forEach(o => {
      if (newSelected.has(o.id)) {
        newAmount += o.pendingAmount;
      }
    });
    setAmount(newAmount.toFixed(2));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const pAmount = parseFloat(amount);
    if (!selectedShop) return toast.error("Please select a shop");
    if (!pAmount || pAmount <= 0) return toast.error("Please enter a valid amount");

    setSaving(true);
    const saveToast = toast.loading('Processing payment...');

    try {
      const batch = writeBatch(db);
      let remainingPayment = pAmount;
      let distributedAmount = 0;

      // Filter and sort pending orders to ensure FIFO distribution
      const ordersToApply = pendingOrders.filter(o => selectedOrderIds.has(o.id));
      
      for (const order of ordersToApply) {
        if (remainingPayment <= 0) break;

        const applied = Math.min(order.pendingAmount, remainingPayment);
        remainingPayment -= applied;
        distributedAmount += applied;

        const newReceived = (parseFloat(order.paymentReceived) || 0) + applied;
        const newStatus = newReceived >= (parseFloat(order.grandTotal) || 0) - 0.01 ? 'Paid' : 'Partial';

        batch.update(doc(db, 'orders', order.id), {
          paymentReceived: newReceived,
          paymentStatus: newStatus,
          updatedAt: new Date().toISOString()
        });
      }

      // Add payment record
      const paymentRef = doc(collection(db, 'payments'));
      batch.set(paymentRef, {
        shopId: selectedShop.id,
        shopName: selectedShop.name,
        amount: pAmount,
        distributedAmount: distributedAmount,
        unallocatedAmount: Math.max(0, remainingPayment),
        date: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });

      // Handle overpayment (Credits)
      if (remainingPayment > 0.01) {
        const shopRef = doc(db, 'shops', selectedShop.id);
        const currentCredits = parseFloat(selectedShop.credits) || 0;
        batch.update(shopRef, {
          credits: currentCredits + remainingPayment
        });

        batch.set(doc(collection(db, 'creditHistory')), {
          shopId: selectedShop.id,
          amount: remainingPayment,
          type: 'overpayment',
          description: `Overpayment from ₹${pAmount} payment`,
          createdAt: new Date().toISOString()
        });
      }

      await batch.commit();
      toast.success(`Payment processed successfully!`, { id: saveToast });
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to process payment", { id: saveToast });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '600px', width: '90%' }}>
        <div className="modal-header">
          <h2>Collect Payment</h2>
          <button className="close-btn" onClick={onClose} disabled={saving}><X size={24} /></button>
        </div>
        
        <form onSubmit={handleSave}>
          <div className="modal-body">
            {!initialShop && (
              <div className="form-group">
                <label>Select Shop</label>
                {loadingShops ? (
                  <Loader2 className="spinner" size={18} />
                ) : (
                  <CustomDropdown
                    options={shops.map(s => ({ value: s.id, label: s.name }))}
                    value={selectedShop?.id || ''}
                    onChange={(val) => setSelectedShop(shops.find(s => s.id === val))}
                    placeholder="Choose a shop..."
                    searchable={true}
                  />
                )}
              </div>
            )}

            {selectedShop && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '12px', border: '1px solid #dcfce7' }}>
                    <div style={{ fontSize: '11px', color: '#166534', fontWeight: 600, textTransform: 'uppercase' }}>Total Received</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#14532d' }}>₹{shopTotals.totalPaid.toFixed(2)}</div>
                  </div>
                  <div style={{ padding: '12px', backgroundColor: '#fef2f2', borderRadius: '12px', border: '1px solid #fee2e2' }}>
                    <div style={{ fontSize: '11px', color: '#991b1b', fontWeight: 600, textTransform: 'uppercase' }}>Total Due</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#7f1d1d' }}>₹{shopTotals.totalDue.toFixed(2)}</div>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label>Received Amount (₹)</label>
                  <div className="input-with-icon" style={{ position: 'relative' }}>
                    <IndianRupee size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      style={{ paddingLeft: '40px', fontSize: '20px', fontWeight: 700, height: '50px' }}
                      value={amount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div className="order-allocation-section">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Allocate to Orders ({pendingOrders.length} Pending)
                    </h4>
                    <button 
                      type="button" 
                      onClick={() => {
                        const allChecked = selectedOrderIds.size === pendingOrders.length;
                        if (allChecked) {
                          setSelectedOrderIds(new Set());
                          setAmount('0');
                        } else {
                          const allIds = new Set(pendingOrders.map(o => o.id));
                          setSelectedOrderIds(allIds);
                          const total = pendingOrders.reduce((sum, o) => sum + o.pendingAmount, 0);
                          setAmount(total.toFixed(2));
                        }
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      {selectedOrderIds.size === pendingOrders.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  {loadingOrders ? (
                    <div style={{ padding: '20px', textAlign: 'center' }}><Loader2 className="spinner" /></div>
                  ) : pendingOrders.length === 0 ? (
                    <div className="empty-state" style={{ padding: '30px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #e2e8f0' }}>
                      <Info size={32} color="#94a3b8" style={{ marginBottom: '8px' }} />
                      <p style={{ margin: 0, color: '#64748b' }}>No pending orders for this shop.</p>
                    </div>
                  ) : (
                    <div className="orders-list" style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                      {pendingOrders.map((order, index) => {
                        const isSelected = selectedOrderIds.has(order.id);
                        
                        // Calculate what the status will be
                        let currentRemaining = parseFloat(amount) || 0;
                        pendingOrders.slice(0, index).forEach(o => {
                          if (selectedOrderIds.has(o.id)) {
                            currentRemaining -= o.pendingAmount;
                          }
                        });
                        
                        const allocation = isSelected ? Math.max(0, Math.min(order.pendingAmount, currentRemaining)) : 0;
                        const finalReceived = (parseFloat(order.paymentReceived) || 0) + allocation;
                        const finalStatus = finalReceived >= (parseFloat(order.grandTotal) || 0) - 0.01 ? 'Paid' : (finalReceived > (parseFloat(order.paymentReceived) || 0) ? 'Partial' : order.paymentStatus || 'Unpaid');

                        return (
                          <div 
                            key={order.id} 
                            style={{ 
                              padding: '12px 16px', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '12px', 
                              borderBottom: index === pendingOrders.length - 1 ? 'none' : '1px solid #f1f5f9',
                              backgroundColor: isSelected ? '#f0f9ff' : 'transparent'
                            }}
                          >
                            <button 
                              type="button" 
                              onClick={() => toggleOrderSelection(order.id)}
                              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: isSelected ? 'var(--primary-color)' : '#cbd5e1' }}
                            >
                              {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                            </button>
                            
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 600, fontSize: '14px' }}>#{order.id.slice(-6).toUpperCase()}</span>
                                <span style={{ fontWeight: 700, fontSize: '14px', color: '#1e293b' }}>₹{order.pendingAmount.toFixed(2)}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                <span style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(order.createdAt).toLocaleDateString()}</span>
                                <span className={`status-badge status-${finalStatus === 'Paid' ? 'success' : finalStatus === 'Partial' ? 'warning' : 'danger'}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                                  {finalStatus}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {parseFloat(amount) > 0 && !loadingOrders && (
                  <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '12px', border: '1px solid #dcfce7' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#166534' }}>
                      <span>Total Allocated:</span>
                      <span style={{ fontWeight: 700 }}>₹{Math.min(parseFloat(amount), pendingOrders.reduce((s, o) => s + (selectedOrderIds.has(o.id) ? o.pendingAmount : 0), 0)).toFixed(2)}</span>
                    </div>
                    {parseFloat(amount) > pendingOrders.reduce((s, o) => s + (selectedOrderIds.has(o.id) ? o.pendingAmount : 0), 0) && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#9a3412', marginTop: '4px' }}>
                        <span>To Credits (Overpayment):</span>
                        <span style={{ fontWeight: 700 }}>₹{(parseFloat(amount) - pendingOrders.reduce((s, o) => s + (selectedOrderIds.has(o.id) ? o.pendingAmount : 0), 0)).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving || !amount || parseFloat(amount) <= 0 || !selectedShop}>
              {saving ? <Loader2 size={18} className="spinner" /> : 'Confirm Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
