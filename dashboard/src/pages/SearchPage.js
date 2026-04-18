import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchAPI } from '../api';
import ResultsTable from '../components/ResultsTable';
import MapComponent from '../components/MapComponent';
import BusinessDetailModal from '../components/BusinessDetailModal';
import './SearchPage.css';

function SearchPage({ setError }) {
  const navigate = useNavigate();
  const [businessName, setBusinessName] = useState('');
  const [pincode, setPincode] = useState('');
  const [radius, setRadius] = useState(5);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedBusinessId, setSelectedBusinessId] = useState(null);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [limit, setLimit] = useState(20);
  const [source, setSource] = useState('local');
  
  // Track last used search params for "Load More"
  const [lastSearchParams, setLastSearchParams] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!businessName.trim() && !pincode.trim()) {
      setError('Please enter at least a business name or a pincode.');
      return;
    }

    setLoading(true);
    setHasSearched(true);
    setNextPageToken(null);
    
    const params = {
      query: businessName || 'businesses', // Fallback if name is empty
      limit,
      pincode: pincode.trim() || null,
      radius: radius
    };
    
    setLastSearchParams(params);

    try {
      const response = await searchAPI.externalSearch(
        params.query, 
        params.limit, 
        null, 
        params.pincode, 
        params.radius
      );
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
    if (!nextPageToken || loadingMore || !lastSearchParams) return;

    setLoadingMore(true);
    try {
      const response = await searchAPI.externalSearch(
        lastSearchParams.query, 
        lastSearchParams.limit, 
        nextPageToken,
        lastSearchParams.pincode,
        lastSearchParams.radius
      );
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
          <form onSubmit={handleSearch} className="search-form-complex">
            <div className="search-form-row">
              <div className="input-field">
                <label htmlFor="businessName">Business Name / Category</label>
                <input
                  id="businessName"
                  type="text"
                  placeholder="E.g., Pizza, Barbershop..."
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="search-input"
                />
              </div>
              <div className="input-field pincode-field">
                <label htmlFor="pincode">Pincode (Optional)</label>
                <input
                  id="pincode"
                  type="text"
                  placeholder="E.g., 35213"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>
            
            <div className="search-form-row secondary-row">
              <div className="input-field range-field">
                <label htmlFor="radius">Search Range: <span className="range-value">{radius} km</span></label>
                <input
                  id="radius"
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="range-slider"
                />
              </div>
              
              <div className="input-field limit-field">
                <label htmlFor="limit">Display</label>
                <select 
                  id="limit"
                  value={limit} 
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="limit-select"
                >
                  <option value={20}>20 results</option>
                  <option value={50}>50 results</option>
                  <option value={100}>100 results</option>
                </select>
              </div>

              <button type="submit" className="search-button-large" disabled={loading}>
                {loading ? 'Searching...' : 'Search Places'}
              </button>
            </div>
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
              <p>Try searching for something else, like "coffee shop" with a wider range.</p>
            </div>
          ) : (
            <div className="panel-welcome">
              <h3>Find Businesses Nearby</h3>
              <p>Enter a business name and pincode to discover places around you within your preferred range.</p>
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
