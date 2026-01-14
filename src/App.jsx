import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import GlobeView from './components/GlobeView';
import CountryTooltip from './components/CountryTooltip';
import MoodSelector from './components/MoodSelector';
import LocationPermissionModal from './components/LocationPermissionModal';
import { fetchMoodData } from './utils/fetchData';
import { getUserLocation, requestLocationPermission } from './utils/geolocation';
import { submitMood } from './utils/submitMood';
import './App.css';

function App() {
  const [rawData, setRawData] = useState([]);
  const [countriesGeoJSON, setCountriesGeoJSON] = useState(null);
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);
  const [globalDominantMood, setGlobalDominantMood] = useState('😊');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  // Fetch countries GeoJSON - Load from reliable CDN with ISO codes
  useEffect(() => {
    console.log('🌍 Loading GeoJSON...');
    
    // Use GeoJSON source that has ISO_A2 codes
    const loadGeoJSON = async () => {
      // This source has ISO_A2 codes
      const url = 'https://raw.githubusercontent.com/hjnilsson/country-boundaries/master/geojson/countries.geojson';
      
      try {
        console.log(`🌍 Loading from: ${url}`);
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        
        if (data && data.features && data.features.length > 0) {
          console.log(`🌍 ✅ Successfully loaded GeoJSON with ${data.features.length} features`);
          console.log('🌍 Sample feature properties:', data.features[0]?.properties);
          setCountriesGeoJSON(data);
        } else {
          console.error('🌍 ❌ GeoJSON has no features');
        }
      } catch (err) {
        console.error('🌍 ❌ Error loading GeoJSON:', err);
        // Try fallback with name-to-code mapping
        try {
          const fallbackUrl = 'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson';
          console.log(`🌍 Trying fallback: ${fallbackUrl}`);
          const res = await fetch(fallbackUrl);
          const data = await res.json();
          if (data && data.features && data.features.length > 0) {
            console.log(`🌍 ✅ Loaded from fallback with ${data.features.length} features (will use name mapping)`);
            setCountriesGeoJSON(data);
          }
        } catch (fallbackErr) {
          console.error('🌍 ❌ Fallback also failed:', fallbackErr);
        }
      }
    };
    
    loadGeoJSON();
  }, []);

  // Check location permission on mount
  useEffect(() => {
    const checkPermission = async () => {
      const hasPermission = await requestLocationPermission();
      const permissionStatus = localStorage.getItem('locationPermission');
      
      if (permissionStatus === 'denied') {
        setLocationPermissionGranted(false);
        setShowLocationModal(false);
      } else if (permissionStatus === 'granted' || hasPermission) {
        setLocationPermissionGranted(true);
        setShowLocationModal(false);
        // Try to get location if permission was previously granted
        try {
          const location = await getUserLocation();
          setUserLocation(location);
        } catch (error) {
          console.error('Error getting location:', error);
        }
      } else {
        // Show modal to request permission
        setShowLocationModal(true);
      }
    };

    checkPermission();
  }, []);

  // Fetch mood data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await fetchMoodData();
        setRawData(data);
      } catch (error) {
        console.error('Error loading mood data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Poll every 120 seconds
    const interval = setInterval(loadData, 120000);
    return () => clearInterval(interval);
  }, []);

  // Calculate global dominant mood
  useEffect(() => {
    if (rawData.length === 0) return;

    const moodCounts = {};
    rawData.forEach(row => {
      moodCounts[row.mood] = (moodCounts[row.mood] || 0) + 1;
    });

    let maxCount = 0;
    let dominant = '😊';
    Object.entries(moodCounts).forEach(([mood, count]) => {
      if (count > maxCount) {
        maxCount = count;
        dominant = mood;
      }
    });

    setGlobalDominantMood(dominant);
  }, [rawData]);

  // Handle mouse movement for tooltip positioning
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleLocationGrant = async () => {
    try {
      const location = await getUserLocation();
      setUserLocation(location);
      setLocationPermissionGranted(true);
      setShowLocationModal(false);
      localStorage.setItem('locationPermission', 'granted');
    } catch (error) {
      console.error('Error getting location:', error);
      alert('Unable to get your location. You can still submit moods, but they won\'t be associated with a country.');
      setShowLocationModal(false);
      localStorage.setItem('locationPermission', 'denied');
    }
  };

  const handleLocationDeny = () => {
    setShowLocationModal(false);
    setLocationPermissionGranted(false);
    localStorage.setItem('locationPermission', 'denied');
  };

  const handleMoodSelect = async (mood) => {
    if (submitting) return;

    setSubmitting(true);
    setSubmitStatus(null);

    try {
      // Get location if we don't have it yet
      let location = userLocation;
      if (!location && locationPermissionGranted) {
        try {
          location = await getUserLocation();
          setUserLocation(location);
        } catch (error) {
          console.error('Error getting location:', error);
        }
      }

      // If no location, use default values
      const locationData = location || {
        lat: 0,
        lng: 0,
        country_code: null,
        country_name: null
      };

      // Submit mood
      const result = await submitMood(mood, locationData);
      
      if (result.success) {
        setSubmitStatus({ type: 'success', message: 'Mood submitted! 🌍' });
        
        // Refresh data after a short delay
        setTimeout(async () => {
          try {
            const data = await fetchMoodData();
            setRawData(data);
          } catch (error) {
            console.error('Error refreshing data:', error);
          }
        }, 2000);
      } else {
        setSubmitStatus({ type: 'error', message: 'Failed to submit. Please try again.' });
      }
    } catch (error) {
      console.error('Error submitting mood:', error);
      setSubmitStatus({ type: 'error', message: 'Error submitting mood. Please try again.' });
    } finally {
      setSubmitting(false);
      // Clear status after 3 seconds
      setTimeout(() => setSubmitStatus(null), 3000);
    }
  };

  const totalSubmissions = rawData.length;
  const uniqueCountries = useMemo(() => {
    const countries = new Set(rawData.map(r => r.country_code).filter(Boolean));
    return countries.size;
  }, [rawData]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      {/* Header */}
      <header className="relative z-30 p-6">
        <h1 className="text-3xl md:text-4xl font-bold text-center">
          Internet Mood Globe
        </h1>
      </header>

      {/* Hero Text */}
      <div className="relative z-30 text-center mb-4">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl md:text-3xl font-semibold"
        >
          Right now, the world feels {globalDominantMood}
        </motion.h2>
      </div>

      {/* Globe Container */}
      <div className="relative w-full h-[calc(100vh-280px)] md:h-[calc(100vh-200px)]">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full"
            />
          </div>
        ) : (
          <GlobeView
            rawData={rawData}
            countriesGeoJSON={countriesGeoJSON}
            onCountryHover={setHoveredCountry}
          />
        )}
      </div>

      {/* Tooltip */}
      <CountryTooltip countryData={hoveredCountry} mousePosition={mousePosition} />

      {/* Location Permission Modal */}
      <LocationPermissionModal
        isOpen={showLocationModal}
        onGrant={handleLocationGrant}
        onDeny={handleLocationDeny}
      />

      {/* Mood Selector */}
      <MoodSelector 
        onMoodSelect={handleMoodSelect}
        submitting={submitting}
        submitStatus={submitStatus}
      />

      {/* Stats Footer */}
      <footer className="relative z-30 p-4 text-center text-sm text-white/70">
        <div className="flex flex-wrap justify-center gap-6">
          <div>
            <span className="font-semibold">{totalSubmissions.toLocaleString()}</span> submissions
          </div>
          <div>
            <span className="font-semibold">{uniqueCountries}</span> countries
          </div>
          <div>
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
