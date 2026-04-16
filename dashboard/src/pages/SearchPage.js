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
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedBusinessId, setSelectedBusinessId] = useState(null);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [limit, setLimit] = useState(20);
  const [source, setSource] = useState('local');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);
    setNextPageToken(null);
    try {
      // Use external search for real-time results
      const response = await searchAPI.externalSearch(query, limit);
      setResults(response.data.businesses || []);
      setNextPageToken(response.data.next_page_token);
      setSource(response.data.source || 'google_places_realtime');
    } catch (err) {
      setError('Search failed: ' + (err.response?.data?.error || err.message));
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (!nextPageToken || loadingMore) return;

    setLoadingMore(true);
    try {
      const response = await searchAPI.externalSearch(query, limit, nextPageToken);
      const newBusinesses = response.data.businesses || [];
      setResults(prev => [...prev, ...newBusinesses]);
      setNextPageToken(response.data.next_page_token);
    } catch (err) {
      setError('Failed to load more results: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoadingMore(false);
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
            <div className="search-input-group">
              <input
                type="text"
                placeholder="E.g., barbershop in 35213..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="search-input"
              />
              <select 
                value={limit} 
                onChange={(e) => setLimit(Number(e.target.value))}
                className="limit-select"
              >
                <option value={20}>20 results</option>
                <option value={50}>50 results</option>
                <option value={100}>100 results</option>
              </select>
            </div>
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
                <span className="source-indicator">Source: {source.replace(/_/g, ' ')}</span>
                <span>Found {results.length} businesses matching your search.</span>
              </div>
              <ResultsTable 
                businesses={results} 
                onRowClick={handleBusinessClick} 
              />
              
              {nextPageToken && (
                <div className="pagination-footer">
                  <button 
                    className="load-more-button" 
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? 'Loading more...' : 'Load More Results'}
                  </button>
                </div>
              )}
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
