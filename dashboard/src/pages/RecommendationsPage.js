import React, { useState, useEffect } from 'react';
import { recommendationsAPI } from '../api';
import BusinessCard from '../components/BusinessCard';
import { useNavigate } from 'react-router-dom';
import './RecommendationsPage.css';

function RecommendationsPage({ setError }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState('trending');
  const [data, setData] = useState([]);
  const [filters, setFilters] = useState({
    city: 'New York',
    categories: 'Restaurant',
    minRating: 4,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        let response;
        if (tab === 'trending') {
          response = await recommendationsAPI.getTrending(20);
          setData(response.data.recommendations || []);
        }
      } catch (err) {
        setError('Failed to load recommendations: ' + (err.response?.data?.error || err.message));
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [tab, setError]);

  const handleUserSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const categories = filters.categories.split(',').map(c => c.trim());
      const response = await recommendationsAPI.getForUser(filters.city, categories, filters.minRating, 20);
      setData(response.data.recommendations || []);
    } catch (err) {
      setError('Search failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessClick = (business) => {
    navigate(`/business/${business._id}`);
  };

  return (
    <div className="recommendations-page container">
      <div className="page-header">
        <h1>Recommendations</h1>
        <p>Discover trending and personalized business recommendations</p>
      </div>

      <div className="tabs">
        <button
          className={`tab ${tab === 'trending' ? 'active' : ''}`}
          onClick={() => setTab('trending')}
        >
          🔥 Trending
        </button>
        <button
          className={`tab ${tab === 'personalized' ? 'active' : ''}`}
          onClick={() => setTab('personalized')}
        >
          💡 Personalized
        </button>
      </div>

      {tab === 'personalized' && (
        <form onSubmit={handleUserSearch} className="filter-form">
          <div className="form-row">
            <input
              type="text"
              placeholder="City"
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
            />
            <input
              type="text"
              placeholder="Categories (comma-separated)"
              value={filters.categories}
              onChange={(e) => setFilters({ ...filters, categories: e.target.value })}
            />
            <input
              type="number"
              placeholder="Min Rating"
              value={filters.minRating}
              onChange={(e) => setFilters({ ...filters, minRating: parseFloat(e.target.value) })}
              min="0"
              max="5"
              step="0.5"
            />
            <button type="submit" className="button" disabled={loading}>
              {loading ? 'Searching...' : 'Get Recommendations'}
            </button>
          </div>
        </form>
      )}

      <div className="recommendations-content">
        {loading && <div className="loading">Loading recommendations...</div>}

        {!loading && data.length === 0 && (
          <div className="no-results">No recommendations found. Try adjusting your filters.</div>
        )}

        {!loading && data.length > 0 && (
          <div>
            <p className="results-count">Found {data.length} recommendations</p>
            <div className="grid">
              {data.map((business) => (
                <BusinessCard
                  key={business._id}
                  business={business}
                  onClick={() => handleBusinessClick(business)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RecommendationsPage;
