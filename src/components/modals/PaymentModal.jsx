import React, { useState } from 'react';
import { X, Loader2, IndianRupee } from 'lucide-react';
import { collection, query, where, getDocs, updateDoc, doc, addDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase';
import toast from 'react-hot-toast';

const PaymentModal = ({ isOpen, onClose, shop }) => {
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen || !shop) return null;

  const now = new Date();
  const dateStr = now.toLocaleDateString();
  const timeStr = now.toLocaleTimeString();

  const handleSave = async (e) => {
    e.preventDefault();
    const pAmount = parseFloat(amount);
    if (!pAmount || isNaN(pAmount) || pAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setSaving(true);
    const saveToast = toast.loading('Processing payment...');

    try {
      let remainingPayment = pAmount;

      // 1. Get all orders for this shop that are not fully paid
      // Since Firestore doesn't support NOT EQUAL easily with other filters without index,
      // we'll fetch all orders for the shop and filter locally. Or just fetch all and sort.
      const q = query(
        collection(db, 'orders'),
        where('shopId', '==', shop.id)
      );
      const snap = await getDocs(q);
      
      const ordersToUpdate = [];
      snap.forEach(docSnap => {
        const d = docSnap.data();
        if (d.paymentStatus !== 'Paid' && d.grandTotal > (d.paymentReceived || 0)) {
          ordersToUpdate.push({ id: docSnap.id, ...d });
        }
      });

      // Sort by oldest first
      ordersToUpdate.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      const batch = writeBatch(db);
      let distributedAmount = 0;

      for (const order of ordersToUpdate) {
        if (remainingPayment <= 0) break;

        const due = order.grandTotal - (order.paymentReceived || 0);
        if (due > 0) {
          const applied = Math.min(due, remainingPayment);
          remainingPayment -= applied;
          distributedAmount += applied;

          const newReceived = (order.paymentReceived || 0) + applied;
          const newStatus = newReceived >= order.grandTotal ? 'Paid' : 'Partial';

          const orderRef = doc(db, 'orders', order.id);
          batch.update(orderRef, {
            paymentReceived: newReceived,
            paymentStatus: newStatus,
            updatedAt: new Date().toISOString()
          });
        }
      }

      // Add payment record
      const paymentRef = doc(collection(db, 'payments'));
      batch.set(paymentRef, {
        shopId: shop.id,
        shopName: shop.name,
        amount: pAmount,
        distributedAmount: distributedAmount,
        unallocatedAmount: remainingPayment,
        date: now.toISOString(),
        createdAt: now.toISOString()
      });

      // If unallocated, maybe we should add it to shop's credits?
      if (remainingPayment > 0) {
        const shopRef = doc(db, 'shops', shop.id);
        const currentCredits = shop.credits || 0;
        batch.update(shopRef, {
          credits: currentCredits + remainingPayment
        });

        // Add credit history
        const creditRef = doc(collection(db, 'creditHistory'));
        batch.set(creditRef, {
          shopId: shop.id,
          amount: remainingPayment,
          type: 'overpayment',
          description: `Overpayment from ₹${pAmount} payment`,
          createdAt: now.toISOString()
        });
      }

      await batch.commit();

      toast.success(`Payment of ₹${pAmount} added and distributed!`, { id: saveToast });
      if (remainingPayment > 0) {
        toast.success(`₹${remainingPayment} added to shop credits as overpayment.`);
      }

      onClose();
      setAmount('');
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("Failed to process payment", { id: saveToast });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h2>Add Payment</h2>
          <button className="close-btn" onClick={onClose} disabled={saving}><X size={24} /></button>
        </div>
        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="form-group">
              <label>Shop Name</label>
              <input type="text" className="form-control" value={shop.name} disabled />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>Date</label>
                <input type="text" className="form-control" value={dateStr} disabled />
              </div>
              <div className="form-group">
                <label>Time</label>
                <input type="text" className="form-control" value={timeStr} disabled />
              </div>
            </div>
            <div className="form-group">
              <label>Amount to Pay (₹)</label>
              <div className="input-with-icon" style={{ position: 'relative' }}>
                <IndianRupee size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="number"
                  className="form-control"
                  style={{ paddingLeft: '32px' }}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  min="1"
                />
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                Amount will be distributed to oldest unpaid orders automatically.
              </p>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving || !amount}>
              {saving ? <Loader2 size={18} className="spinner" /> : 'Process Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
