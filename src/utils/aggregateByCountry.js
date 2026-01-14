import { countryCenters as fallbackCenters } from './countryCenters';

export function aggregateByCountry(rows, countryCenters) {
  const map = {};

  rows.forEach(r => {
    // Normalize country code
    const countryCode = r.country_code ? r.country_code.toUpperCase().trim() : null;
    if (!countryCode) return; // Skip rows without country code
    
    if (!map[countryCode]) {
      // Try countryCenters from GeoJSON first, then fallback to hardcoded centers
      const center = countryCenters[countryCode] || 
                     countryCenters[countryCode.toLowerCase()] ||
                     fallbackCenters[countryCode] ||
                     fallbackCenters[countryCode.toLowerCase()] ||
                     { lat: r.lat || 0, lng: r.lng || 0 };
      
      map[countryCode] = {
        country: r.country_name || countryCode,
        lat: center.lat || (r.lat || 0),
        lng: center.lng || (r.lng || 0),
        total: 0,
        moods: {}
      };
    }

    map[countryCode].total++;
    const mood = r.mood || '';
    map[countryCode].moods[mood] = (map[countryCode].moods[mood] || 0) + 1;
  });

  Object.values(map).forEach(c => {
    c.percentages = {};
    let maxMood = null;
    let maxPct = 0;

    Object.entries(c.moods).forEach(([mood, count]) => {
      const pct = +(count / c.total * 100).toFixed(1);
      c.percentages[mood] = pct;

      if (pct > maxPct) {
        maxPct = pct;
        maxMood = mood;
      }
    });

    c.dominantMood = maxMood;
    c.dominantPercent = maxPct;
  });

  return map;
}
