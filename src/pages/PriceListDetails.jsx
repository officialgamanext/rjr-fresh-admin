import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  writeBatch,
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  ArrowLeft, 
  Search, 
  Check, 
  X,
  Loader2,
  Tag,
  Save,
  Edit2,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import '../css/pages/dashboard.css';
import '../css/components/table.css';

const PriceListDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listInfo, setListInfo] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [priceMap, setPriceMap] = useState({}); // { itemId: { price, exists } }
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [savingAll, setSavingAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [editingItems, setEditingItems] = useState({});
  const [tempPrices, setTempPrices] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const listDoc = await getDoc(doc(db, 'priceLists', id));
        if (listDoc.exists()) {
          setListInfo(listDoc.data());
        } else {
          toast.error("Price list not found");
          navigate('/pricelist');
          return;
        }

        const itemsSnap = await getDocs(query(collection(db, 'items'), orderBy('name', 'asc')));
        const items = [];
        itemsSnap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
        setInventoryItems(items);

        const pricesSnap = await getDocs(collection(db, `priceLists/${id}/items`));
        const pMap = {};
        const tPrices = {};
        pricesSnap.forEach(doc => {
          const data = doc.data();
          pMap[doc.id] = { price: data.price, exists: true };
          tPrices[doc.id] = data.price.toString();
        });
        setPriceMap(pMap);
        setTempPrices(tPrices);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Error loading data");
      }
    };

    fetchData();
  }, [id, navigate]);

  const handlePriceChange = (itemId, value) => {
    setTempPrices(prev => ({ ...prev, [itemId]: value }));
  };

  const handleSaveItemPrice = async (item) => {
    const price = tempPrices[item.id];
    if (!price || parseFloat(price) < 0) {
      toast.error("Please enter a valid price");
      return;
    }

    setSavingId(item.id);
    try {
      await setDoc(doc(db, `priceLists/${id}/items`, item.id), {
        itemId: item.id,
        itemName: item.name,
        itemCategory: item.category,
        itemUnit: item.unit,
        price: parseFloat(price),
        updatedAt: new Date().toISOString()
      });

      setPriceMap(prev => ({
        ...prev,
        [item.id]: { price: parseFloat(price), exists: true }
      }));
      setEditingItems(prev => ({ ...prev, [item.id]: false }));
      toast.success(`${item.name} saved`);
    } catch (error) {
      toast.error("Error saving price");
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveAllPrices = async () => {
    setSavingAll(true);
    const batch = writeBatch(db);
    let count = 0;

    const saveToast = toast.loading("Saving all prices...");

    try {
      inventoryItems.forEach(item => {
        const tPrice = tempPrices[item.id];
        const pInfo = priceMap[item.id];
        
        // Only save if price is entered and different from current or brand new
        if (tPrice && tPrice !== "" && parseFloat(tPrice) >= 0) {
          const newPrice = parseFloat(tPrice);
          if (!pInfo || pInfo.price !== newPrice) {
            const itemRef = doc(db, `priceLists/${id}/items`, item.id);
            batch.set(itemRef, {
              itemId: item.id,
              itemName: item.name,
              itemCategory: item.category,
              itemUnit: item.unit,
              price: newPrice,
              updatedAt: new Date().toISOString()
            });
            count++;
          }
        }
      });

      if (count === 0) {
        toast.dismiss(saveToast);
        toast("No changes to save");
        setSavingAll(false);
        return;
      }

      await batch.commit();
      
      // Update local state
      const newMap = { ...priceMap };
      inventoryItems.forEach(item => {
        const tPrice = tempPrices[item.id];
        if (tPrice && tPrice !== "" && parseFloat(tPrice) >= 0) {
          newMap[item.id] = { price: parseFloat(tPrice), exists: true };
        }
      });
      setPriceMap(newMap);
      setEditingItems({});
      
      toast.success(`Successfully saved ${count} prices`, { id: saveToast });
    } catch (error) {
      console.error("Batch error:", error);
      toast.error("Failed to save changes", { id: saveToast });
    } finally {
      setSavingAll(false);
    }
  };

  const handleDeleteFromList = async (itemId) => {
    if (window.confirm("Remove this item from the price list?")) {
      try {
        await deleteDoc(doc(db, `priceLists/${id}/items`, itemId));
        setPriceMap(prev => {
          const newMap = { ...prev };
          delete newMap[itemId];
          return newMap;
        });
        setTempPrices(prev => {
          const newTemp = { ...prev };
          delete newTemp[itemId];
          return newTemp;
        });
        toast.success("Item removed");
      } catch (error) {
        toast.error("Error removing item");
      }
    }
  };

  const filteredItems = inventoryItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}><Loader2 className="spinner" /></div>;

  return (
    <div className="pricelist-details-page">
      <div className="page-header">
        <div>
          <button onClick={() => navigate('/pricelist')} className="back-link">
            <ArrowLeft size={16} /> Price Lists
          </button>
          <h1>{listInfo?.name}</h1>
        </div>
        <button 
          className="btn-primary" 
          onClick={handleSaveAllPrices} 
          disabled={savingAll}
          style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          {savingAll ? <Loader2 size={18} className="spinner" /> : <><Save size={18} /> Save All Prices</>}
        </button>
      </div>

      <div className="card">
        <div className="card-header" style={{ justifyContent: 'space-between' }}>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Filter items..." 
              className="form-control" 
              style={{ paddingLeft: '36px', width: '300px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Enter individual prices below and click **Save All** to commit changes.
          </p>
        </div>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>ITEM NAME</th>
                <th>CATEGORY</th>
                <th>UNIT</th>
                <th>PRICE (₹)</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const priceInfo = priceMap[item.id];
                const isEditing = editingItems[item.id] || !priceInfo;
                const currentTempPrice = tempPrices[item.id] || '';

                return (
                  <tr key={item.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Tag size={14} color="var(--primary-color)" />
                        <span style={{ fontWeight: 600 }}>{item.name}</span>
                      </div>
                    </td>
                    <td><span className="status-badge" style={{ backgroundColor: '#f1f5f9' }}>{item.category}</span></td>
                    <td>{item.unit}</td>
                    <td>
                      {isEditing ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input 
                            type="number" 
                            className="form-control" 
                            style={{ width: '120px', height: '36px', fontWeight: 700 }}
                            placeholder="Set Price"
                            value={currentTempPrice}
                            onChange={(e) => handlePriceChange(item.id, e.target.value)}
                          />
                        </div>
                      ) : (
                        <span style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text-primary)' }}>
                          ₹{priceInfo.price}
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {!isEditing ? (
                          <>
                            <button 
                              className="action-btn-ui"
                              onClick={() => {
                                setEditingItems(prev => ({ ...prev, [item.id]: true }));
                                setTempPrices(prev => ({ ...prev, [item.id]: priceInfo.price.toString() }));
                              }}
                              title="Edit Price"
                            >
                              <Edit2 size={18} color="var(--primary-color)" />
                            </button>
                            <button 
                              className="action-btn-ui"
                              onClick={() => handleDeleteFromList(item.id)}
                              title="Remove"
                            >
                              <Trash2 size={18} color="var(--danger)" />
                            </button>
                          </>
                        ) : (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button 
                              className="icon-btn-success" 
                              onClick={() => handleSaveItemPrice(item)}
                              disabled={savingId === item.id}
                            >
                              {savingId === item.id ? <Loader2 size={16} className="spinner" /> : <Check size={16} />}
                            </button>
                            {priceInfo && (
                              <button 
                                className="icon-btn-danger" 
                                onClick={() => {
                                  setEditingItems(prev => ({ ...prev, [item.id]: false }));
                                  setTempPrices(prev => ({ ...prev, [item.id]: priceInfo.price.toString() }));
                                }}
                              >
                                <X size={16} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .back-link { display: flex; align-items: center; gap: 8px; color: var(--text-muted); font-size: 14px; margin-bottom: 8px; background: none; border: none; cursor: pointer; padding: 0; }
        .action-btn-ui { padding: 6px; border-radius: 6px; display: flex; align-items: center; justifyContent: center; transition: background 0.2s; }
        .action-btn-ui:hover { background-color: #f1f5f9; }
        .icon-btn-success { color: var(--success); background: #e6f9f1; border-radius: 4px; padding: 6px; border: none; cursor: pointer; display: flex; align-items: center; }
        .icon-btn-danger { color: var(--danger); background: #fef2f2; border-radius: 4px; padding: 6px; border: none; cursor: pointer; display: flex; align-items: center; }
        .spinner { animation: rotate 1s linear infinite; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default PriceListDetails;
