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
  const [country, setCountry] = useState('US');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedBusinessId, setSelectedBusinessId] = useState(null);
  const [source, setSource] = useState('local');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!businessName.trim() && !pincode.trim()) {
      setError('Please enter at least a business name or a pincode.');
      return;
    }

    setLoading(true);
    setHasSearched(true);
    
    const params = {
      query: businessName || 'businesses',
      limit: 1000,
      pincode: pincode.trim() || null,
      radius: 10,
      country: country || null,
      deepSearch: true
    };

    try {
      const response = await searchAPI.externalSearch(
        params.query, 
        params.limit, 
        null, // pageToken (always null for new deep searches)
        params.pincode, 
        params.radius,
        params.country,
        params.deepSearch
      );
      setResults(response.data.businesses || []);
      setSource(response.data.source || 'google_places_realtime');
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
              <div className="input-field country-field">
                <label htmlFor="country">Target Country</label>
                <select 
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="search-input country-select"
                >
                  <option value="">Auto-Detect / World</option>
                  <option value="US">United States</option>
                  <option value="IN">India</option>
                  <option value="GB">United Kingdom</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                  <option value="IT">Italy</option>
                  <option value="ES">Spain</option>
                  <option value="AE">United Arab Emirates</option>
                  <option value="SG">Singapore</option>
                </select>
              </div>
            </div>
            
            <div className="search-form-row actions-row">
              <button type="submit" className="search-button-large" disabled={loading}>
                {loading ? 'Performing Deep Search...' : 'Start 1000-Record Search'}
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
