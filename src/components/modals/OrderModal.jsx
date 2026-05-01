import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Loader2,
  IndianRupee,
  ShoppingCart,
  Tag,
  Hash,
  Layers,
  Save,
  UserCheck,
  CreditCard
} from 'lucide-react';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../../firebase';
import toast from 'react-hot-toast';
import '../../css/components/order-modal.css';
import CustomDropdown from '../CustomDropdown';

const OrderModal = ({ isOpen, onClose, shop, customer, categories, orderToEdit, isViewOnly }) => {
  const [items, setItems] = useState([{
    id: Date.now(),
    categoryId: '',
    itemId: '',
    quantity: 1,
    batchNumber: '',
    price: 0,
    subtotal: 0
  }]);
  const [allInventoryItems, setAllInventoryItems] = useState([]);
  const [priceMap, setPriceMap] = useState({}); // { itemId: price }
  const [discount, setDiscount] = useState(0);
  const [returnAmount, setReturnAmount] = useState(0);
  const [paymentReceived, setPaymentReceived] = useState(0);
  const [useCredits, setUseCredits] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [employees, setEmployees] = useState([]);
  
  const [orderStatus, setOrderStatus] = useState('Ordered');
  const [paymentStatus, setPaymentStatus] = useState('Unpaid');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [assignedTo, setAssignedTo] = useState('');

  const [locations, setLocations] = useState([]);
  const [shops, setShops] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [selectedShopId, setSelectedShopId] = useState('');
  const [globalShop, setGlobalShop] = useState(null);
  
  const [batches, setBatches] = useState([]);

  const entity = shop || customer || globalShop;

  useEffect(() => {
    if (isOpen) {
      const fetchBatches = async () => {
        try {
          const q = query(collection(db, 'batches'), orderBy('createdAt', 'desc'), limit(10));
          const snap = await getDocs(q);
          setBatches(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
          console.error("Error fetching batches:", error);
        }
      };
      fetchBatches();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !shop && !customer && !orderToEdit) {
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
  }, [isOpen, shop, customer, orderToEdit]);

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

  useEffect(() => {
    if (isOpen && entity) {
      const fetchData = async () => {
        setLoading(true);
        try {
          // 1. Fetch items for this location
          const itemsQuery = query(
            collection(db, 'items'),
            where('locationId', '==', entity.locationId)
          );
          const itemsSnap = await getDocs(itemsQuery);
          const inventory = itemsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setAllInventoryItems(inventory);

          // 2. Fetch prices from the entity's price list (if available)
          const pMap = {};
          const activeShop = shop || globalShop;
          const priceListId = activeShop?.priceListId || customer?.priceListId;
          if (priceListId) {
            const pricesSnap = await getDocs(collection(db, `priceLists/${priceListId}/items`));
            pricesSnap.forEach(doc => {
              pMap[doc.id] = doc.data().price;
            });
          }
          
          // 2b. Fetch Global Customer Prices for B2C orders
          if (customer) {
            const globalPricesSnap = await getDocs(collection(db, 'globalCustomerPrices'));
            globalPricesSnap.forEach(doc => {
              pMap[doc.id] = doc.data().price;
            });
          }
          setPriceMap(pMap);

          // 3. Fetch Employees
          const employeesSnap = await getDocs(collection(db, 'employees'));
          setEmployees(employeesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

          // 4. If editing, populate the items
          if (orderToEdit) {
            setItems(orderToEdit.items.map(item => {
              const invItem = inventory.find(i => i.id === item.itemId);
              const categoryMatch = categories.find(c => c.name === invItem?.category);
              
              return {
                id: Math.random(),
                categoryId: categoryMatch?.id || '',
                itemId: item.itemId,
                quantity: item.quantity,
                batchNumber: item.batchNumber || '',
                price: item.price || 0,
                subtotal: item.subtotal || ((item.price || 0) * (item.quantity || 0)) || 0
              };
            }));
            setDiscount(orderToEdit.discount || 0);
            setReturnAmount(orderToEdit.returnAmount || 0);
            setPaymentReceived(orderToEdit.paymentReceived || 0);
            setUseCredits((orderToEdit.creditsUsed || 0) > 0);
            setOrderStatus(orderToEdit.status || 'Ordered');
            setPaymentStatus(orderToEdit.paymentStatus || 'Unpaid');
            setPaymentMethod(orderToEdit.paymentMethod || 'Cash');
            setAssignedTo(orderToEdit.assignedTo || '');
          } else {
            setItems([{
              id: Date.now(),
              categoryId: '',
              itemId: '',
              quantity: 1,
              batchNumber: '',
              price: 0,
              subtotal: 0
            }]);
            setDiscount(0);
            setReturnAmount(0);
            setPaymentReceived(0);
            setUseCredits(false);
            setOrderStatus('Ordered');
            setPaymentStatus('Unpaid');
            setPaymentMethod('Cash');
            setAssignedTo('');
          }
        } catch (error) {
          console.error("Error loading order data:", error);
          toast.error("Failed to load inventory or prices");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [isOpen, entity, orderToEdit, categories, shop, customer]);

  // Reset local state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedLocationId('');
      setSelectedShopId('');
      setGlobalShop(null);
    }
  }, [isOpen]);

  const addRow = () => {
    setItems([...items, {
      id: Date.now(),
      categoryId: '',
      itemId: '',
      quantity: 1,
      batchNumber: '',
      price: 0,
      subtotal: 0
    }]);
  };

  const removeRow = (id) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleItemChange = (id, field, value) => {
    const updatedItems = items.map(item => {
      if (item.id === id) {
        const newItem = { ...item, [field]: value };

        if (field === 'itemId') {
          newItem.price = priceMap[value] || 0;
          newItem.subtotal = newItem.price * newItem.quantity;
        } else if (field === 'quantity') {
          newItem.subtotal = newItem.price * (parseFloat(value) || 0);
        } else if (field === 'categoryId') {
          newItem.itemId = '';
          newItem.price = 0;
          newItem.subtotal = 0;
        }

        return newItem;
      }
      return item;
    });
    setItems(updatedItems);
  };

  // Use the stored totalSubtotal if editing, otherwise calculate from items
  const totalSubtotal = orderToEdit?.totalSubtotal || items.reduce((acc, item) => acc + (parseFloat(item.subtotal) || 0), 0);
  const subtotalAfterDiscount = Math.max(0, totalSubtotal - (parseFloat(discount) || 0));
  const amountToPay = Math.max(0, subtotalAfterDiscount - (parseFloat(returnAmount) || 0));
  
  const calculatedCreditsToUse = orderToEdit 
    ? (orderToEdit.creditsUsed || 0) 
    : Math.min(entity?.credits || 0, amountToPay);
  
  const validCreditsUsed = useCredits ? calculatedCreditsToUse : 0;
  const grandTotal = Math.max(0, amountToPay - validCreditsUsed);
  const balance = Math.max(0, grandTotal - (parseFloat(paymentReceived) || 0));

  const sendPushNotification = async (employeeId, orderId, customerName) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee || !employee.pushToken) {
      console.log("No push token found for employee:", employeeId);
      return;
    }

    try {
      console.log(`Admin: Attempting to notify ${employee.name}...`);
      const message = {
        to: employee.pushToken,
        sound: 'default',
        title: 'New Order Assigned!',
        body: `Order #${orderId.slice(-6).toUpperCase()} for ${customerName} has been assigned to you.`,
        data: { screen: 'customer_orders' },
        priority: 'high',
        channelId: 'orders',
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });
      
      const result = await response.json();
      console.log("Admin: Expo Notification Response:", result);
      
      if (result.errors) {
        console.error("Admin: Expo Notification Error:", result.errors);
      } else {
        toast.success(`Notification sent to ${employee.name}`);
      }
    } catch (error) {
      console.error("Admin: Network error sending notification:", error);
    }
  };

  const handleSaveOrder = async () => {
    if (items.some(item => !item.itemId || item.quantity <= 0)) {
      toast.error("Please fill all item details correctly");
      return;
    }

    setSaving(true);
    const saveToast = toast.loading(orderToEdit ? "Updating order..." : "Saving order...");
    try {
      const orderData = {
        locationId: entity.locationId,
        items: items.map(item => ({
          itemId: item.itemId,
          itemName: allInventoryItems.find(i => i.id === item.itemId)?.name,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
          batchNumber: item.batchNumber
        })),
        totalSubtotal,
        discount: parseFloat(discount) || 0,
        returnAmount: parseFloat(returnAmount) || 0,
        creditsUsed: validCreditsUsed,
        grandTotal,
        paymentReceived: parseFloat(paymentReceived) || 0,
        balance,
        paymentStatus,
        paymentMethod,
        assignedTo,
        employeeId: assignedTo, // For mobile app compatibility
        assignedToName: employees.find(e => e.id === assignedTo)?.name || '',
        updatedAt: new Date().toISOString(),
        status: orderStatus
      };

      const activeShop = shop || globalShop;
      const customerName = activeShop ? activeShop.name : customer?.name;

      if (activeShop) {
        orderData.shopId = activeShop.id;
        orderData.shopName = activeShop.name;
        orderData.type = 'B2B';
      } else if (customer) {
        orderData.customerId = customer.id;
        orderData.customerName = customer.name;
        orderData.type = 'B2C';
      }

      const collectionName = customer ? 'customerOrders' : 'orders';

      let finalOrderId = orderToEdit?.id;

      if (orderToEdit) {
        await updateDoc(doc(db, collectionName, orderToEdit.id), orderData);
        toast.success("Order updated successfully", { id: saveToast });
        
        // Notify if assignedTo changed or was just added
        if (assignedTo && assignedTo !== orderToEdit.assignedTo) {
          sendPushNotification(assignedTo, orderToEdit.id, customerName);
        }
      } else {
        orderData.createdAt = new Date().toISOString();
        const docRef = await addDoc(collection(db, collectionName), orderData);
        finalOrderId = docRef.id;
        
        if (validCreditsUsed > 0 && activeShop) {
           const newCredits = (activeShop.credits || 0) - validCreditsUsed;
           await updateDoc(doc(db, 'shops', activeShop.id), { credits: newCredits });
           await addDoc(collection(db, 'creditHistory'), {
             shopId: activeShop.id,
             amount: validCreditsUsed,
             type: 'used',
             description: `Used for Order #${finalOrderId.slice(-6).toUpperCase()}`,
             createdAt: new Date().toISOString()
           });
        }
        
        toast.success("Order saved successfully", { id: saveToast });
        
        // Notify the assigned employee
        if (assignedTo) {
          sendPushNotification(assignedTo, docRef.id, customerName);
        }
      }
      onClose();
    } catch (error) {
      console.error("Error saving order:", error);
      toast.error("Failed to save order", { id: saveToast });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="order-modal-overlay">
      <div className="order-modal-container">
        <div className="order-modal-header">
          <div className="header-left">
            <ShoppingCart size={24} className="header-icon" />
            <div>
              <h2>{isViewOnly ? 'Order Details' : (orderToEdit ? 'Edit Order' : 'Create New Order')}</h2>
              {entity ? (
                <p>{shop || globalShop ? 'Shop' : 'Customer'}: <strong>{entity.name}</strong> • Order ID: <strong>{orderToEdit ? `#${orderToEdit.id.slice(-6).toUpperCase()}` : 'NEW'}</strong></p>
              ) : (
                <p>Order ID: <strong>NEW</strong></p>
              )}
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>

        <div className="order-modal-body">
          {!shop && !customer && !orderToEdit && (
            <div className="selection-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Select Location</label>
                <CustomDropdown
                  options={locations.map(loc => ({ value: loc.id, label: loc.name }))}
                  value={selectedLocationId}
                  onChange={val => setSelectedLocationId(val)}
                  placeholder="-- Choose Location --"
                  searchable
                />
              </div>
              <div>
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

          {!entity ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
              <ShoppingCart size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
              <p>Please select a location and shop to start adding items.</p>
            </div>
          ) : loading ? (
            <div className="modal-loader"><Loader2 size={32} className="spinner" /> Loading Data...</div>
          ) : (
            <div className="order-content-wrapper" style={{ display: 'flex', gap: '24px', flex: 1, alignItems: 'flex-start', width: '100%' }}>
              <div className="items-section">
                <div className="section-header">
                  <h3>Order Items</h3>
                  {!isViewOnly && (
                    <button className="btn-secondary add-row-btn" onClick={addRow}>
                      <Plus size={16} /> Add Another Item
                    </button>
                  )}
                </div>

                <div className="items-table-header">
                  <div>CATEGORY</div>
                  <div>ITEM</div>
                  <div>QTY</div>
                  <div>BATCH #</div>
                  <div style={{ textAlign: 'right' }}>PRICE</div>
                  <div style={{ textAlign: 'right' }}>SUBTOTAL</div>
                  <div></div>
                </div>

                <div className="items-rows">
                  {items.map((row) => {
                    const filteredInventory = allInventoryItems.filter(i => {
                      const matchesCategory = !row.categoryId || i.category === categories.find(c => c.id === row.categoryId)?.name;
                      if (shop || globalShop) {
                        // For Shops (B2B), hide Customer Only (B2C) items
                        return matchesCategory && !i.forCustomerOnly;
                      }
                      if (customer) {
                        // For Customers (B2C), only show Customer Only items
                        return matchesCategory && i.forCustomerOnly;
                      }
                      return matchesCategory;
                    });

                    return (
                      <div key={row.id} className="item-row">
                        <div>
                          <CustomDropdown
                            options={categories.map(c => ({ value: c.id, label: c.name }))}
                            value={row.categoryId}
                            onChange={(val) => handleItemChange(row.id, 'categoryId', val)}
                            placeholder="Category"
                            disabled={isViewOnly}
                          />
                        </div>
                        <div>
                          <CustomDropdown
                            options={filteredInventory.map(i => ({ value: i.id, label: `${i.name} (${i.unit})` }))}
                            value={row.itemId}
                            onChange={(val) => handleItemChange(row.id, 'itemId', val)}
                            placeholder="Select Item"
                            disabled={isViewOnly}
                            searchable
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            className="form-control"
                            value={row.quantity}
                            onChange={(e) => handleItemChange(row.id, 'quantity', e.target.value)}
                            min="1"
                            disabled={isViewOnly}
                          />
                        </div>
                        <div>
                          <CustomDropdown
                            options={batches.map(b => ({ value: b.batchNumber, label: b.batchNumber }))}
                            value={row.batchNumber}
                            onChange={(val) => handleItemChange(row.id, 'batchNumber', val)}
                            placeholder="Select Batch"
                            disabled={isViewOnly}
                          />
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className="price-display">₹{row.price}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className="subtotal-display">₹{(row.subtotal || 0).toFixed(2)}</div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          {!isViewOnly && (
                            <button className="row-delete-btn" onClick={() => removeRow(row.id)}>
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="order-summary-section">
                <div className="summary-card">
                  <div className="summary-row">
                    <span>Total Subtotal</span>
                    <span className="value">₹{(totalSubtotal || 0).toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Discount Amount</span>
                    <div className="input-with-icon">
                      <IndianRupee size={14} />
                      <input
                        type="number"
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                        placeholder="0.00"
                        disabled={isViewOnly}
                      />
                    </div>
                  </div>
                  <div className="summary-row">
                    <span>Return Amount</span>
                    <div className="input-with-icon">
                      <IndianRupee size={14} />
                      <input
                        type="number"
                        value={returnAmount}
                        onChange={(e) => setReturnAmount(e.target.value)}
                        placeholder="0.00"
                        disabled={isViewOnly}
                      />
                    </div>
                  </div>
                  {(entity?.credits > 0 || orderToEdit?.creditsUsed > 0) && (
                    <div className="summary-row" style={{ color: 'var(--primary-color)', alignItems: 'center' }}>
                      <div style={{ paddingRight: '8px', lineHeight: '1.3' }}>
                        <span style={{ display: 'block', fontWeight: 600 }}>Use Credits</span>
                        <span style={{ fontSize: '11px', opacity: 0.8 }}>(₹{entity?.credits || 0} available)</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                        {useCredits && <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>-₹{validCreditsUsed.toFixed(2)}</span>}
                        <label className="toggle-switch" style={{ margin: 0 }}>
                          <input 
                            type="checkbox" 
                            checked={useCredits}
                            onChange={(e) => setUseCredits(e.target.checked)}
                            disabled={isViewOnly || !!orderToEdit}
                          />
                          <span className="slider round"></span>
                        </label>
                      </div>
                    </div>
                  )}
                  <div className="summary-row grand-total">
                    <span>Grand Total</span>
                    <span className="value">₹{(grandTotal || 0).toFixed(2)}</span>
                  </div>
                  <hr />
                  <div className="summary-row payment">
                    <span>Payment Received</span>
                    <div className="input-with-icon">
                      <IndianRupee size={14} />
                      <input
                        type="number"
                        value={paymentReceived}
                        onChange={(e) => setPaymentReceived(e.target.value)}
                        placeholder="0.00"
                        disabled={isViewOnly}
                      />
                    </div>
                  </div>
                  <div className="summary-row balance">
                    <span>Balance Due</span>
                    <span className="value" style={{ color: (balance || 0) > 0 ? '#ef4444' : '#10b981', fontWeight: 700 }}>
                      ₹{(balance || 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="summary-card status-controls" style={{ marginTop: '16px' }}>
                  <div className="summary-row" style={{ alignItems: 'center' }}>
                    <span>Order Status</span>
                    <div style={{ width: '150px' }}>
                      <CustomDropdown
                        options={['Ordered', 'Shipped', 'Delivered', 'Completed', 'Cancelled'].map(s => ({ value: s, label: s }))}
                        value={orderStatus}
                        onChange={(val) => setOrderStatus(val)}
                        disabled={isViewOnly}
                      />
                    </div>
                  </div>
                  <div className="summary-row" style={{ alignItems: 'center' }}>
                    <span>Payment Status</span>
                    <div style={{ width: '150px' }}>
                      <CustomDropdown
                        options={['Unpaid', 'Paid', 'Partial'].map(s => ({ value: s, label: s }))}
                        value={paymentStatus}
                        onChange={(val) => setPaymentStatus(val)}
                        disabled={isViewOnly}
                      />
                    </div>
                  </div>
                  <div className="summary-row" style={{ alignItems: 'center' }}>
                    <span>Payment Method</span>
                    <div style={{ width: '150px' }}>
                      <CustomDropdown
                        options={['Cash', 'UPI', 'Card'].map(s => ({ value: s, label: s }))}
                        value={paymentMethod}
                        onChange={(val) => setPaymentMethod(val)}
                        disabled={isViewOnly}
                      />
                    </div>
                  </div>
                  <div className="summary-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                    <span>Assign To Employee</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                      <UserCheck size={18} color="var(--primary-color)" style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <CustomDropdown
                          options={employees.map(e => ({ value: e.id, label: `${e.name} (${e.role || 'Agent'})` }))}
                          value={assignedTo}
                          onChange={(val) => setAssignedTo(val)}
                          placeholder="Select Employee"
                          disabled={isViewOnly}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="order-modal-footer">
          <button className="btn-secondary" onClick={onClose} disabled={saving}>{isViewOnly ? 'Close' : 'Cancel'}</button>
          {!isViewOnly && (
            <button className="btn-primary save-order-btn" onClick={handleSaveOrder} disabled={saving || loading}>
              {saving ? <Loader2 className="spinner" size={18} /> : <Save size={18} />}
              <span>Save Order</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = `
  .status-controls {
    background: #f8fafc !important;
    border: 1px solid #e2e8f0 !important;
  }
  .status-controls .summary-row {
    margin-bottom: 12px;
  }
  .status-controls select.form-control {
    width: 150px;
    height: 36px;
    padding: 4px 8px;
    border-radius: 8px;
    border: 1px solid #cbd5e1;
    font-size: 13px;
    font-weight: 600;
  }
  .toggle-switch {
    position: relative;
    display: inline-block;
    width: 44px;
    height: 24px;
  }
  .toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  .toggle-switch .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #cbd5e1;
    transition: .4s;
  }
  .toggle-switch .slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: .4s;
  }
  .toggle-switch input:checked + .slider {
    background-color: var(--primary-color, #3b82f6);
  }
  .toggle-switch input:checked + .slider:before {
    transform: translateX(20px);
  }
  .toggle-switch .slider.round {
    border-radius: 24px;
  }
  .toggle-switch .slider.round:before {
    border-radius: 50%;
  }
`;

// Add a style tag to the document head
if (typeof document !== 'undefined') {
  const styleTag = document.createElement('style');
  styleTag.textContent = styles;
  document.head.appendChild(styleTag);
}

export default OrderModal;
