// Country center coordinates for label placement
// This is a simplified version - you may want to use a more comprehensive dataset
export const countryCenters = {
  'US': { lat: 39.8283, lng: -98.5795 },
  'CA': { lat: 56.1304, lng: -106.3468 },
  'GB': { lat: 55.3781, lng: -3.4360 },
  'DE': { lat: 51.1657, lng: 10.4515 },
  'FR': { lat: 46.2276, lng: 2.2137 },
  'IT': { lat: 41.8719, lng: 12.5674 },
  'ES': { lat: 40.4637, lng: -3.7492 },
  'NL': { lat: 52.1326, lng: 5.2913 },
  'BE': { lat: 50.5039, lng: 4.4699 },
  'CH': { lat: 46.8182, lng: 8.2275 },
  'AT': { lat: 47.5162, lng: 14.5501 },
  'SE': { lat: 60.1282, lng: 18.6435 },
  'NO': { lat: 60.4720, lng: 8.4689 },
  'DK': { lat: 56.2639, lng: 9.5018 },
  'FI': { lat: 61.9241, lng: 25.7482 },
  'PL': { lat: 51.9194, lng: 19.1451 },
  'CZ': { lat: 49.8175, lng: 15.4730 },
  'GR': { lat: 39.0742, lng: 21.8243 },
  'PT': { lat: 39.3999, lng: -8.2245 },
  'IE': { lat: 53.4129, lng: -8.2439 },
  'JP': { lat: 36.2048, lng: 138.2529 },
  'CN': { lat: 35.8617, lng: 104.1954 },
  'IN': { lat: 20.5937, lng: 78.9629 },
  'KR': { lat: 35.9078, lng: 127.7669 },
  'AU': { lat: -25.2744, lng: 133.7751 },
  'NZ': { lat: -40.9006, lng: 174.8860 },
  'BR': { lat: -14.2350, lng: -51.9253 },
  'MX': { lat: 23.6345, lng: -102.5528 },
  'AR': { lat: -38.4161, lng: -63.6167 },
  'CL': { lat: -35.6751, lng: -71.5430 },
  'CO': { lat: 4.5709, lng: -74.2973 },
  'ZA': { lat: -30.5595, lng: 22.9375 },
  'EG': { lat: 26.0975, lng: 30.0444 },
  'NG': { lat: 9.0820, lng: 8.6753 },
  'KE': { lat: -0.0236, lng: 37.9062 },
  'RU': { lat: 61.5240, lng: 105.3188 },
  'TR': { lat: 38.9637, lng: 35.2433 },
  'SA': { lat: 23.8859, lng: 45.0792 },
  'AE': { lat: 23.4241, lng: 53.8478 },
  'IL': { lat: 31.0461, lng: 34.8516 },
  'TH': { lat: 15.8700, lng: 100.9925 },
  'VN': { lat: 14.0583, lng: 108.2772 },
  'PH': { lat: 12.8797, lng: 121.7740 },
  'ID': { lat: -0.7893, lng: 113.9213 },
  'MY': { lat: 4.2105, lng: 101.9758 },
  'SG': { lat: 1.3521, lng: 103.8198 },
  'PK': { lat: 30.3753, lng: 69.3451 },
  'BD': { lat: 23.6850, lng: 90.3563 },
};

// Helper to get country center from GeoJSON if available
export function getCountryCenterFromGeoJSON(countryCode, geoJSON) {
  if (!geoJSON || !geoJSON.features) return countryCenters[countryCode] || { lat: 0, lng: 0 };
  
  const feature = geoJSON.features.find(f => 
    f.properties?.ISO_A2 === countryCode || 
    f.properties?.ISO_A3 === countryCode ||
    f.properties?.ISO_A2_EH === countryCode
  );
  
  if (!feature || !feature.geometry) {
    return countryCenters[countryCode] || { lat: 0, lng: 0 };
  }
  
  // Calculate centroid of polygon
  const coords = feature.geometry.coordinates[0];
  let latSum = 0;
  let lngSum = 0;
  let count = 0;
  
  coords.forEach(coord => {
    if (Array.isArray(coord[0])) {
      // Multi-polygon or nested structure
      coord.forEach(c => {
        lngSum += c[0];
        latSum += c[1];
        count++;
      });
    } else {
      lngSum += coord[0];
      latSum += coord[1];
      count++;
    }
  });
  
  return {
    lat: latSum / count,
    lng: lngSum / count
  };
}
