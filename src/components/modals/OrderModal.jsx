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
  orderBy
} from 'firebase/firestore';
import { db } from '../../firebase';
import toast from 'react-hot-toast';
import '../../css/components/order-modal.css';

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
  const [paymentReceived, setPaymentReceived] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [employees, setEmployees] = useState([]);
  
  const [orderStatus, setOrderStatus] = useState('Ordered');
  const [paymentStatus, setPaymentStatus] = useState('Unpaid');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [assignedTo, setAssignedTo] = useState('');

  const entity = shop || customer;

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
          const priceListId = shop?.priceListId || customer?.priceListId;
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
                price: item.price,
                subtotal: item.subtotal
              };
            }));
            setDiscount(orderToEdit.discount || 0);
            setPaymentReceived(orderToEdit.paymentReceived || 0);
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
            setPaymentReceived(0);
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
  }, [isOpen, shop, customer, orderToEdit, categories]);

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

  const totalSubtotal = items.reduce((acc, item) => acc + item.subtotal, 0);
  const grandTotal = Math.max(0, totalSubtotal - (parseFloat(discount) || 0));

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
        grandTotal,
        paymentReceived: parseFloat(paymentReceived) || 0,
        paymentStatus,
        paymentMethod,
        assignedTo,
        employeeId: assignedTo, // For mobile app compatibility
        assignedToName: employees.find(e => e.id === assignedTo)?.name || '',
        updatedAt: new Date().toISOString(),
        status: orderStatus
      };

      if (shop) {
        orderData.shopId = shop.id;
        orderData.shopName = shop.name;
        orderData.type = 'B2B';
      } else if (customer) {
        orderData.customerId = customer.id;
        orderData.customerName = customer.name;
        orderData.type = 'B2C';
      }

      const collectionName = customer ? 'customerOrders' : 'orders';

      if (orderToEdit) {
        await updateDoc(doc(db, collectionName, orderToEdit.id), orderData);
        toast.success("Order updated successfully", { id: saveToast });
      } else {
        orderData.createdAt = new Date().toISOString();
        await addDoc(collection(db, collectionName), orderData);
        toast.success("Order saved successfully", { id: saveToast });
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
              <p>{shop ? 'Shop' : 'Customer'}: <strong>{entity.name}</strong> • Order ID: <strong>{orderToEdit ? `#${orderToEdit.id.slice(-6).toUpperCase()}` : 'NEW'}</strong></p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>

        <div className="order-modal-body">
          {loading ? (
            <div className="modal-loader"><Loader2 size={32} className="spinner" /> Loading Data...</div>
          ) : (
            <>
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
                      if (shop) {
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
                          <select
                            className="form-control"
                            value={row.categoryId}
                            onChange={(e) => handleItemChange(row.id, 'categoryId', e.target.value)}
                            disabled={isViewOnly}
                          >
                            <option value="">Select</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <select
                            className="form-control"
                            value={row.itemId}
                            onChange={(e) => handleItemChange(row.id, 'itemId', e.target.value)}
                            disabled={isViewOnly}
                          >
                            <option value="">Select Item</option>
                            {filteredInventory.map(i => (
                              <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                            ))}
                          </select>
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
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Batch"
                            value={row.batchNumber}
                            onChange={(e) => handleItemChange(row.id, 'batchNumber', e.target.value)}
                            disabled={isViewOnly}
                          />
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className="price-display">₹{row.price}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className="subtotal-display">₹{row.subtotal.toFixed(2)}</div>
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
                    <span className="value">₹{totalSubtotal.toFixed(2)}</span>
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
                  <div className="summary-row grand-total">
                    <span>Grand Total</span>
                    <span className="value">₹{grandTotal.toFixed(2)}</span>
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
                </div>

                <div className="summary-card status-controls" style={{ marginTop: '16px' }}>
                  <div className="summary-row">
                    <span>Order Status</span>
                    <select 
                      className="form-control" 
                      value={orderStatus} 
                      onChange={(e) => setOrderStatus(e.target.value)}
                      disabled={isViewOnly}
                    >
                      <option value="Ordered">Ordered</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="summary-row">
                    <span>Payment Status</span>
                    <select 
                      className="form-control" 
                      value={paymentStatus} 
                      onChange={(e) => setPaymentStatus(e.target.value)}
                      disabled={isViewOnly}
                    >
                      <option value="Unpaid">Unpaid</option>
                      <option value="Paid">Paid</option>
                      <option value="Partial">Partial</option>
                    </select>
                  </div>
                  <div className="summary-row">
                    <span>Payment Method</span>
                    <select 
                      className="form-control" 
                      value={paymentMethod} 
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      disabled={isViewOnly}
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Card">Card</option>
                    </select>
                  </div>
                  <div className="summary-row">
                    <span>Assign To Employee</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                      <UserCheck size={18} color="var(--primary-color)" />
                      <select 
                        className="form-control" 
                        value={assignedTo} 
                        onChange={(e) => setAssignedTo(e.target.value)}
                        disabled={isViewOnly}
                      >
                        <option value="">Select Employee</option>
                        {employees.map(e => (
                          <option key={e.id} value={e.id}>{e.name} ({e.role || 'Agent'})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </>
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
`;

// Add a style tag to the document head
if (typeof document !== 'undefined') {
  const styleTag = document.createElement('style');
  styleTag.textContent = styles;
  document.head.appendChild(styleTag);
}

export default OrderModal;
