import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import './MapComponent.css';

const libraries = ['places'];
const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const center = {
  lat: 40.7128, // Default center (NYC) if no results
  lng: -74.006,
};

const options = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
};

function MapComponent({ businesses, onBusinessClick }) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const [selected, setSelected] = React.useState(null);
  const mapRef = useRef(null);

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  // Update map bounds when businesses change
  useEffect(() => {
    if (isLoaded && mapRef.current && businesses.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      let hasValidCoords = false;

      businesses.forEach((business) => {
        if (business.latitude && business.longitude) {
          bounds.extend({ lat: business.latitude, lng: business.longitude });
          hasValidCoords = true;
        }
      });

      if (hasValidCoords) {
        mapRef.current.fitBounds(bounds);
        // Don't zoom in too much if there's only one result
        if (businesses.length === 1) {
          mapRef.current.setZoom(15);
        }
      }
    }
  }, [isLoaded, businesses]);

  const markers = useMemo(() => 
    businesses
      .filter(b => b.latitude && b.longitude)
      .map((business) => (
        <Marker
          key={business.id || business.external_id}
          position={{ lat: business.latitude, lng: business.longitude }}
          onClick={() => {
            setSelected(business);
            if (onBusinessClick) onBusinessClick(business);
          }}
          title={business.name}
        />
      )), [businesses, onBusinessClick]);

  if (loadError) return <div className="map-error">Error loading maps</div>;
  if (!isLoaded) return <div className="map-loading">Loading Maps...</div>;

  return (
    <div className="map-container">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={12}
        center={center}
        options={options}
        onLoad={onMapLoad}
      >
        {markers}

        {selected && (
          <InfoWindow
            position={{ lat: selected.latitude, lng: selected.longitude }}
            onCloseClick={() => setSelected(null)}
          >
            <div className="info-window">
              <h4>{selected.name}</h4>
              <p>{selected.category}</p>
              <p>{selected.street}, {selected.city}</p>
              {selected.rating && (
                <div className="rating">
                  ⭐ {selected.rating} ({selected.review_count} reviews)
                </div>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}

export default MapComponent;
