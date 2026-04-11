import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchAPI } from '../api';
import BusinessCard from '../components/BusinessCard';
import ResultsTable from '../components/ResultsTable';
import './SearchPage.css';

function SearchPage({ setError }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState('cards'); // 'table' or 'cards'


  const handleSimpleTextSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await searchAPI.search(query, page, 20);      setResults(response.data.businesses || response.data);
      setPage(1);
    } catch (err) {
      setError('Search failed: ' + (err.response?.data?.error || err.message));
      setResults([]);
    } finally {
      setLoading(false);
    }
  };


  const handleBusinessClick = (business) => {
    navigate(`/business/${business.id || business._id}`);
  };

  return (
    <div className="search-page container">
      <div className="search-header">
        <h1>🔍 Search Businesses</h1>
        <p>Find and explore businesses using advanced filters</p>
      </div>

      {/* Unified Search Form */}
      <form onSubmit={handleSimpleTextSearch} className="search-form">
        <div className="form-row">
          <input
            type="text"
            placeholder="Search businesses by name, category, or location (e.g., Barbershop in London)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-input-large"
          />
          <button type="submit" className="button" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>


      {/* Results Section */}
      <div className="search-results">
        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Searching for businesses...</p>
          </div>
        )}

        {!loading && results.length === 0 && query && (
          <div className="no-results">
            <p>❌ No businesses found matching your search criteria.</p>
            <p className="sub-text">Try adjusting your filters or search terms</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="results-section">
            <div className="results-toolbar">
              <p className="results-count">Found {results.length} businesses</p>
              <div className="view-toggle">
                <button
                  className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                  onClick={() => setViewMode('table')}
                >
                  📊 Table View
                </button>
                <button
                  className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`}
                  onClick={() => setViewMode('cards')}
                >
                  🎴 Card View
                </button>
              </div>
            </div>

            {viewMode === 'table' ? (
              <ResultsTable businesses={results} onRowClick={handleBusinessClick} />
            ) : (
              <div className="grid">
                {results.map((business) => (
                  <BusinessCard
                    key={business.id || business._id}
                    business={business}
                    onClick={() => handleBusinessClick(business)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchPage;
