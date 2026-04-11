import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { searchAPI, recommendationsAPI } from '../api';
import BusinessCard from '../components/BusinessCard';
import './BusinessDetailPage.css';

function BusinessDetailPage({ setError }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [business, setBusiness] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [competitors, setCompetitors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [businessRes, similarRes, competitorsRes] = await Promise.all([
          searchAPI.getBusinessById(id),
          recommendationsAPI.getSimilar(id, 5),
          recommendationsAPI.getCompetitors(id, 5),
        ]);
        setBusiness(businessRes.data);
        setSimilar(similarRes.data.recommendations || []);
        setCompetitors(competitorsRes.data.recommendations || []);
      } catch (err) {
        setError('Failed to load business: ' + (err.response?.data?.error || err.message));
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, setError]);

  if (loading) return <div className="loading">Loading business details...</div>;
  if (!business) return <div className="error">Business not found</div>;

  return (
    <div className="business-detail-page container">
      <button className="back-button" onClick={() => navigate(-1)}>← Back</button>

      <div className="business-detail">
        <div className="detail-header">
          <h1>{business.name}</h1>
          <span className={`status-badge ${business.status}`}>{business.status}</span>
        </div>

        <div className="detail-content">
          <div className="detail-main">
            <div className="detail-section">
              <h2>Overview</h2>
              <div className="info-grid">
                <div className="info-item">
                  <label>Category</label>
                  <p>{business.category}</p>
                </div>
                <div className="info-item">
                  <label>Rating</label>
                  <p>⭐ {business.rating || 'N/A'} ({business.review_count} reviews)</p>
                </div>
                <div className="info-item">
                  <label>Provider</label>
                  <p>{business.provider || 'Unknown'}</p>
                </div>
                <div className="info-item">
                  <label>Status</label>
                  <p>{business.status}</p>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h2>Location</h2>
              <p>{business.address?.street}</p>
              <p>{business.address?.city}, {business.address?.state} {business.address?.postal_code}</p>
              <p>{business.address?.country}</p>
            </div>

            <div className="detail-section">
              <h2>Contact</h2>
              {business.phone_numbers && business.phone_numbers.length > 0 && (
                <p>📞 {business.phone_numbers.join(', ')}</p>
              )}
              {business.website && (
                <p>
                  🌐{' '}
                  <a href={business.website} target="_blank" rel="noopener noreferrer">
                    {business.website}
                  </a>
                </p>
              )}
              {business.email && <p>✉️ {business.email}</p>}
            </div>

            {business.description && (
              <div className="detail-section">
                <h2>Description</h2>
                <p>{business.description}</p>
              </div>
            )}

            {business.opening_hours && (
              <div className="detail-section">
                <h2>Hours</h2>
                <pre>{JSON.stringify(business.opening_hours, null, 2)}</pre>
              </div>
            )}
          </div>

          <div className="detail-sidebar">
            <div className="sidebar-card">
              <h3>Quick Stats</h3>
              <div className="stat">
                <span className="stat-label">Reviews</span>
                <span className="stat-value">{business.review_count || 0}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Rating</span>
                <span className="stat-value">{business.rating || 'N/A'}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Last Synced</span>
                <span className="stat-value">{new Date(business.last_synced).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {similar.length > 0 && (
        <div className="related-section">
          <h2>Similar Businesses</h2>
          <div className="grid">
            {similar.map((biz) => (
              <BusinessCard
                key={biz._id}
                business={biz}
                onClick={() => navigate(`/business/${biz._id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {competitors.length > 0 && (
        <div className="related-section">
          <h2>Competitors</h2>
          <div className="grid">
            {competitors.map((biz) => (
              <BusinessCard
                key={biz._id}
                business={biz}
                onClick={() => navigate(`/business/${biz._id}`)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default BusinessDetailPage;
