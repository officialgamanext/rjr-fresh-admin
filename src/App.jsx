import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Locations from './pages/Locations';
import Stores from './pages/Stores';
import StoreDetails from './pages/StoreDetails';
import Items from './pages/Items';
import { Settings } from 'lucide-react';
import { LocationProvider } from './LocationContext';
import './css/Global.css';

function App() {
  return (
    <LocationProvider>
      <Router>
        <div className="app-container">
          <Sidebar />
          <main className="main-content">
            <Header />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/locations" element={<Locations />} />
              <Route path="/stores" element={<Stores />} />
              <Route path="/stores/:id" element={<StoreDetails />} />
              <Route path="/items" element={<Items />} />
              {/* Fallback for other routes */}
              <Route path="*" element={<Dashboard />} />
            </Routes>
          </main>
          <button className="floating-settings" title="Settings">
            <Settings size={20} />
          </button>
        </div>
      </Router>
    </LocationProvider>
  );
}

export default App;
