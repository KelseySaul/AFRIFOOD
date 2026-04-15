import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './StoresFeed.css';
import L from 'leaflet';

// Fix for Leaflet marker icons in React
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const REGION_ZONES = {
  'West Africa': { center: [9.0820, 8.6753], radius: 800000, color: '#E2725B' },
  'East Africa': { center: [1.2921, 36.8219], radius: 700000, color: '#E2725B' },
  'Southern Africa': { center: [-28.4793, 24.6727], radius: 800000, color: '#E2725B' },
  'North Africa': { center: [26.3351, 12.8510], radius: 900000, color: '#E2725B' },
  'Central Africa': { center: [-0.2280, 15.8277], radius: 700000, color: '#E2725B' }
};

// Helper to calculate distance in KM
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

// Component to recenter map
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

const MOCK_STORES = [
  {
    id: '1',
    name: 'Mama Africa Market',
    address: '123 Heritage Lane, Lagos, Nigeria',
    latitude: 6.5244,
    longitude: 3.3792,
    specialty_ingredients: ['Egusi', 'Palm Oil', 'Yam', 'Garri'],
    contact_number: '+234 800 123 4567',
    image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '2',
    name: 'Cape Town Spice Emporium',
    address: '45 Coastline Rd, Cape Town, South Africa',
    latitude: -33.9249,
    longitude: 18.4241,
    specialty_ingredients: ['Berbere', 'Harissa', 'Peri-Peri', 'Biltong Spices'],
    contact_number: '+27 21 987 6543',
    image_url: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '3',
    name: 'Nairobi Fresh & Local',
    address: '88 Savannah Ave, Nairobi, Kenya',
    latitude: -1.2921,
    longitude: 36.8219,
    specialty_ingredients: ['Sukuma Wiki', 'Maize Flour', 'Matoke', 'Royco'],
    contact_number: '+254 700 111 222',
    image_url: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '4',
    name: 'Accra Authentic Goods',
    address: '12 High St, Accra, Ghana',
    latitude: 5.6037,
    longitude: -0.1870,
    specialty_ingredients: ['Shito', 'Waakye Leaves', 'Plantain Flour', 'Kenkey'],
    contact_number: '+233 24 000 0000',
    image_url: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80'
  }
];

