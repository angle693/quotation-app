// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QuotationProvider } from './context/QuotationContext';
import Layout from './components/Layout';
import RatesPage from './pages/RatesPage';
import AddProductPage from './pages/AddProductPage';
import ProductListPage from './pages/ProductListPage';

function App() {
  return (
    <QuotationProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/rates" replace />} />
            <Route path="rates" element={<RatesPage />} />
            <Route path="add-product" element={<AddProductPage />} />
            <Route path="product-list" element={<ProductListPage />} />
          </Route>
        </Routes>
      </Router>
    </QuotationProvider>
  );
}

export default App;