import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Shops from './pages/Shops';
import Customers from './pages/Customers';
import Items from './pages/Items';
import PriceList from './pages/PriceList';
import PriceListDetails from './pages/PriceListDetails';
import Payments from './pages/Payments';
import ShopDetails from './pages/ShopDetails';
import CustomerDetails from './pages/CustomerDetails';
import { Toaster } from 'react-hot-toast';
import './index.css';

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="shops" element={<Shops />} />
            <Route path="shops/:id" element={<ShopDetails />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customers/:id" element={<CustomerDetails />} />
            <Route path="items" element={<Items />} />
            <Route path="pricelist" element={<PriceList />} />
            <Route path="pricelist/:id" element={<PriceListDetails />} />
            <Route path="payments" element={<Payments />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
