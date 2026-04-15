import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
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
      const { data, error } = await supabase
        .from('stores')
        .select('*');

      if (error || !data || data.length === 0) {
        setStores(MOCK_STORES);
      } else {
        setStores(data);
      }
    } catch (err) {
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
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.titleWrapper}>
            <h2 style={styles.title}>
                {recipeFilter ? `Sourcing for ${recipeFilter.title}` : 'Ingredient Hubs'}
            </h2>
            {recipeFilter && (
                <span style={styles.regionHighlight}>
                    Highlighted Region: {recipeFilter.categories?.region || 'Traditional Heritage'}
                </span>
            )}
        </div>
        <div style={styles.searchControls}>
          <input 
            type="text" 
            placeholder="Search stores or ingredients..." 
            style={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div style={styles.locationSearchWrapper}>
            <input 
              type="text" 
              placeholder="City/Country..." 
              style={styles.locationInput}
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch()}
            />
            <button 
              onClick={handleLocationSearch}
              style={styles.searchButton}
              disabled={searchingLocation}
            >
              {searchingLocation ? '...' : '🔍'}
            </button>
          </div>
        </div>
      </div>

      <div style={styles.contentLayout}>
        <div style={styles.listSection}>
          {sortedStores.length > 0 ? sortedStores.map(store => {
            const distance = userLocation 
              ? getDistance(userLocation.latitude, userLocation.longitude, store.latitude, store.longitude).toFixed(1)
              : null;

            return (
              <div 
                key={store.id} 
                style={styles.storeCard}
                onClick={() => {
                    setMapCenter([store.latitude, store.longitude]);
                    setMapZoom(15);
                }}
              >
                <img src={store.image_url} alt={store.name} style={styles.storeImg} />
                <div style={styles.storeInfo}>
                  <h3 style={styles.storeName}>{store.name}</h3>
                  <p style={styles.storeAddress}>📍 {store.address}</p>
                  {distance && <span style={styles.distanceBadge}>{distance} km away</span>}
                  <div style={styles.tagsContainer}>
                    {store.specialty_ingredients.slice(0, 3).map((ing, i) => (
                      <span key={i} style={styles.tag}>{ing}</span>
                    ))}
                  </div>
                </div>
              </div>
            );
          }) : (
            <div style={styles.noResults}>
                No stores found matching your criteria.
            </div>
          )}
        </div>

        <div style={styles.mapSection}>
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

const styles = {
  container: { width: '100%', padding: '20px', boxSizing: 'border-box' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' },
  titleWrapper: { display: 'flex', flexDirection: 'column', gap: '5px' },
  title: { fontSize: '2rem', fontFamily: 'Playfair Display', margin: 0, color: '#1A120B' },
  regionHighlight: { fontSize: '0.9rem', color: '#E2725B', fontWeight: 'bold' },
  searchControls: { display: 'flex', gap: '10px', flex: '1', maxWidth: '700px', flexWrap: 'wrap' },
  searchInput: { padding: '12px 20px', borderRadius: '15px', border: '1px solid #EBE5DF', flex: '1.5', minWidth: '200px', fontSize: '0.9rem' },
  locationSearchWrapper: { display: 'flex', flex: '1', minWidth: '180px' },
  locationInput: { padding: '12px 15px', borderRadius: '15px 0 0 15px', border: '1px solid #EBE5DF', borderRight: 'none', flex: '1', fontSize: '0.9rem' },
  searchButton: { padding: '12px 15px', borderRadius: '0 15px 15px 0', border: '1px solid #EBE5DF', background: 'white', cursor: 'pointer' },
  contentLayout: { display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '30px', height: '70vh', minHeight: '500px' },
  listSection: { overflowY: 'auto', paddingRight: '10px' },
  mapSection: { background: '#FDFCFB', borderRadius: '20px', border: '1px solid #F0EBE3', overflow: 'hidden' },
  storeCard: { display: 'flex', gap: '15px', background: 'white', padding: '15px', borderRadius: '20px', marginBottom: '15px', cursor: 'pointer', border: '1px solid #F0EBE3', transition: 'transform 0.2s ease' },
  storeImg: { width: '80px', height: '80px', borderRadius: '15px', objectFit: 'cover' },
  storeInfo: { display: 'flex', flexDirection: 'column', gap: '5px' },
  storeName: { margin: 0, fontSize: '1.1rem', color: '#1A120B' },
  storeAddress: { margin: 0, fontSize: '0.85rem', color: '#666' },
  distanceBadge: { background: '#E2725B', color: 'white', padding: '2px 8px', borderRadius: '8px', fontSize: '0.75rem', alignSelf: 'flex-start', fontWeight: 'bold' },
  tagsContainer: { display: 'flex', gap: '5px', marginTop: '5px', flexWrap: 'wrap' },
  tag: { background: '#FDFCFB', border: '1px solid #F0EBE3', padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', color: '#5C4033' },
  noResults: { textAlign: 'center', padding: '40px', color: '#666', background: '#FDFCFB', borderRadius: '20px', border: '1px dashed #DDD' },
  '@media (max-width: 900px)': {
    contentLayout: { gridTemplateColumns: '1fr' },
    mapSection: { height: '400px' }
  }
};