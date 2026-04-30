import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Shops from './pages/Shops';
import Customers from './pages/Customers';
import Items from './pages/Items';
import PriceList from './pages/PriceList';
import PriceListDetails from './pages/PriceListDetails';
import Categories from './pages/Categories';
import Payments from './pages/Payments';
import ShopDetails from './pages/ShopDetails';
import ShopOrders from './pages/ShopOrders';
import ReturnOrders from './pages/ReturnOrders';
import Batches from './pages/Batches';
import CustomerDetails from './pages/CustomerDetails';
import CustomerOrders from './pages/CustomerOrders';
import Employees from './pages/Employees';
import EmployeeDetails from './pages/EmployeeDetails';
import CustomerPrices from './pages/CustomerPrices';
import ShopVisits from './pages/ShopVisits';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import { LocationProvider } from './contexts/LocationContext';
import './index.css';

import PermissionGate from './components/PermissionGate';

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <AuthProvider>
        <LocationProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<PermissionGate permission="dashboard"><Dashboard /></PermissionGate>} />
                <Route path="shops" element={<PermissionGate permission="shops"><Shops /></PermissionGate>} />
                <Route path="shop-visits" element={<PermissionGate permission="shopVisits"><ShopVisits /></PermissionGate>} />
                <Route path="shop-orders" element={<PermissionGate permission="shopOrders"><ShopOrders /></PermissionGate>} />
                <Route path="return-orders" element={<PermissionGate permission="returnOrders"><ReturnOrders /></PermissionGate>} />
                <Route path="shops/:id" element={<PermissionGate permission="shops"><ShopDetails /></PermissionGate>} />
                <Route path="customers" element={<PermissionGate permission="customers"><Customers /></PermissionGate>} />
                <Route path="customer-orders" element={<PermissionGate permission="customerOrders"><CustomerOrders /></PermissionGate>} />
                <Route path="customers/:id" element={<PermissionGate permission="customers"><CustomerDetails /></PermissionGate>} />
                <Route path="customer-prices" element={<PermissionGate permission="customerPrices"><CustomerPrices /></PermissionGate>} />
                <Route path="items" element={<PermissionGate permission="items"><Items /></PermissionGate>} />
                <Route path="batches" element={<PermissionGate permission="batches"><Batches /></PermissionGate>} />
                <Route path="categories" element={<PermissionGate permission="categories"><Categories /></PermissionGate>} />
                <Route path="pricelist" element={<PermissionGate permission="priceList"><PriceList /></PermissionGate>} />
                <Route path="pricelist/:id" element={<PermissionGate permission="priceList"><PriceListDetails /></PermissionGate>} />
                <Route path="payments" element={<PermissionGate permission="payments"><Payments /></PermissionGate>} />
                <Route path="employees" element={<PermissionGate permission="employees"><Employees /></PermissionGate>} />
                <Route path="employees/:id" element={<PermissionGate permission="employees"><EmployeeDetails /></PermissionGate>} />
              </Route>
            </Routes>
          </BrowserRouter>
        </LocationProvider>
      </AuthProvider>
    </>
  );
}

export default App;
