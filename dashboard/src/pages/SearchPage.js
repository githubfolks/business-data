import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchAPI } from '../api';
import ResultsTable from '../components/ResultsTable';
import MapComponent from '../components/MapComponent';
import BusinessDetailModal from '../components/BusinessDetailModal';
import './SearchPage.css';

function SearchPage({ setError }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedBusinessId, setSelectedBusinessId] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);
    try {
      const response = await searchAPI.externalSearch(query, 20);
      setResults(response.data.businesses || []);
    } catch (err) {
      setError('Search failed: ' + (err.response?.data?.error || err.message));
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessClick = (business) => {
    setSelectedBusinessId(business.id || business.external_id);
  };

  return (
    <div className="search-page-new">
      <div className="search-top-bar">
        <div className="container">
          <form onSubmit={handleSearch} className="search-form-inline">
            <input
              type="text"
              placeholder="E.g., barbershop in 35213..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-button" disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>
      </div>

      <div className="search-content-split">
        <div className="map-panel">
          <MapComponent 
            businesses={results} 
            onBusinessClick={handleBusinessClick} 
          />
        </div>
        
        <div className="results-panel">
          {loading ? (
            <div className="panel-loading">
              <div className="spinner"></div>
              <p>Fetching real-time results...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="panel-results">
              <div className="results-info">
                Found {results.length} businesses matching your search.
              </div>
              <ResultsTable 
                businesses={results} 
                onRowClick={handleBusinessClick} 
              />
            </div>
          ) : hasSearched ? (
            <div className="panel-empty">
              <h3>No results found</h3>
              <p>Try searching for something else, like "coffee shop in Downtown".</p>
            </div>
          ) : (
            <div className="panel-welcome">
              <h3>Ready to search?</h3>
              <p>Enter a business type and location above to see real-time results on the map and in the table.</p>
            </div>
          )}
        </div>
      </div>

      <BusinessDetailModal 
        businessId={selectedBusinessId} 
        onClose={() => setSelectedBusinessId(null)} 
      />
    </div>
  );
}

export default SearchPage;
