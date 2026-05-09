import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  increment, 
  collection, 
  getDocs, 
  setDoc, 
  deleteDoc,
  writeBatch,
  addDoc,
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { 
  ArrowLeft, 
  Store, 
  Phone, 
  MapPin, 
  Navigation, 
  Calendar, 
  Loader2, 
  Edit3, 
  Save, 
  X,
  Search,
  ChevronDown,
  Trash2,
  Package,
  IndianRupee,
  CheckCircle2,
  Plus,
  ShoppingCart,
  Receipt,
  Printer,
  CreditCard,
  Banknote,
  Smartphone,
  ChevronRight,
  Pencil
} from 'lucide-react';
import { useLocation } from '../LocationContext';
import '../css/Stores.css';

const StoreDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { locations, fetchLocations: refreshContext } = useLocation();
  const printRef = useRef();
  
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  
  // Data State
  const [items, setItems] = useState([]);
  const [storePrices, setStorePrices] = useState({});
  const [saleOrders, setSaleOrders] = useState([]);
  const [payments, setPayments] = useState([]);

  // Info Tab Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({ name: '', mobile: '', address: '', lat: '', lng: '' });
  const [selectedLoc, setSelectedLoc] = useState(null);
  const [isLocDropdownOpen, setIsLocDropdownOpen] = useState(false);
  const [locSearchQuery, setLocSearchQuery] = useState('');
  const [pricesLoading, setPricesLoading] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);

  // Modal States
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Editing State
  const [editingOrder, setEditingOrder] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);
  
  // Sale Order Form State
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [useCredit, setUseCredit] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  // Payment Edit Form State
  const [payFormData, setPayFormData] = useState({ amount: 0, method: 'Cash', status: 'Awaiting Confirmation' });

  // Print State
  const [printData, setPrintData] = useState(null);

  const tabs = [
    { id: 'info', label: 'Info' },
    { id: 'prices', label: 'Prices' },
    { id: 'sales', label: 'Sale Orders' },
    { id: 'returns', label: 'Return Orders' },
    { id: 'payments', label: 'Payments' },
    { id: 'checkins', label: 'Checkins' }
  ];

  useEffect(() => { fetchStore(); }, [id]);
  useEffect(() => {
    if (activeTab === 'prices') fetchItemsAndPrices();
    if (activeTab === 'sales') fetchSaleOrders();
    if (activeTab === 'payments') fetchPayments();
  }, [activeTab]);

  const fetchStore = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, "stores", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() };
        setStore(data);
        setFormData({ name: data.name, mobile: data.mobile, address: data.address, lat: data.lat, lng: data.lng });
        setSelectedLoc({ id: data.locationId, name: data.locationName });
      }
    } catch (error) {} finally { setLoading(false); }
  };

  const fetchItemsAndPrices = async () => {
    try {
      setPricesLoading(true);
      const itemsSnapshot = await getDocs(collection(db, "items"));
      const itemList = [];
      itemsSnapshot.forEach(doc => itemList.push({ id: doc.id, ...doc.data() }));
      setItems(itemList);
      const pricesSnapshot = await getDocs(collection(db, `stores/${id}/prices`));
      const pricesMap = {};
      pricesSnapshot.forEach(doc => pricesMap[doc.id] = { price: doc.data().price.toString(), isSaved: true });
      const initialPrices = {};
      itemList.forEach(item => initialPrices[item.id] = pricesMap[item.id] || { price: '0', isSaved: false });
      setStorePrices(initialPrices);
    } catch (error) {} finally { setPricesLoading(false); }
  };

  const fetchSaleOrders = async () => {
    try {
      const q = query(collection(db, `stores/${id}/sales`), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const orders = [];
      snapshot.forEach(doc => orders.push({ id: doc.id, ...doc.data() }));
      setSaleOrders(orders);
    } catch (error) {}
  };

  const fetchPayments = async () => {
    try {
      const q = query(collection(db, `stores/${id}/payments`), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const pms = [];
      snapshot.forEach(doc => pms.push({ id: doc.id, ...doc.data() }));
      setPayments(pms);
    } catch (error) {}
  };

  // Sale Order Logic
  const startAddOrder = () => {
    setEditingOrder(null);
    setCart([]);
    setDiscount(0);
    setPaymentAmount(0);
    setPaymentMethod('Cash');
    setUseCredit(false);
    fetchItemsAndPrices();
    setShowSaleModal(true);
  };

  const startEditOrder = (order) => {
    setEditingOrder(order);
    setCart(order.items);
    setDiscount(order.discount || 0);
    setUseCredit(order.useCredit || false);
    // Note: Payment amount editing for an order is usually handled in the payments tab, 
    // but we'll reset it here to 0 to allow adding extra payment if needed, 
    // or we can just hide the payment section in edit mode.
    setPaymentAmount(0); 
    fetchItemsAndPrices();
    setShowSaleModal(true);
  };

  const addToCart = (item) => {
    const price = parseFloat(storePrices[item.id]?.price || 0);
    if (price <= 0) return alert("Set price first.");
    const existing = cart.find(c => c.itemId === item.id);
    if (existing) setCart(cart.map(c => c.itemId === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    else setCart([...cart, { itemId: item.id, name: item.name, price, quantity: 1 }]);
  };

  const removeFromCart = (itemId) => setCart(cart.filter(c => c.itemId !== itemId));
  const updateQty = (itemId, qty) => {
    if (qty <= 0) return removeFromCart(itemId);
    setCart(cart.map(c => c.itemId === itemId ? { ...c, quantity: qty } : c));
  };

  const subtotal = cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
  const grandTotal = Math.max(0, subtotal - discount);

  const handleSaveOrder = async () => {
    if (cart.length === 0) return;
    try {
      setIsSaving(true);
      const orderData = {
        items: cart,
        subtotal,
        discount,
        useCredit,
        grandTotal,
        paymentStatus: paymentAmount >= grandTotal ? 'Paid' : (paymentAmount > 0 ? 'Partial' : 'Unpaid'),
        updatedAt: serverTimestamp(),
      };

      if (editingOrder) {
        await updateDoc(doc(db, `stores/${id}/sales`, editingOrder.id), orderData);
      } else {
        const orderRef = await addDoc(collection(db, `stores/${id}/sales`), { ...orderData, createdAt: serverTimestamp() });
        if (paymentAmount > 0) {
          await addDoc(collection(db, `stores/${id}/payments`), {
            orderId: orderRef.id,
            amount: parseFloat(paymentAmount),
            method: paymentMethod,
            status: 'Awaiting Confirmation',
            createdAt: serverTimestamp(),
            items: cart,
            grandTotal: grandTotal
          });
        }
      }

      setShowSaleModal(false);
      fetchSaleOrders();
      fetchPayments();
    } catch (error) {} finally { setIsSaving(false); }
  };

  // Payment Logic
  const startEditPayment = (pm) => {
    setEditingPayment(pm);
    setPayFormData({ amount: pm.amount, method: pm.method, status: pm.status });
    setShowPaymentModal(true);
  };

  const handleSavePayment = async () => {
    try {
      setIsSaving(true);
      await updateDoc(doc(db, `stores/${id}/payments`, editingPayment.id), {
        ...payFormData,
        amount: parseFloat(payFormData.amount),
        updatedAt: serverTimestamp()
      });
      setShowPaymentModal(false);
      fetchPayments();
    } catch (error) {} finally { setIsSaving(false); }
  };

  const handlePrint = (data) => { setPrintData(data); setTimeout(() => window.print(), 500); };

  if (loading) return <div className="page-wrapper"><div className="loading-state"><Loader2 size={40} className="animate-spin" /></div></div>;

  return (
    <div className="page-wrapper">
      <div className="page-header details-header">
        <div className="header-left-group">
          <button className="btn-back" onClick={() => navigate('/stores')}><ArrowLeft size={20} /></button>
          <div><h2 className="page-title">{store.name}</h2><p className="breadcrumb">Stores / {store.name}</p></div>
        </div>
        <div className={`status-badge-lg ${store.status.toLowerCase()}`}>{store.status}</div>
      </div>

      <div className="tabs-navigation">
        {tabs.map(tab => (
          <button key={tab.id} className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>
        ))}
      </div>

      <div className="tab-content">
        {activeTab === 'sales' && (
          <div className="sales-tab-container">
            <div className="tab-header"><h3>Sale Orders</h3><button className="btn-primary" onClick={startAddOrder}><Plus size={18} /> New Sale Order</button></div>
            <div className="orders-list">
               {saleOrders.length === 0 ? <p className="no-data">No sale orders yet.</p> : (
                 <div className="data-table-wrapper">
                    <table className="data-table">
                      <thead><tr><th>Order ID</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead>
                      <tbody>
                        {saleOrders.map(order => (
                          <tr key={order.id}>
                            <td><span className="order-id-cell">#{order.id.slice(0,6).toUpperCase()}</span></td>
                            <td>{order.createdAt?.toDate().toLocaleDateString()}</td>
                            <td>{order.items.length} Items</td>
                            <td>₹{order.grandTotal}</td>
                            <td><span className={`status-tag ${order.paymentStatus.toLowerCase()}`}>{order.paymentStatus}</span></td>
                            <td>
                              <div className="table-actions">
                                <button className="btn-icon" onClick={() => startEditOrder(order)} title="Edit Order"><Pencil size={16}/></button>
                                <button className="btn-icon" onClick={() => handlePrint(order)} title="Print Bill"><Printer size={16}/></button>
                                <button className="btn-icon delete" onClick={() => { if(window.confirm('Delete this order?')) deleteDoc(doc(db, `stores/${id}/sales`, order.id)).then(fetchSaleOrders); }} title="Delete Order"><Trash2 size={16}/></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                 </div>
               )}
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="payments-tab-container">
             <div className="tab-header"><h3>Payment Transactions</h3></div>
             <div className="payments-list">
                {payments.length === 0 ? <p className="no-data">No payments recorded.</p> : (
                   <div className="data-table-wrapper">
                      <table className="data-table">
                        <thead><tr><th>Ref</th><th>Date</th><th>Amount</th><th>Method</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                          {payments.map(pm => (
                            <tr key={pm.id}>
                              <td><span className="order-id-cell">#{pm.id.slice(0,6).toUpperCase()}</span></td>
                              <td>{pm.createdAt?.toDate().toLocaleDateString()}</td>
                              <td>₹{pm.amount}</td>
                              <td><span className="method-tag">{pm.method === 'Cash' ? <Banknote size={16}/> : <Smartphone size={16}/>} {pm.method}</span></td>
                              <td><span className="status-badge awaiting">{pm.status}</span></td>
                              <td>
                                <div className="table-actions">
                                  <button className="btn-icon" onClick={() => startEditPayment(pm)} title="Edit Payment"><Pencil size={16}/></button>
                                  <button className="btn-icon" onClick={() => handlePrint(pm)} title="Print Receipt"><Printer size={16}/></button>
                                  <button className="btn-icon delete" onClick={() => { if(window.confirm('Delete this payment?')) deleteDoc(doc(db, `stores/${id}/payments`, pm.id)).then(fetchPayments); }} title="Delete Payment"><Trash2 size={16}/></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                   </div>
                )}
             </div>
          </div>
        )}


        {activeTab === 'info' && (
          <div className="info-tab-container">
            <div className="info-header">
              <h3>Store Information</h3>
              <button 
                className={`btn-edit-toggle ${isEditing ? 'active' : ''}`}
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? <><X size={16}/> Cancel</> : <><Edit3 size={16}/> Edit Details</>}
              </button>
            </div>

            {isEditing ? (
              <div className="edit-details-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Store Name</label>
                    <input 
                      type="text" 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Mobile Number</label>
                    <input 
                      type="text" 
                      value={formData.mobile} 
                      onChange={(e) => setFormData({...formData, mobile: e.target.value})} 
                    />
                  </div>
                  <div className="form-group full">
                    <label>Address</label>
                    <textarea 
                      value={formData.address} 
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Latitude</label>
                    <input 
                      type="text" 
                      value={formData.lat} 
                      onChange={(e) => setFormData({...formData, lat: e.target.value})} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Longitude</label>
                    <input 
                      type="text" 
                      value={formData.lng} 
                      onChange={(e) => setFormData({...formData, lng: e.target.value})} 
                    />
                  </div>
                </div>
                <div className="form-footer">
                  <button 
                    className="btn-save-details" 
                    onClick={async () => {
                      try {
                        setIsUpdating(true);
                        await updateDoc(doc(db, "stores", id), formData);
                        setStore({...store, ...formData});
                        setIsEditing(false);
                      } catch (error) {
                        alert("Failed to update store details");
                      } finally {
                        setIsUpdating(false);
                      }
                    }}
                    disabled={isUpdating}
                  >
                    {isUpdating ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>}
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="info-card-modern">
                <div className="info-item-box">
                  <Store size={24}/>
                  <div className="item-text">
                    <span className="label">Store Name</span>
                    <span className="value">{store.name}</span>
                  </div>
                </div>
                <div className="info-item-box">
                  <Phone size={24}/>
                  <div className="item-text">
                    <span className="label">Mobile</span>
                    <span className="value">{store.mobile}</span>
                  </div>
                </div>
                <div className="info-item-box">
                  <MapPin size={24}/>
                  <div className="item-text">
                    <span className="label">Address</span>
                    <span className="value">{store.address}</span>
                  </div>
                </div>
                <div className="info-item-box">
                  <Navigation size={24}/>
                  <div className="item-text">
                    <span className="label">Location</span>
                    <span className="value">{store.locationName || 'N/A'}</span>
                  </div>
                </div>
                <div className="info-item-box">
                  <Calendar size={24}/>
                  <div className="item-text">
                    <span className="label">Joined Date</span>
                    <span className="value">{store.createdAt?.toDate().toLocaleDateString() || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'prices' && (
          <div className="prices-tab-container">
            <div className="prices-header">
              <div className="header-text">
                <h3>Store Pricing</h3>
                <p>Manage custom prices for this store. If not set, global prices apply.</p>
              </div>
              <button 
                className="btn-primary"
                onClick={async () => {
                  try {
                    setBulkSaving(true);
                    const batch = writeBatch(db);
                    Object.keys(storePrices).forEach(itemId => {
                      const priceDoc = doc(db, `stores/${id}/prices`, itemId);
                      batch.set(priceDoc, { price: parseFloat(storePrices[itemId].price) });
                    });
                    await batch.commit();
                    alert("Prices updated successfully!");
                    fetchItemsAndPrices();
                  } catch (error) {
                    alert("Failed to save prices");
                  } finally {
                    setBulkSaving(false);
                  }
                }}
                disabled={bulkSaving}
              >
                {bulkSaving ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>}
                Save All Prices
              </button>
            </div>

            {pricesLoading ? (
              <div className="loading-state"><Loader2 size={30} className="animate-spin"/></div>
            ) : (
              <div className="prices-table-wrapper">
                <table className="prices-table">
                  <thead>
                    <tr>
                      <th>Item Name</th>
                      <th>Category</th>
                      <th>Global Price</th>
                      <th>Store Price (₹)</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.id}>
                        <td>
                          <div className="item-name-cell">
                            <Package size={18}/>
                            <span>{item.name}</span>
                          </div>
                        </td>
                        <td>{item.category}</td>
                        <td>₹{item.price}</td>
                        <td>
                          <input 
                            type="number" 
                            className="price-input"
                            value={storePrices[item.id]?.price || ''} 
                            onChange={(e) => setStorePrices({
                              ...storePrices,
                              [item.id]: { ...storePrices[item.id], price: e.target.value, isSaved: false }
                            })}
                          />
                        </td>
                        <td>
                          {storePrices[item.id]?.isSaved ? (
                            <span className="status-badge confirmed">Saved</span>
                          ) : (
                            <span className="status-badge awaiting">Unsaved</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'returns' && (
          <div className="placeholder-tab">
            <div className="no-data">
              <Package size={48}/>
              <p>Return Orders module is coming soon.</p>
            </div>
          </div>
        )}

        {activeTab === 'checkins' && (
          <div className="placeholder-tab">
            <div className="no-data">
              <MapPin size={48}/>
              <p>Store Check-ins module is coming soon.</p>
            </div>
          </div>
        )}
      </div>

      {/* SALE ORDER MODAL */}
      {showSaleModal && (
        <div className="modal-overlay">
          <div className="sale-modal-container">
             <div className="sale-modal-header">
                <h2>{editingOrder ? 'Edit Sale Order' : 'New Sale Order'}</h2>
                <button className="btn-close" onClick={() => setShowSaleModal(false)}><X size={24}/></button>
             </div>
             <div className="sale-modal-body">
                <div className="items-selector">
                   <div className="search-box"><Search size={18}/><input type="text" placeholder="Search items..."/></div>
                   <div className="items-list-scroll">
                      {items.map(item => (
                        <div key={item.id} className="item-select-card" onClick={() => addToCart(item)}>
                           <div className="item-info"><Package size={20}/><div><p className="name">{item.name}</p><p className="price">₹{storePrices[item.id]?.price || 0}</p></div></div>
                           <Plus size={18}/>
                        </div>
                      ))}
                   </div>
                </div>
                <div className="order-summary-panel">
                   <div className="cart-section">
                      <h4>Order Items</h4>
                      <div className="cart-items">
                         {cart.map(c => (
                           <div key={c.itemId} className="cart-item">
                              <div className="c-info"><p className="c-name">{c.name}</p><p className="c-price">₹{c.price} x {c.quantity}</p></div>
                              <div className="c-actions"><button onClick={() => updateQty(c.itemId, c.quantity - 1)}>-</button><span>{c.quantity}</span><button onClick={() => updateQty(c.itemId, c.quantity + 1)}>+</button><button className="del" onClick={() => removeFromCart(c.itemId)}><Trash2 size={14}/></button></div>
                           </div>
                         ))}
                      </div>
                   </div>
                   <div className="summary-section">
                      <div className="summary-row"><span>Subtotal</span><span>₹{subtotal}</span></div>
                      <div className="summary-row"><span>Discount</span><input type="number" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value || 0))} /></div>
                      <div className="summary-row"><span>Use Credit</span><label className="toggle-switch"><input type="checkbox" checked={useCredit} onChange={(e) => setUseCredit(e.target.checked)}/><span className="slider"></span></label></div>
                      <div className="summary-row grand-total"><span>Grand Total</span><span>₹{grandTotal}</span></div>
                   </div>
                   {!editingOrder && (
                     <div className="payment-section">
                        <h4>Payment Received</h4>
                        <div className="payment-inputs">
                           <input type="number" placeholder="Amount" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)}/>
                           <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}><option value="Cash">Cash</option><option value="UPI">UPI</option></select>
                        </div>
                     </div>
                   )}
                   <button className="btn-place-order" onClick={handleSaveOrder} disabled={isSaving || cart.length === 0}>
                      {isSaving ? <Loader2 className="animate-spin"/> : <CheckCircle2/>}
                      {editingOrder ? 'Update Order' : 'Place Order & Save Payment'}
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* PAYMENT EDIT MODAL */}
      {showPaymentModal && (
        <div className="modal-overlay">
          <div className="modal-container p-edit">
             <div className="modal-header"><h3>Edit Payment</h3><button className="btn-close" onClick={() => setShowPaymentModal(false)}><X size={20}/></button></div>
             <div className="modal-form p-20">
                <div className="form-group"><label>Amount (₹)</label><input type="number" value={payFormData.amount} onChange={(e) => setPayFormData({...payFormData, amount: e.target.value})}/></div>
                <div className="form-group"><label>Method</label><select value={payFormData.method} onChange={(e) => setPayFormData({...payFormData, method: e.target.value})}><option value="Cash">Cash</option><option value="UPI">UPI</option></select></div>
                <div className="form-group"><label>Status</label><select value={payFormData.status} onChange={(e) => setPayFormData({...payFormData, status: e.target.value})}><option value="Awaiting Confirmation">Awaiting Confirmation</option><option value="Confirmed">Confirmed</option><option value="Failed">Failed</option></select></div>
                <div className="modal-footer"><button className="btn-primary w-100" onClick={handleSavePayment} disabled={isSaving}>{isSaving ? <Loader2 className="animate-spin"/> : 'Update Payment'}</button></div>
             </div>
          </div>
        </div>
      )}

      {/* PRINT DATA... */}
      {printData && (
        <div className="printable-bill" style={{ display: 'none' }}>
           <div className="bill-content">
              <h2 style={{ textAlign: 'center' }}>RJR FRESH</h2><p style={{ textAlign: 'center' }}>{store.name}</p><hr/><p>Ref: {printData.id?.slice(0,8).toUpperCase()}</p><p>Date: {new Date().toLocaleDateString()}</p><hr/>
              <table style={{ width: '100%' }}><thead><tr><th align="left">Item</th><th align="right">Qty</th><th align="right">Price</th></tr></thead>
                 <tbody>{printData.items?.map(it => (<tr key={it.itemId}><td align="left">{it.name}</td><td align="right">{it.quantity}</td><td align="right">₹{it.price * it.quantity}</td></tr>))}</tbody>
              </table><hr/><p align="right">Total: ₹{printData.grandTotal || printData.amount}</p><hr/><p style={{ textAlign: 'center' }}>Thank You!</p>
           </div>
        </div>
      )}
    </div>
  );
};

export default StoreDetails;
