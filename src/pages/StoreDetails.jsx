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
  Pencil,
  ArrowRight,
  History,
  RotateCcw,
  Wallet
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
  const [returnOrders, setReturnOrders] = useState([]);
  const [creditHistory, setCreditHistory] = useState([]);
  const [creditBalance, setCreditBalance] = useState(0);
  const [checkins, setCheckins] = useState([]);

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
  const [showReturnModal, setShowReturnModal] = useState(false);
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

  // Return Order Form State
  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState(null);
  const [returnCart, setReturnCart] = useState([]);

  // Bulk Payment State
  const [showBulkPaymentModal, setShowBulkPaymentModal] = useState(false);
  const [bulkPaymentAmount, setBulkPaymentAmount] = useState(0);
  const [bulkPaymentMethod, setBulkPaymentMethod] = useState('Cash');
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);

  // Print State
  const [printData, setPrintData] = useState(null);

  const tabs = [
    { id: 'info', label: 'Info' },
    { id: 'prices', label: 'Prices' },
    { id: 'sales', label: 'Sale Orders' },
    { id: 'returns', label: 'Return Orders' },
    { id: 'payments', label: 'Payments' },
    { id: 'credits', label: 'Credit' },
    { id: 'checkins', label: 'Checkins' }
  ];

  useEffect(() => { fetchStore(); }, [id]);
  useEffect(() => {
    if (activeTab === 'prices') fetchItemsAndPrices();
    if (activeTab === 'sales' || activeTab === 'returns') fetchSaleOrders();
    if (activeTab === 'payments') fetchPayments();
    if (activeTab === 'returns') fetchReturnOrders();
    if (activeTab === 'credits') fetchCreditData();
    if (activeTab === 'checkins') fetchCheckins();
  }, [activeTab]);

  const fetchStore = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, "stores", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() };
        setStore(data);
        setCreditBalance(data.creditBalance || 0);
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

  const fetchReturnOrders = async () => {
    try {
      const q = query(collection(db, `stores/${id}/returns`), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const rets = [];
      snapshot.forEach(doc => rets.push({ id: doc.id, ...doc.data() }));
      setReturnOrders(rets);
    } catch (error) {}
  };

  const fetchCreditData = async () => {
    try {
      const storeRef = doc(db, "stores", id);
      const storeSnap = await getDoc(storeRef);
      if (storeSnap.exists()) setCreditBalance(storeSnap.data().creditBalance || 0);

      const q = query(collection(db, `stores/${id}/creditHistory`), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const hist = [];
      snapshot.forEach(doc => hist.push({ id: doc.id, ...doc.data() }));
      setCreditHistory(hist);
    } catch (error) {}
  };

  const fetchCheckins = async () => {
    try {
      const q = query(collection(db, "checkins"), orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      const list = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.shopId === id) list.push({ id: doc.id, ...data });
      });
      setCheckins(list);
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
      const batch = writeBatch(db);
      
      const creditAmount = useCredit ? Math.min(creditBalance, grandTotal) : 0;
      const amountToPay = grandTotal - creditAmount;

      const orderData = {
        items: cart,
        subtotal,
        discount,
        useCredit,
        creditUsed: creditAmount,
        grandTotal,
        netPayable: amountToPay,
        paidAmount: paymentAmount > 0 ? parseFloat(paymentAmount) : 0,
        paymentStatus: paymentAmount >= amountToPay ? 'Paid' : (paymentAmount > 0 ? 'Partial' : 'Unpaid'),
        updatedAt: serverTimestamp(),
      };

      let orderRef;
      if (editingOrder) {
        orderRef = doc(db, `stores/${id}/sales`, editingOrder.id);
        batch.update(orderRef, orderData);
      } else {
        orderRef = doc(collection(db, `stores/${id}/sales`));
        batch.set(orderRef, { ...orderData, createdAt: serverTimestamp() });
        
        if (paymentAmount > 0) {
          const payRef = doc(collection(db, `stores/${id}/payments`));
          batch.set(payRef, {
            orderId: orderRef.id,
            amount: parseFloat(paymentAmount),
            method: paymentMethod,
            status: 'Confirmed', // If saved from order modal, usually it's confirmed
            createdAt: serverTimestamp(),
            items: cart,
            grandTotal: grandTotal
          });
        }

        if (useCredit && creditAmount > 0) {
          const storeRef = doc(db, "stores", id);
          batch.update(storeRef, { creditBalance: increment(-creditAmount) });
          
          const histRef = doc(collection(db, `stores/${id}/creditHistory`));
          batch.set(histRef, {
            type: 'Usage',
            amount: creditAmount,
            orderId: orderRef.id,
            description: `Used for Order #${orderRef.id.slice(0,6).toUpperCase()}`,
            createdAt: serverTimestamp()
          });
        }
      }

      await batch.commit();
      setShowSaleModal(false);
      fetchSaleOrders();
      fetchPayments();
      fetchStore();
    } catch (error) {
      alert("Error saving order: " + error.message);
    } finally { setIsSaving(false); }
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
      const batch = writeBatch(db);
      
      // Update Payment
      const payRef = doc(db, `stores/${id}/payments`, editingPayment.id);
      batch.update(payRef, {
        ...payFormData,
        amount: parseFloat(payFormData.amount),
        updatedAt: serverTimestamp()
      });

      // If status is changed to Confirmed, update order paidAmount
      if (payFormData.status === 'Confirmed' && editingPayment.orderId) {
        const orderRef = doc(db, `stores/${id}/sales`, editingPayment.orderId);
        batch.update(orderRef, {
          paidAmount: increment(parseFloat(payFormData.amount))
        });
      }

      await batch.commit();
      setShowPaymentModal(false);
      fetchPayments();
      fetchSaleOrders();
    } catch (error) {} finally { setIsSaving(false); }
  };

  const startBulkPayment = () => {
    setSelectedOrderIds([]);
    setBulkPaymentAmount(0);
    setBulkPaymentMethod('Cash');
    setShowBulkPaymentModal(true);
  };

  const handleBulkAmountChange = (val) => {
    const amount = parseFloat(val || 0);
    setBulkPaymentAmount(val);
    
    // Auto-select orders based on amount (FIFO)
    let remaining = amount;
    const toSelect = [];
    const pendingOrders = [...saleOrders]
      .filter(o => o.paymentStatus !== 'Paid')
      .sort((a, b) => a.createdAt?.toDate() - b.createdAt?.toDate());

    for (const order of pendingOrders) {
      if (remaining <= 0) break;
      const balance = (order.netPayable || order.grandTotal) - (order.paidAmount || 0);
      toSelect.push(order.id);
      remaining -= balance;
    }
    setSelectedOrderIds(toSelect);
  };

  const toggleOrderSelection = (orderId) => {
    let newSelection;
    if (selectedOrderIds.includes(orderId)) {
      newSelection = selectedOrderIds.filter(id => id !== orderId);
    } else {
      newSelection = [...selectedOrderIds, orderId];
    }
    setSelectedOrderIds(newSelection);

    // Update amount based on selection
    const newTotal = saleOrders
      .filter(o => newSelection.includes(o.id))
      .reduce((acc, curr) => acc + ((curr.netPayable || curr.grandTotal) - (curr.paidAmount || 0)), 0);
    setBulkPaymentAmount(newTotal.toString());
  };

  const handleBulkPayment = async () => {
    if (bulkPaymentAmount <= 0) return;
    try {
      setIsSaving(true);
      const batch = writeBatch(db);
      let remaining = parseFloat(bulkPaymentAmount);

      // Only process selected orders
      const pendingOrders = [...saleOrders]
        .filter(o => selectedOrderIds.includes(o.id))
        .sort((a, b) => a.createdAt?.toDate() - b.createdAt?.toDate());

      const paymentRef = doc(collection(db, `stores/${id}/payments`));
      batch.set(paymentRef, {
        amount: parseFloat(bulkPaymentAmount),
        method: bulkPaymentMethod,
        status: 'Awaiting Confirmation',
        createdAt: serverTimestamp(),
        type: 'Bulk'
      });

      for (const order of pendingOrders) {
        if (remaining <= 0) break;
        const balance = (order.netPayable || order.grandTotal) - (order.paidAmount || 0);
        if (balance <= 0) continue;

        const alloc = Math.min(remaining, balance);
        const orderRef = doc(db, `stores/${id}/sales`, order.id);
        
        const newPaidAmount = (order.paidAmount || 0) + alloc;
        const target = order.netPayable || order.grandTotal;
        const newStatus = newPaidAmount >= target ? 'Paid' : 'Partial';

        batch.update(orderRef, {
          paidAmount: increment(alloc),
          paymentStatus: newStatus
        });
        remaining -= alloc;
      }

      await batch.commit();
      setShowBulkPaymentModal(false);
      setBulkPaymentAmount(0);
      fetchPayments();
      fetchSaleOrders();
    } catch (error) {
      alert("Error: " + error.message);
    } finally { setIsSaving(false); }
  };

  // Return Logic
  const startReturn = () => {
    setSelectedOrderForReturn(null);
    setReturnCart([]);
    setShowReturnModal(true);
  };

  const selectOrderForReturn = (order) => {
    setSelectedOrderForReturn(order);
    setReturnCart(order.items.map(it => ({ ...it, returnQty: 0 })));
  };

  const updateReturnQty = (itemId, qty) => {
    const originalItem = selectedOrderForReturn.items.find(it => it.itemId === itemId);
    const maxQty = originalItem.quantity;
    const finalQty = Math.max(0, Math.min(qty, maxQty));
    setReturnCart(returnCart.map(it => it.itemId === itemId ? { ...it, returnQty: finalQty } : it));
  };

  const handleSaveReturn = async () => {
    const activeReturns = returnCart.filter(it => it.returnQty > 0);
    if (activeReturns.length === 0) return;

    try {
      setIsSaving(true);
      const batch = writeBatch(db);
      const returnTotal = activeReturns.reduce((acc, curr) => acc + (curr.price * curr.returnQty), 0);

      const returnRef = doc(collection(db, `stores/${id}/returns`));
      batch.set(returnRef, {
        orderId: selectedOrderForReturn.id,
        items: activeReturns,
        totalAmount: returnTotal,
        createdAt: serverTimestamp()
      });

      // Update original order items and totals
      const updatedItems = selectedOrderForReturn.items.map(it => {
        const ret = activeReturns.find(r => r.itemId === it.itemId);
        if (ret) {
           return { ...it, quantity: it.quantity - ret.returnQty };
        }
        return it;
      }).filter(it => it.quantity > 0);

      const orderRef = doc(db, `stores/${id}/sales`, selectedOrderForReturn.id);
      batch.update(orderRef, {
        items: updatedItems,
        returnedValue: increment(returnTotal),
        grandTotal: increment(-returnTotal),
        netPayable: increment(-returnTotal)
      });

      // Add to credit only if order was fully paid
      if (selectedOrderForReturn.paymentStatus === 'Paid') {
        const storeRef = doc(db, "stores", id);
        batch.update(storeRef, { creditBalance: increment(returnTotal) });

        const histRef = doc(collection(db, `stores/${id}/creditHistory`));
        batch.set(histRef, {
          type: 'Credit',
          amount: returnTotal,
          returnId: returnRef.id,
          description: `Credit from Return #${returnRef.id.slice(0,6).toUpperCase()}`,
          createdAt: serverTimestamp()
        });
      }

      await batch.commit();
      setShowReturnModal(false);
      fetchReturnOrders();
      fetchSaleOrders();
      fetchCreditData();
    } catch (error) {
      alert("Error saving return: " + error.message);
    } finally { setIsSaving(false); }
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
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Date</th>
                          <th>Items</th>
                          <th>Subtotal</th>
                          <th>Discount</th>
                          <th>Credit</th>
                          <th>Returns</th>
                          <th>Total</th>
                          <th>Payable</th>
                          <th>Paid</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {saleOrders.map(order => (
                          <tr key={order.id}>
                            <td><span className="order-id-cell">#{order.id.slice(0,6).toUpperCase()}</span></td>
                            <td>{order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : '...'}</td>
                            <td>{order.items.length} Items</td>
                            <td>₹{order.subtotal || 0}</td>
                            <td>₹{order.discount || 0}</td>
                            <td>₹{order.creditUsed || 0}</td>
                            <td>₹{order.returnedValue || 0}</td>
                            <td>₹{order.grandTotal}</td>
                            <td>₹{order.netPayable || order.grandTotal}</td>
                            <td>₹{order.paidAmount || 0}</td>
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
             <div className="tab-header">
                <h3>Payment Transactions</h3>
                <button className="btn-primary" onClick={startBulkPayment}><Plus size={18} /> Add Payment</button>
             </div>
             <div className="payments-list">
                {payments.length === 0 ? <p className="no-data">No payments recorded.</p> : (
                   <div className="data-table-wrapper">
                      <table className="data-table">
                        <thead><tr><th>Ref</th><th>Date</th><th>Amount</th><th>Method</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                          {payments.map(pm => (
                            <tr key={pm.id}>
                              <td><span className="order-id-cell">#{pm.id.slice(0,6).toUpperCase()}</span></td>
                              <td>{pm.createdAt?.toDate ? pm.createdAt.toDate().toLocaleDateString() : '...'}</td>
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
          <div className="returns-tab-container">
            <div className="tab-header">
              <h3>Return Orders</h3>
              <button className="btn-primary" onClick={startReturn}><RotateCcw size={18} /> New Return Order</button>
            </div>
            <div className="returns-list">
               {returnOrders.length === 0 ? <p className="no-data">No returns recorded yet.</p> : (
                 <div className="data-table-wrapper">
                    <table className="data-table">
                      <thead><tr><th>Return ID</th><th>Sale Ref</th><th>Date</th><th>Items</th><th>Value</th><th>Actions</th></tr></thead>
                      <tbody>
                        {returnOrders.map(ret => (
                          <tr key={ret.id}>
                            <td><span className="order-id-cell">#{ret.id.slice(0,6).toUpperCase()}</span></td>
                            <td><span className="order-id-cell">#{ret.orderId.slice(0,6).toUpperCase()}</span></td>
                            <td>{ret.createdAt?.toDate().toLocaleDateString()}</td>
                            <td>{ret.items.length} Items</td>
                            <td>₹{ret.totalAmount}</td>
                            <td>
                              <div className="table-actions">
                                <button className="btn-icon" onClick={() => handlePrint(ret)} title="Print Return Slip"><Printer size={16}/></button>
                                <button className="btn-icon delete" onClick={() => { if(window.confirm('Delete this return?')) deleteDoc(doc(db, `stores/${id}/returns`, ret.id)).then(fetchReturnOrders); }}><Trash2 size={16}/></button>
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

        {activeTab === 'credits' && (
          <div className="credits-tab-container">
            <div className="credit-summary-card">
              <div className="balance-info">
                <Wallet size={32} />
                <div>
                  <p className="label">Available Credit Balance</p>
                  <h2 className="balance-amount">₹{creditBalance}</h2>
                </div>
              </div>
            </div>

            <div className="history-section">
              <div className="tab-header"><h3>Credit History</h3></div>
              <div className="history-list">
                {creditHistory.length === 0 ? <p className="no-data">No credit history found.</p> : (
                  <div className="data-table-wrapper">
                    <table className="data-table">
                      <thead><tr><th>Date</th><th>Type</th><th>Description</th><th>Amount</th></tr></thead>
                      <tbody>
                        {creditHistory.map(hist => (
                          <tr key={hist.id}>
                            <td>{hist.createdAt?.toDate ? hist.createdAt.toDate().toLocaleDateString() : '...'}</td>
                            <td><span className={`status-tag ${hist.type === 'Credit' ? 'paid' : 'unpaid'}`}>{hist.type}</span></td>
                            <td>{hist.description}</td>
                            <td className={hist.type === 'Credit' ? 'text-success' : 'text-danger'}>
                              {hist.type === 'Credit' ? '+' : '-'}₹{hist.amount}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'checkins' && (
           <div className="checkins-tab-container">
             <div className="tab-header"><h3>Store Check-in History</h3></div>
             <div className="checkins-list">
                {checkins.length === 0 ? <p className="no-data">No check-ins recorded for this store.</p> : (
                  <div className="data-table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Date & Time</th>
                          <th>Employee</th>
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
                                <p className="ci-date">{ci.date}</p>
                                <p className="ci-time" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{ci.time}</p>
                              </div>
                            </td>
                            <td>
                              <div className="ci-emp">
                                <p className="emp-name" style={{ fontWeight: '600' }}>{ci.employeeName}</p>
                                <p className="emp-user" style={{ fontSize: '12px', color: 'var(--primary-color)' }}>@{ci.username}</p>
                              </div>
                            </td>
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
           </div>
         )}
      </div>

      {/* RETURN ORDER MODAL */}
      {showReturnModal && (
        <div className="modal-overlay">
          <div className="modal-container return-modal">
            <div className="modal-header">
              <h3>New Return Order</h3>
              <button className="btn-close" onClick={() => setShowReturnModal(false)}><X size={24}/></button>
            </div>
            
            {!selectedOrderForReturn ? (
              <div className="order-picker-section p-24">
                <h4>Select Sale Order to Return Items From</h4>
                <div className="orders-list-picker mt-16">
                  {saleOrders.map(order => (
                    <div key={order.id} className="order-pick-card" onClick={() => selectOrderForReturn(order)}>
                      <div>
                        <p className="o-id">Order #{order.id.slice(0,6).toUpperCase()}</p>
                        <p className="o-date">{order.createdAt?.toDate().toLocaleDateString()}</p>
                      </div>
                      <div className="o-total">₹{order.grandTotal} <ChevronRight size={18}/></div>
                    </div>
                  ))}
                  {saleOrders.length === 0 && <p className="no-data">No sale orders found.</p>}
                </div>
              </div>
            ) : (
              <div className="return-items-section p-24">
                <div className="selected-order-header">
                  <button className="btn-back-mini" onClick={() => setSelectedOrderForReturn(null)}><ArrowLeft size={16}/> Change Order</button>
                  <h4>Order #{selectedOrderForReturn.id.slice(0,6).toUpperCase()}</h4>
                </div>
                
                <div className="return-items-list mt-20">
                  {returnCart.map(it => (
                    <div key={it.itemId} className="return-item-row">
                      <div className="it-info">
                        <p className="it-name">{it.name}</p>
                        <p className="it-price">₹{it.price} (Qty: {it.quantity})</p>
                      </div>
                      <div className="it-actions">
                        <div className="card-qty-selector">
                          <button onClick={() => updateReturnQty(it.itemId, it.returnQty - 1)}>-</button>
                          <span>{it.returnQty}</span>
                          <button onClick={() => updateReturnQty(it.itemId, it.returnQty + 1)}>+</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="return-footer mt-24">
                  <div className="return-summary">
                    <p>Total Return Value: <strong>₹{returnCart.reduce((acc, curr) => acc + (curr.price * curr.returnQty), 0)}</strong></p>
                  </div>
                  <button className="btn-primary w-100 mt-16" onClick={handleSaveReturn} disabled={isSaving || returnCart.reduce((acc, curr) => acc + curr.returnQty, 0) === 0}>
                    {isSaving ? <Loader2 className="animate-spin"/> : 'Complete Return & Add Credit'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
                      {items.map(item => {
                        const cartItem = cart.find(c => c.itemId === item.id);
                        const qty = cartItem ? cartItem.quantity : 0;
                        return (
                          <div key={item.id} className={`item-select-card ${qty > 0 ? 'selected' : ''}`} onClick={() => qty === 0 && addToCart(item)}>
                             <div className="item-card-main">
                                <div className="item-icon-wrapper"><Package size={20}/></div>
                                <div className="item-card-info">
                                   <p className="name">{item.name}</p>
                                   <p className="price">₹{storePrices[item.id]?.price || 0}</p>
                                </div>
                             </div>
                             <div className="item-card-actions" onClick={(e) => e.stopPropagation()}>
                                {qty > 0 ? (
                                  <div className="card-qty-selector">
                                     <button onClick={() => updateQty(item.id, qty - 1)}>-</button>
                                     <span>{qty}</span>
                                     <button onClick={() => updateQty(item.id, qty + 1)}>+</button>
                                  </div>
                                ) : (
                                  <button className="card-add-btn" onClick={() => addToCart(item)}><Plus size={16}/></button>
                                )}
                             </div>
                          </div>
                        );
                      })}
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
                      <div className="summary-row"><span>Use Credit (Avail: ₹{creditBalance})</span><label className="toggle-switch"><input type="checkbox" checked={useCredit} onChange={(e) => setUseCredit(e.target.checked)}/><span className="slider"></span></label></div>
                      
                      {editingOrder && (
                        <div className="edit-info-rows">
                           {editingOrder.returnedValue > 0 && <div className="summary-row text-danger"><span>Returned Value</span><span>-₹{editingOrder.returnedValue}</span></div>}
                           <div className="summary-row"><span>Net Payable</span><span>₹{editingOrder.netPayable || grandTotal}</span></div>
                           <div className="summary-row text-success"><span>Paid Amount</span><span>₹{editingOrder.paidAmount || 0}</span></div>
                        </div>
                      )}

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

      {/* BULK PAYMENT MODAL */}
      {showBulkPaymentModal && (
        <div className="modal-overlay">
          <div className="modal-container p-edit">
            <div className="modal-header">
              <h3>Add Payment</h3>
              <button className="btn-close" onClick={() => setShowBulkPaymentModal(false)}><X size={20}/></button>
            </div>
            <div className="modal-form p-24">
              <div className="pending-stats-bar mb-20">
                <div className="stat-item">
                  <span className="s-label">Total Pending Amount</span>
                  <span className="s-value text-danger">₹{saleOrders.reduce((acc, o) => acc + ((o.netPayable || o.grandTotal) - (o.paidAmount || 0)), 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="form-group">
                <label>Received Amount (₹)</label>
                <input 
                  type="number" 
                  placeholder="0.00" 
                  value={bulkPaymentAmount} 
                  onChange={(e) => handleBulkAmountChange(e.target.value)}
                  className="input-lg"
                />
              </div>
              <div className="form-group">
                <label>Payment Method</label>
                <select value={bulkPaymentMethod} onChange={(e) => setBulkPaymentMethod(e.target.value)}>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>

              <div className="allocation-preview mt-20">
                <p className="section-subtitle">Select Orders to Pay (FIFO)</p>
                <div className="orders-to-pay-list mt-10">
                  {saleOrders.filter(o => o.paymentStatus !== 'Paid')
                    .sort((a, b) => a.createdAt?.toDate() - b.createdAt?.toDate())
                    .map((order, idx) => {
                      const balance = (order.netPayable || order.grandTotal) - (order.paidAmount || 0);
                      const isSelected = selectedOrderIds.includes(order.id);
                      
                      // Calculate allocation for visual preview
                      let currentAlloc = 0;
                      if (isSelected) {
                        const totalAllocatedSoFar = saleOrders
                          .filter(o => selectedOrderIds.includes(o.id))
                          .sort((a, b) => a.createdAt?.toDate() - b.createdAt?.toDate())
                          .slice(0, saleOrders.filter(o => selectedOrderIds.includes(o.id)).sort((a, b) => a.createdAt?.toDate() - b.createdAt?.toDate()).findIndex(o => o.id === order.id))
                          .reduce((acc, curr) => acc + Math.min(Math.max(0, parseFloat(bulkPaymentAmount) - acc), (curr.netPayable || curr.grandTotal) - (curr.paidAmount || 0)), 0);
                        
                        currentAlloc = Math.min(Math.max(0, parseFloat(bulkPaymentAmount) - totalAllocatedSoFar), balance);
                      }

                      return (
                        <div key={order.id} className={`alloc-row ${isSelected ? 'active' : ''}`} onClick={() => toggleOrderSelection(order.id)}>
                          <div className="o-check">
                            <div className={`checkbox-mini ${isSelected ? 'checked' : ''}`}>
                               {isSelected && <CheckCircle2 size={12}/>}
                            </div>
                          </div>
                          <div className="o-meta">
                            <span className="o-id">#{order.id.slice(0,6).toUpperCase()}</span>
                            <span className="o-bal">Bal: ₹{balance}</span>
                          </div>
                          <div className="o-alloc">
                            {currentAlloc > 0 && <span className="alloc-tag">+₹{currentAlloc}</span>}
                            {currentAlloc >= balance && isSelected && <CheckCircle2 size={16} className="text-success"/>}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              <div className="modal-footer mt-24">
                <button 
                  className="btn-primary w-100" 
                  onClick={handleBulkPayment} 
                  disabled={isSaving || bulkPaymentAmount <= 0 || selectedOrderIds.length === 0}
                >
                  {isSaving ? <Loader2 className="animate-spin"/> : 'Save Payment & Update Orders'}
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
