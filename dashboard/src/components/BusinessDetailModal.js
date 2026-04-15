import React, { useEffect, useState } from 'react';
import { searchAPI } from '../api';
import './BusinessDetailModal.css';

function BusinessDetailModal({ businessId, onClose }) {
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchDetails() {
      if (!businessId) return;
      
      setLoading(true);
      setError(null);
      try {
        const response = await searchAPI.getBusinessById(businessId);
        setBusiness(response.data);
      } catch (err) {
        console.error('Failed to fetch business details:', err);
        setError('Could not load detailed information. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchDetails();
  }, [businessId]);

  if (!businessId) return null;

  const handleOverlayClick = (e) => {
    if (e.target.className === 'modal-overlay') {
      onClose();
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="loading-modal-state">
          <div className="spinner-large"></div>
          <p>Fetching real-time details...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="loading-modal-state">
          <div className="error-icon">⚠️</div>
          <p>{error}</p>
          <button onClick={onClose} className="detail-website-btn">Close</button>
        </div>
      );
    }

    if (!business) return null;

    const { 
      name, 
      category, 
      rating, 
      review_count, 
      street, 
      city, 
      state, 
      postal_code, 
      country,
      phone_numbers,
      website,
      opening_hours,
      attributes
    } = business;

    const photoUrl = attributes?.photos && attributes.photos.length > 0 ? attributes.photos[0].url : null;

    return (
      <>
        <div className="detail-hero">
          {photoUrl ? (
            <img src={photoUrl} alt={name} className="detail-img" />
          ) : (
            <div className="detail-img-placeholder">
              {category?.charAt(0) || name?.charAt(0) || 'B'}
            </div>
          )}
          <div className="detail-header-overlay">
            <h2 className="detail-title">{name}</h2>
            <div className="detail-meta">
              <span className="detail-category">{category}</span>
              {rating && (
                <div className="detail-rating">
                  ⭐ {rating.toFixed(1)}
                </div>
              )}
              {review_count > 0 && <span>({review_count} reviews)</span>}
            </div>
          </div>
        </div>

        <div className="detail-body">
          <div className="detail-grid">
            <div className="detail-section">
              <h4 className="detail-section-title">📍 Location & Contact</h4>
              <div className="detail-item">
                <div className="item-content">
                  <h5>Address</h5>
                  <p>{street}</p>
                  <p>{city}, {state} {postal_code}</p>
                </div>
              </div>
              
              {phone_numbers && phone_numbers.length > 0 && (
                <div className="detail-item" style={{ marginTop: '15px' }}>
                  <div className="item-content">
                    <h5>Phone</h5>
                    <p>{phone_numbers[0]}</p>
                  </div>
                </div>
              )}

              {website && (
                <div className="detail-item" style={{ marginTop: '15px' }}>
                  <a href={website} target="_blank" rel="noopener noreferrer" className="detail-website-btn">
                    Visit Website ↗
                  </a>
                </div>
              )}
            </div>

            <div className="detail-section">
              <h4 className="detail-section-title">🕒 Opening Hours</h4>
              {opening_hours && opening_hours.length > 0 ? (
                <ul className="hours-list">
                  {opening_hours.map((h, i) => (
                    <li key={i} className="hour-row">
                      <span className="day-name">{getDayName(h.day_of_week)}</span>
                      <span className="day-time">{h.open} - {h.close}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: '#6b7280', fontStyle: 'italic' }}>Hours not available</p>
              )}
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content-wrapper">
        <button className="modal-close-btn" onClick={onClose} aria-label="Close">
          ×
        </button>
        {renderContent()}
      </div>
    </div>
  );
}

function getDayName(dayIndex) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return days[dayIndex] || 'Unknown';
}

export default BusinessDetailModal;
