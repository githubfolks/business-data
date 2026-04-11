import React from 'react';
import './BusinessCard.css';

function BusinessCard({ business, onClick }) {
  const { 
    name, 
    status, 
    category, 
    subcategories, 
    street, 
    city, 
    rating, 
    review_count, 
    phone_numbers, 
    website,
    attributes 
  } = business;

  const displayRating = typeof rating === 'number' ? rating.toFixed(1) : (attributes?.google_rating ? attributes.google_rating.toFixed(1) : 'N/A');
  const photoUrl = attributes?.photos && attributes.photos.length > 0 ? attributes.photos[0].url : null;

  return (
    <div className="business-card" onClick={onClick}>
      <div className="card-image-placeholder">
        {photoUrl ? (
          <img src={photoUrl} alt={name} className="card-img" />
        ) : (
          <div className="category-icon">{category?.charAt(0) || 'B'}</div>
        )}
        <div className={`card-status ${status || 'active'}`}>
          {status || 'Active'}
        </div>
      </div>

      <div className="card-content">
        <div className="card-header">
          <h3 className="card-title text-truncate">{name}</h3>
          <p className="card-category">{category}</p>
        </div>
        
        <div className="card-info">
          <div className="info-item">
            <span className="info-icon">📍</span>
            <span className="info-text text-truncate">{street}{city ? `, ${city}` : ''}</span>
          </div>
          
          <div className="card-stats">
            <div className="rating-pill">
              <span className="star">⭐</span>
              <span className="rating-value">{displayRating}</span>
            </div>
            <span className="review-count">({review_count || 0} reviews)</span>
          </div>
        </div>

        <div className="card-footer">
          {phone_numbers && phone_numbers.length > 0 && (
            <span className="footer-item" title={phone_numbers[0]}>📞 {phone_numbers[0]}</span>
          )}
          {website && (
            <span className="footer-item link">🌐 Website</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default BusinessCard;
