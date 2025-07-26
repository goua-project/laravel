import React from 'react';
import ReactDOM from 'react-dom/client'; // 👈 Nécessaire
import './bootstrap';
import '../css/app.css';

import { Routes, Route, BrowserRouter } from 'react-router-dom';

import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import CreateStorePage from './pages/CreateStorePage';
import DashboardPage from './pages/DashboardPage';
import StorePage from './pages/StorePage';
import AddProductPage from './pages/AddProductPage';
import CheckoutPage from './components/checkout/CheckoutPage';
import { AuthProvider } from './contexts/AuthContext';
import { StoreProvider } from './contexts/StoreContext';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <StoreProvider>
          <div className="flex flex-col min-h-screen bg-gray-50">
            <Navbar />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth/:authType" element={<AuthPage />} />
                <Route path="/create-store" element={<CreateStorePage />} />
                <Route path="/dashboard/*" element={<DashboardPage />} />
                <Route path="/store/:storeId" element={<StorePage />} />
                <Route path="/add-product" element={<AddProductPage />} />
                <Route path="/checkout/:storeId" element={<CheckoutPage />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </StoreProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

// Monter l'app React dans le div#root
const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<App />);
}
