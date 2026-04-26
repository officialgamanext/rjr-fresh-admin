import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs,
  doc,
  setDoc,
  writeBatch,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Search, 
  Tag, 
  Loader2, 
  Save,
  Check,
  X,
  Edit2
} from 'lucide-react';
import toast from 'react-hot-toast';
import '../css/pages/dashboard.css';
import '../css/components/table.css';

const CustomerPrices = () => {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [customerPrices, setCustomerPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [priceSearchQuery, setPriceSearchQuery] = useState('');
  const [savingPrices, setSavingPrices] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [tempPrices, setTempPrices] = useState({});
  const [editingItems, setEditingItems] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch all inventory items (we'll filter forCustomerOnly in the render)
        const itemsSnap = await getDocs(query(collection(db, 'items'), orderBy('name', 'asc')));
        const items = itemsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setInventoryItems(items);

        // 2. Fetch global customer prices
        const pricesSnap = await getDocs(collection(db, 'globalCustomerPrices'));
        const pMap = {};
        const tPrices = {};
        pricesSnap.forEach(doc => {
          const data = doc.data();
          pMap[doc.id] = data.price;
          tPrices[doc.id] = data.price.toString();
        });
        setCustomerPrices(pMap);
        setTempPrices(tPrices);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load prices");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePriceChange = (itemId, value) => {
    setTempPrices(prev => ({ ...prev, [itemId]: value }));
  };

  const handleSaveIndividualPrice = async (item) => {
    const tPrice = tempPrices[item.id];
    if (tPrice === undefined || tPrice === "" || parseFloat(tPrice) < 0) {
      toast.error("Invalid price");
      return;
    }

    setSavingId(item.id);
    try {
      const priceRef = doc(db, 'globalCustomerPrices', item.id);
      const newPrice = parseFloat(tPrice);
      await setDoc(priceRef, {
        itemId: item.id,
        price: newPrice,
        updatedAt: new Date().toISOString()
      });
      setCustomerPrices(prev => ({ ...prev, [item.id]: newPrice }));
      setEditingItems(prev => ({ ...prev, [item.id]: false }));
      toast.success(`${item.name} saved`);
    } catch (error) {
      toast.error("Failed to save price");
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveAllPrices = async () => {
    setSavingPrices(true);
    const saveToast = toast.loading("Saving all prices...");
    try {
      const batch = writeBatch(db);
      let count = 0;

      // Only iterate over customer-only items
      const customerItems = inventoryItems.filter(i => i.forCustomerOnly);
      
      customerItems.forEach(item => {
        const tPrice = tempPrices[item.id];
        const currentPrice = customerPrices[item.id];
        
        if (tPrice !== undefined && tPrice !== "" && parseFloat(tPrice) >= 0) {
          const newPrice = parseFloat(tPrice);
          if (currentPrice !== newPrice) {
            const priceRef = doc(db, 'globalCustomerPrices', item.id);
            batch.set(priceRef, {
              itemId: item.id,
              price: newPrice,
              updatedAt: new Date().toISOString()
            });
            count++;
          }
        }
      });

      if (count > 0) {
        await batch.commit();
        setCustomerPrices(prev => {
          const next = { ...prev };
          customerItems.forEach(item => {
            if (tempPrices[item.id] !== undefined) {
              next[item.id] = parseFloat(tempPrices[item.id]);
            }
          });
          return next;
        });
        setEditingItems({});
        toast.success(`Saved ${count} prices`, { id: saveToast });
      } else {
        toast.dismiss(saveToast);
        toast("No changes to save");
      }
    } catch (error) {
      console.error("Error saving prices:", error);
      toast.error("Failed to save prices", { id: saveToast });
    } finally {
      setSavingPrices(false);
    }
  };

  const filteredItems = inventoryItems.filter(item => 
    item.forCustomerOnly && (
      item.name.toLowerCase().includes(priceSearchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(priceSearchQuery.toLowerCase())
    )
  );

  return (
    <div className="customer-prices-page">
      <div className="page-header">
        <div>
          <h1>Global Customer Price List</h1>
          <div className="breadcrumb">
            <span>Home</span>
            <span>&gt;</span>
            <span className="breadcrumb-item active">Customer Prices</span>
          </div>
        </div>
        <button className="btn-primary" onClick={handleSaveAllPrices} disabled={savingPrices}>
          {savingPrices ? <Loader2 size={18} className="spinner" /> : <><Save size={18} /> Save All Prices</>}
        </button>
      </div>

      <div className="card">
        <div className="card-header" style={{ justifyContent: 'space-between' }}>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Search customer items..." 
              className="form-control" 
              style={{ paddingLeft: '36px', width: '300px', height: '40px' }}
              value={priceSearchQuery}
              onChange={(e) => setPriceSearchQuery(e.target.value)}
            />
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Showing items marked as **B2C Only**. Enter prices and click **Save All**.
          </p>
        </div>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>ITEM NAME</th>
                <th>CATEGORY</th>
                <th>UNIT</th>
                <th style={{ width: '180px' }}>PRICE (₹)</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="spinner" /></td></tr>
              ) : filteredItems.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>No customer-only items found. Mark items as 'For Customer Only' in Inventory first.</td></tr>
              ) : (
                filteredItems.map(item => {
                  const currentPrice = customerPrices[item.id];
                  const isEditing = editingItems[item.id] || currentPrice === undefined;
                  const currentTempPrice = tempPrices[item.id] || '';

                  return (
                    <tr key={item.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Tag size={16} color="var(--primary-color)" />
                          <span style={{ fontWeight: 600 }}>{item.name}</span>
                        </div>
                      </td>
                      <td><span className="status-badge" style={{ backgroundColor: '#f1f5f9' }}>{item.category}</span></td>
                      <td>{item.unit}</td>
                      <td>
                        {isEditing ? (
                          <input 
                            type="number" 
                            className="form-control" 
                            style={{ width: '140px', height: '36px', fontWeight: 700, borderColor: currentPrice === undefined ? 'var(--primary-color)' : '' }}
                            value={currentTempPrice}
                            onChange={(e) => handlePriceChange(item.id, e.target.value)}
                            placeholder="Set Price"
                          />
                        ) : (
                          <span style={{ fontWeight: 800, fontSize: '17px', color: 'var(--primary-color)' }}>
                            ₹{currentPrice}
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {!isEditing ? (
                            <button className="action-btn-ui" onClick={() => setEditingItems(prev => ({ ...prev, [item.id]: true }))}>
                              <Edit2 size={18} color="#64748b" />
                            </button>
                          ) : (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button className="icon-btn-success" onClick={() => handleSaveIndividualPrice(item)} disabled={savingId === item.id}>
                                {savingId === item.id ? <Loader2 size={16} className="spinner" /> : <Check size={18} />}
                              </button>
                              {currentPrice !== undefined && (
                                <button className="icon-btn-danger" onClick={() => setEditingItems(prev => ({ ...prev, [item.id]: false }))}>
                                  <X size={18} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .action-btn-ui { padding: 8px; border-radius: 8px; border: none; background: transparent; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
        .action-btn-ui:hover { background: #f1f5f9; }
        .icon-btn-success { color: var(--success-color); background: #e6f9f1; border-radius: 6px; padding: 6px; border: none; cursor: pointer; display: flex; align-items: center; }
        .icon-btn-danger { color: var(--danger-color); background: #fef2f2; border-radius: 6px; padding: 6px; border: none; cursor: pointer; display: flex; align-items: center; }
        .spinner { animation: rotate 1s linear infinite; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default CustomerPrices;