export default function StoresFeed({ recipeFilter }) {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([6.5244, 3.3792]); // Default to Lagos
  const [mapZoom, setMapZoom] = useState(13);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [searchingLocation, setSearchingLocation] = useState(false);

  useEffect(() => {
    fetchStores();
    if (recipeFilter && recipeFilter.categories?.region) {
      const regionData = REGION_ZONES[recipeFilter.categories.region];
      if (regionData) {
        setMapCenter(regionData.center);
        setMapZoom(5); // Zoom out to see the region
      } else {
        getUserLocation();
      }
    } else {
      getUserLocation();
    }
  }, [recipeFilter]);

  const fetchStores = async () => {
    setLoading(true);
    try {
      // Attempt to fetch from Supabase
      const { data, error } = await supabase
        .from('stores')
        .select('*');

      if (error) {
        // If table doesn't exist (404/42P01), it will catch here
        console.warn("Supabase stores fetch failed, using fallback mock data.");
        setStores(MOCK_STORES);
      } else if (!data || data.length === 0) {
        setStores(MOCK_STORES);
      } else {
        setStores(data);
      }
    } catch (err) {
      console.error("Store fetch error:", err);
      setStores(MOCK_STORES);
    } finally {
      setLoading(false);
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
          setMapCenter([latitude, longitude]);
          setMapZoom(13);
        },
        (error) => {
          console.error("Geolocation error:", error);
        }
      );
    }
  };

  const handleLocationSearch = async () => {
    if (!locationQuery.trim()) return;
    
    setSearchingLocation(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationQuery)}&limit=1`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newCoords = { latitude: parseFloat(lat), longitude: parseFloat(lon) };
        setUserLocation(newCoords);
        setMapCenter([parseFloat(lat), parseFloat(lon)]);
        setMapZoom(13);
      } else {
        alert("Location not found. Please try another search.");
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      alert("Error searching for location. Please try again.");
    } finally {
      setSearchingLocation(false);
    }
  };

  const filteredStores = stores.filter(store => {
    const matchesSearch = store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         store.specialty_ingredients.some(ing => ing.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (recipeFilter) {
        const recipeIngredients = Array.isArray(recipeFilter.ingredients) 
            ? recipeFilter.ingredients.map(i => (typeof i === 'string' ? i : i.item).toLowerCase())
            : [];
        
        const hasIngredient = store.specialty_ingredients.some(ing => 
            recipeIngredients.some(rIng => rIng.includes(ing.toLowerCase()) || ing.toLowerCase().includes(rIng))
        );
        return matchesSearch && (hasIngredient || store.address.includes(recipeFilter.categories?.region || ''));
    }

    return matchesSearch;
  });

  const sortedStores = [...filteredStores].sort((a, b) => {
    if (!userLocation) return 0;
    const distA = getDistance(userLocation.latitude, userLocation.longitude, a.latitude, a.longitude);
    const distB = getDistance(userLocation.latitude, userLocation.longitude, b.latitude, b.longitude);
    return distA - distB;
  });

  const activeRegionZone = recipeFilter && recipeFilter.categories?.region ? REGION_ZONES[recipeFilter.categories.region] : null;

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '100px', fontSize: '1.2rem', color: '#5C4033', fontFamily: 'Playfair Display' }}>
      🗺️ Locating ingredient treasures...
    </div>
  );

  return (
    <div className="stores-container">
      <div className="stores-header">
        <div className="stores-title-wrapper">
            <h2 className="stores-title">
                {recipeFilter ? `Sourcing for ${recipeFilter.title}` : 'Ingredient Hubs'}
            </h2>
            {recipeFilter && (
                <span className="region-highlight">
                    Highlighted Region: {recipeFilter.categories?.region || 'Traditional Heritage'}
                </span>
            )}
        </div>
        <div className="stores-search-controls">
          <input 
            type="text" 
            placeholder="Search stores or ingredients..." 
            className="stores-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="location-search-wrapper">
            <input 
              type="text" 
              placeholder="City/Country..." 
              className="location-input"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch()}
            />
            <button 
              onClick={handleLocationSearch}
              className="location-search-button"
              disabled={searchingLocation}
            >
              {searchingLocation ? '...' : '🔍'}
            </button>
          </div>
        </div>
      </div>

      <div className="stores-content-layout">
        <div className="stores-list-section">
          {sortedStores.length > 0 ? sortedStores.map(store => {
            const distance = userLocation 
              ? getDistance(userLocation.latitude, userLocation.longitude, store.latitude, store.longitude).toFixed(1)
              : null;

            return (
              <div 
                key={store.id} 
                className="store-card"
                onClick={() => {
                    setMapCenter([store.latitude, store.longitude]);
                    setMapZoom(15);
                }}
              >
                <img src={store.image_url} alt={store.name} className="store-img" />
                <div className="store-info">
                  <h3 className="store-name">{store.name}</h3>
                  <p className="store-address">📍 {store.address}</p>
                  {distance && <span className="distance-badge">{distance} km away</span>}
                  <div className="store-tags-container">
                    {store.specialty_ingredients.slice(0, 3).map((ing, i) => (
                      <span key={i} className="store-tag">{ing}</span>
                    ))}
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="no-results">
                No stores found matching your criteria.
            </div>
          )}
        </div>

        <div className="stores-map-section">
          <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: '100%', width: '100%', borderRadius: '20px' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ChangeView center={mapCenter} zoom={mapZoom} />
            
            {activeRegionZone && (
              <Circle 
                center={activeRegionZone.center}
                radius={activeRegionZone.radius}
                pathOptions={{ 
                    fillColor: activeRegionZone.color, 
                    color: activeRegionZone.color,
                    weight: 2,
                    fillOpacity: 0.15 
                }}
              >
                <Popup>
                    <strong>{recipeFilter.categories.region}</strong><br/>
                    Traditional source of these ingredients.
                </Popup>
              </Circle>
            )}

            {userLocation && (
              <Marker position={[userLocation.latitude, userLocation.longitude]}>
                <Popup>Your Search Location</Popup>
              </Marker>
            )}

            {sortedStores.map(store => (
              <Marker key={store.id} position={[store.latitude, store.longitude]}>
                <Popup>
                  <div style={{ textAlign: 'center' }}>
                    <strong>{store.name}</strong><br/>
                    {store.address}<br/>
                    <a href={`tel:${store.contact_number}`}>{store.contact_number}</a>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}