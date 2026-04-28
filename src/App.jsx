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
import CustomerDetails from './pages/CustomerDetails';
import CustomerOrders from './pages/CustomerOrders';
import Employees from './pages/Employees';
import EmployeeDetails from './pages/EmployeeDetails';
import CustomerPrices from './pages/CustomerPrices';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import { LocationProvider } from './contexts/LocationContext';
import './index.css';

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
                <Route index element={<Dashboard />} />
                <Route path="shops" element={<Shops />} />
                <Route path="shop-orders" element={<ShopOrders />} />
                <Route path="shops/:id" element={<ShopDetails />} />
                <Route path="customers" element={<Customers />} />
                <Route path="customer-orders" element={<CustomerOrders />} />
                <Route path="customers/:id" element={<CustomerDetails />} />
                <Route path="customer-prices" element={<CustomerPrices />} />
                <Route path="items" element={<Items />} />
                <Route path="categories" element={<Categories />} />
                <Route path="pricelist" element={<PriceList />} />
                 <Route path="pricelist/:id" element={<PriceListDetails />} />
                <Route path="payments" element={<Payments />} />
                <Route path="employees" element={<Employees />} />
                <Route path="employees/:id" element={<EmployeeDetails />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </LocationProvider>
      </AuthProvider>
    </>
  );
}

export default App;
