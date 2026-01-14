// Get user's location and country information
export async function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocode to get country information
          const countryInfo = await reverseGeocode(latitude, longitude);
          
          resolve({
            lat: latitude,
            lng: longitude,
            country_code: countryInfo.country_code,
            country_name: countryInfo.country_name
          });
        } catch (error) {
          // If reverse geocoding fails, still return coordinates
          resolve({
            lat: latitude,
            lng: longitude,
            country_code: null,
            country_name: null
          });
        }
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

// Reverse geocode coordinates to get country
async function reverseGeocode(lat, lng) {
  try {
    // Using a free reverse geocoding API (Nominatim from OpenStreetMap)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=3&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'InternetMoodGlobe/1.0'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Reverse geocoding failed');
    }
    
    const data = await response.json();
    const address = data.address || {};
    
    // Extract country code and name
    const countryCode = address.country_code?.toUpperCase() || null;
    const countryName = address.country || null;
    
    return {
      country_code: countryCode,
      country_name: countryName
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    throw error;
  }
}

// Request location permission
export async function requestLocationPermission() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(false);
      return;
    }

    // Check if permission was previously granted/denied
    navigator.permissions?.query({ name: 'geolocation' }).then((result) => {
      if (result.state === 'granted') {
        resolve(true);
      } else if (result.state === 'prompt') {
        // Will prompt user
        resolve(true);
      } else {
        resolve(false);
      }
    }).catch(() => {
      // Permissions API not supported, try anyway
      resolve(true);
    });
  });
}
