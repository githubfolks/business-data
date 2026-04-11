import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import SearchPage from './pages/SearchPage';
import AnalyticsPage from './pages/AnalyticsPage';
import RecommendationsPage from './pages/RecommendationsPage';
import BusinessDetailPage from './pages/BusinessDetailPage';
import './App.css';

function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  return (
    <Router>
      <div className="app">
        <Navigation />
        <main className="main-content">
          {error && (
            <div className="error-banner">
              {error}
              <button onClick={() => setError(null)}>×</button>
            </div>
          )}
          <Routes>
            <Route path="/" element={<SearchPage setError={setError} />} />
            <Route path="/search" element={<SearchPage setError={setError} />} />
            <Route path="/business/:id" element={<BusinessDetailPage setError={setError} />} />
            <Route path="/analytics" element={<AnalyticsPage setError={setError} />} />
            <Route path="/recommendations" element={<RecommendationsPage setError={setError} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
