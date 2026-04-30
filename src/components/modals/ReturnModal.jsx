import React, { useState, useEffect } from 'react';
import { X, Loader2, Search, RefreshCw } from 'lucide-react';
import { collection, query, where, orderBy, limit, getDocs, doc, writeBatch, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import toast from 'react-hot-toast';
import CustomDropdown from '../CustomDropdown';

const ReturnModal = ({ isOpen, onClose, shop }) => {
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // State for items being returned: { itemId: { returnQty: 0, batchNumber: '' } }
  const [returnItems, setReturnItems] = useState({});
  const [saving, setSaving] = useState(false);

  const [locations, setLocations] = useState([]);
  const [shops, setShops] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [selectedShopId, setSelectedShopId] = useState('');
  const [globalShop, setGlobalShop] = useState(null);

  const activeShop = shop || globalShop;

  useEffect(() => {
    if (isOpen && !shop) {
      const fetchLocations = async () => {
         try {
           const locSnap = await getDocs(collection(db, 'locations'));
           setLocations(locSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
         } catch (error) {
           console.error("Error fetching locations:", error);
         }
      };
      fetchLocations();
    }
  }, [isOpen, shop]);

  useEffect(() => {
    if (selectedLocationId) {
      const fetchShops = async () => {
         try {
           const q = query(collection(db, 'shops'), where('locationId', '==', selectedLocationId));
           const shopSnap = await getDocs(q);
           setShops(shopSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
         } catch (error) {
           console.error("Error fetching shops:", error);
         }
      };
      fetchShops();
    } else {
      setShops([]);
      setSelectedShopId('');
      setGlobalShop(null);
    }
  }, [selectedLocationId]);

  useEffect(() => {
    if (selectedShopId) {
       const s = shops.find(s => s.id === selectedShopId);
       setGlobalShop(s || null);
    } else {
       setGlobalShop(null);
    }
  }, [selectedShopId, shops]);

  // Reset local state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedLocationId('');
      setSelectedShopId('');
      setGlobalShop(null);
      setSelectedOrder(null);
      setReturnItems({});
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && activeShop) {
      const fetchOrders = async () => {
        setLoadingOrders(true);
        try {
          const q = query(
            collection(db, 'orders'),
            where('shopId', '==', activeShop.id)
          );
          const snap = await getDocs(q);
          const allOrders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          // Sort locally to avoid needing a Firestore composite index
          allOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          
          // Take the most recent 15 orders
          setOrders(allOrders.slice(0, 15));
        } catch (error) {
          console.error("Error fetching orders for return:", error);
          toast.error("Failed to load recent orders");
        } finally {
          setLoadingOrders(false);
        }
      };
      fetchOrders();
    }
  }, [isOpen, activeShop]);

  const handleOrderSelect = (e) => {
    const orderId = e.target.value;
    if (!orderId) {
      setSelectedOrder(null);
      setReturnItems({});
      return;
    }
    const order = orders.find(o => o.id === orderId);
    setSelectedOrder(order);
    
    // Initialize return state
    const initialReturns = {};
    order.items.forEach(item => {
      initialReturns[item.itemId] = {
        returnQty: 0,
        batchNumber: item.batchNumber || '',
        price: item.price,
        itemName: item.itemName,
        maxQty: item.quantity
      };
    });
    setReturnItems(initialReturns);
  };

  const handleQtyChange = (itemId, qty) => {
    const value = parseInt(qty) || 0;
    const maxQty = returnItems[itemId].maxQty;
    const validQty = Math.min(Math.max(0, value), maxQty);
    
    setReturnItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        returnQty: validQty
      }
    }));
  };

  const handleBatchChange = (itemId, batch) => {
    setReturnItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        batchNumber: batch
      }
    }));
  };

  const calculateTotalRefund = () => {
    let total = 0;
    Object.values(returnItems).forEach(item => {
      total += (item.returnQty * item.price);
    });
    return total;
  };

  const handleSaveReturn = async () => {
    const refundAmount = calculateTotalRefund();
    if (refundAmount <= 0) {
      toast.error("Please select at least one item to return.");
      return;
    }

    setSaving(true);
    const saveToast = toast.loading('Processing return...');

    try {
      const batch = writeBatch(db);
      
      // 1. Calculate new order totals
      let returnedItemsList = [];
      let newOrderItems = selectedOrder.items.map(item => {
        const returned = returnItems[item.itemId];
        if (returned && returned.returnQty > 0) {
          returnedItemsList.push({
            itemId: item.itemId,
            itemName: item.itemName,
            quantity: returned.returnQty,
            price: item.price,
            batchNumber: returned.batchNumber,
            subtotal: returned.returnQty * item.price
          });
          return {
            ...item,
            quantity: item.quantity - returned.returnQty,
            subtotal: (item.quantity - returned.returnQty) * item.price
          };
        }
        return item;
      });

      const newTotalSubtotal = newOrderItems.reduce((acc, item) => acc + item.subtotal, 0);
      const newGrandTotal = Math.max(0, newTotalSubtotal - (selectedOrder.discount || 0));
      
      let creditToAdd = 0;
      let newPaymentStatus = selectedOrder.paymentStatus;
      let newPaymentReceived = selectedOrder.paymentReceived || 0;

      if (selectedOrder.paymentStatus === 'Paid') {
        // Fully paid -> Add refund to credits
        creditToAdd = refundAmount;
      } else {
        // Unpaid or Partial
        if (newPaymentReceived > newGrandTotal) {
          // Now overpaid
          creditToAdd = newPaymentReceived - newGrandTotal;
          newPaymentStatus = 'Paid';
        } else {
          newPaymentStatus = newPaymentReceived >= newGrandTotal ? 'Paid' : (newPaymentReceived > 0 ? 'Partial' : 'Unpaid');
        }
      }

      // 2. Update Order
      const orderRef = doc(db, 'orders', selectedOrder.id);
      batch.update(orderRef, {
        items: newOrderItems,
        totalSubtotal: newTotalSubtotal,
        grandTotal: newGrandTotal,
        paymentStatus: newPaymentStatus,
        updatedAt: new Date().toISOString()
      });

      // 3. Add to Shop Credits if applicable
      if (creditToAdd > 0) {
        const shopRef = doc(db, 'shops', activeShop.id);
        const shopSnap = await getDoc(shopRef);
        const currentCredits = shopSnap.exists() ? (shopSnap.data().credits || 0) : 0;
        
        batch.update(shopRef, {
          credits: currentCredits + creditToAdd
        });

        // Add credit history
        const creditRef = doc(collection(db, 'creditHistory'));
        batch.set(creditRef, {
          shopId: activeShop.id,
          amount: creditToAdd,
          type: 'return',
          description: `Return for order #${selectedOrder.id.slice(-6).toUpperCase()}`,
          createdAt: new Date().toISOString()
        });
      }

      // 4. Save Return Record
      const returnRef = doc(collection(db, 'returns'));
      batch.set(returnRef, {
        shopId: activeShop.id,
        shopName: activeShop.name,
        locationId: activeShop.locationId,
        orderId: selectedOrder.id,
        items: returnedItemsList,
        totalRefund: refundAmount,
        creditAdded: creditToAdd,
        createdAt: new Date().toISOString()
      });

      await batch.commit();

      toast.success("Return processed successfully!", { id: saveToast });
      if (creditToAdd > 0) {
        toast.success(`₹${creditToAdd} added to available credits.`);
      }

      onClose();
    } catch (error) {
      console.error("Error processing return:", error);
      toast.error("Failed to process return", { id: saveToast });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h2><RefreshCw size={20} style={{ marginRight: '8px' }} /> Add Return</h2>
          <button className="close-btn" onClick={onClose} disabled={saving}><X size={24} /></button>
        </div>
        
        <div className="modal-body">
          {!shop && (
            <div className="selection-section" style={{ display: 'flex', gap: '16px', marginBottom: '16px', backgroundColor: '#fff', padding: '16px 24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Select Location</label>
                <CustomDropdown
                  options={locations.map(loc => ({ value: loc.id, label: loc.name }))}
                  value={selectedLocationId}
                  onChange={val => setSelectedLocationId(val)}
                  placeholder="-- Choose Location --"
                  searchable
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Select Shop</label>
                <CustomDropdown
                  options={shops.map(s => ({ value: s.id, label: s.name }))}
                  value={selectedShopId}
                  onChange={val => setSelectedShopId(val)}
                  placeholder="-- Choose Shop --"
                  disabled={!selectedLocationId}
                  searchable
                />
              </div>
            </div>
          )}

          {!activeShop ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
              <RefreshCw size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
              <p>Please select a location and shop to process returns.</p>
            </div>
          ) : (
            <>
              <div className="form-group">
                <label>Select Order (Recent 15)</label>
            {loadingOrders ? (
              <div style={{ padding: '10px' }}><Loader2 className="spinner" size={16} /> Loading...</div>
            ) : (
              <CustomDropdown
                options={orders.map(o => ({
                  value: o.id,
                  label: `Order #${o.id.slice(-6).toUpperCase()} - ${new Date(o.createdAt).toLocaleDateString()} (₹${o.grandTotal}) - ${o.paymentStatus}`
                }))}
                value={selectedOrder?.id || ''}
                onChange={(val) => handleOrderSelect({ target: { value: val } })}
                placeholder="-- Select an Order --"
                searchable
              />
            )}
          </div>

          {selectedOrder && (
            <div className="return-items-section" style={{ marginTop: '20px' }}>
              <h4>Order Items</h4>
              <div className="table-responsive" style={{ marginTop: '10px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '8px' }}>Item</th>
                      <th style={{ padding: '8px' }}>Price</th>
                      <th style={{ padding: '8px' }}>Max Qty</th>
                      <th style={{ padding: '8px', width: '80px' }}>Return Qty</th>
                      <th style={{ padding: '8px' }}>Batch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map(item => (
                      <tr key={item.itemId} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '8px' }}>{item.itemName}</td>
                        <td style={{ padding: '8px' }}>₹{item.price}</td>
                        <td style={{ padding: '8px' }}>{item.quantity}</td>
                        <td style={{ padding: '8px' }}>
                          <input 
                            type="number" 
                            className="form-control" 
                            style={{ padding: '4px 8px' }}
                            value={returnItems[item.itemId]?.returnQty || ''}
                            onChange={(e) => handleQtyChange(item.itemId, e.target.value)}
                            min="0"
                            max={item.quantity}
                          />
                        </td>
                        <td style={{ padding: '8px' }}>
                          <input 
                            type="text" 
                            className="form-control" 
                            style={{ padding: '4px 8px' }}
                            value={returnItems[item.itemId]?.batchNumber || ''}
                            onChange={(e) => handleBatchChange(item.itemId, e.target.value)}
                            placeholder="Batch"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div style={{ marginTop: '16px', background: '#f1f5f9', padding: '12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600 }}>Total Refund Value:</span>
                <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary-color)' }}>₹{calculateTotalRefund()}</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                If the order was fully paid, this amount will be added to the shop's available credits. Otherwise, it will reduce the pending balance.
              </p>
            </div>
          )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button 
            className="btn-primary" 
            onClick={handleSaveReturn} 
            disabled={saving || !selectedOrder || calculateTotalRefund() <= 0}
          >
            {saving ? <Loader2 size={18} className="spinner" /> : 'Process Return'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReturnModal;
