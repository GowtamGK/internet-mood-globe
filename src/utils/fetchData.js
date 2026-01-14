// Fetch data from Google Sheets CSV
const GOOGLE_SHEETS_CSV_URL = 'https://docs.google.com/spreadsheets/d/12sGepXa5WvUgieWpAT6d93V2uVTeT6lzlrNQ1tPGyOA/export?format=csv&gid=0';

// Fix emoji encoding issues from Google Sheets CSV export
// Google Sheets exports emojis as UTF-8 bytes interpreted as Latin-1
// Example: 😴 (UTF-8: F0 9F 98 B4) becomes "ðŸ˜´" when interpreted as Latin-1
function fixEmojiEncoding(text) {
  if (!text) return text;
  
  // Direct mapping of corrupted emoji patterns to correct emojis
  // These are the UTF-8 bytes of emojis when interpreted as Latin-1
  const emojiMap = {
    'ðŸ˜´': '😴',  // Tired - F0 9F 98 B4
    'ðŸ˜Š': '😊',  // Happy - F0 9F 98 8A
    'ðŸ˜': '😐',   // Neutral - F0 9F 98 10 (partial, might need adjustment)
    'ðŸ˜': '😞',   // Sad - F0 9F 98 9E (partial)
    'ðŸ˜¡': '😡',  // Angry - F0 9F 98 A1
    'ðŸ¤¯': '🤯',  // Overwhelmed - F0 9F A4 AF
  };
  
  // Try direct replacement first
  let fixed = text;
  Object.entries(emojiMap).forEach(([corrupted, emoji]) => {
    if (fixed.includes(corrupted)) {
      fixed = fixed.replace(corrupted, emoji);
    }
  });
  
  // If still has corrupted patterns, try byte-level fix
  if (fixed !== text || fixed.match(/[ðŸ˜¡´¤¯]/)) {
    try {
      // Convert string to bytes (treating each char as Latin-1 byte)
      // Then decode those bytes as UTF-8
      const latin1Bytes = new Uint8Array(fixed.length);
      for (let i = 0; i < fixed.length; i++) {
        latin1Bytes[i] = fixed.charCodeAt(i) & 0xFF;
      }
      
      // Decode as UTF-8
      const decoder = new TextDecoder('utf-8', { fatal: false });
      const utf8Text = decoder.decode(latin1Bytes);
      
      // Only use if it actually fixed something (contains emojis)
      if (utf8Text.match(/[\u{1F300}-\u{1F9FF}]/u) || utf8Text !== fixed) {
        fixed = utf8Text;
      }
    } catch (e) {
      console.warn('Emoji encoding fix failed:', e);
    }
  }
  
  return fixed;
}

export async function fetchMoodData() {
  try {
    const response = await fetch(GOOGLE_SHEETS_CSV_URL);
    
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }
    
    // Get the response as text - ensure we're reading as UTF-8
    const csvText = await response.text();
    
    // Fix emoji encoding issues
    const fixedCsvText = fixEmojiEncoding(csvText);
    
    return parseCSV(fixedCsvText);
  } catch (error) {
    console.error('Error fetching mood data:', error);
    // Return mock data for development
    return getMockData();
  }
}

function parseCSV(csvText) {
  if (!csvText || csvText.trim().length === 0) {
    return [];
  }

  // Ensure we're working with UTF-8 encoded text
  // Google Sheets CSV exports should be UTF-8, but sometimes encoding gets lost
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    return [];
  }

  // Parse headers - handle BOM (Byte Order Mark) if present
  const headerLine = lines[0].replace(/^\uFEFF/, ''); // Remove BOM if present
  const headers = headerLine.split(',').map(h => h.trim().toLowerCase());
  
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines
    
    // Better CSV parsing - handle quoted values and preserve emojis
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        // Handle escaped quotes ("")
        if (j + 1 < line.length && line[j + 1] === '"' && inQuotes) {
          current += '"';
          j++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current); // Add last value
    
    const row = {};
    headers.forEach((header, idx) => {
      // Map headers to expected field names
      let fieldName = header;
      if (header === 'timestamp') fieldName = 'timestamp';
      else if (header === 'mood') fieldName = 'mood';
      else if (header === 'lat') fieldName = 'lat';
      else if (header === 'lng') fieldName = 'lng';
      else if (header === 'country_code') fieldName = 'country_code';
      else if (header === 'country_name') fieldName = 'country_name';
      
      // Trim and preserve emojis - fix encoding if needed
      let value = (values[idx] || '').trim();
      
      // Fix emoji encoding for mood field specifically
      if (fieldName === 'mood' && value) {
        value = fixEmojiEncoding(value);
      }
      
      row[fieldName] = value;
    });
    
    // Skip rows without required data
    if (!row.country_code) {
      continue;
    }
    
    // Skip rows with empty mood
    if (!row.mood || row.mood.trim() === '') {
      continue;
    }
    
    // Parse timestamp
    if (row.timestamp) {
      row.timestamp = new Date(row.timestamp);
    }
    
    // Parse numeric fields
    if (row.lat) row.lat = parseFloat(row.lat);
    if (row.lng) row.lng = parseFloat(row.lng);
    
    // Ensure country_code is uppercase
    if (row.country_code) {
      row.country_code = row.country_code.toUpperCase().trim();
    }
    
    rows.push(row);
  }
  
  // Filter to last 24 hours and limit to 20k rows
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  const recentRows = rows
    .filter(r => {
      // Don't filter by timestamp if it's invalid, just include it
      if (!r.timestamp || isNaN(r.timestamp.getTime())) {
        return true; // Include rows without valid timestamps
      }
      return r.timestamp >= oneDayAgo;
    })
    .slice(0, 20000);
  
  return recentRows;
}

function getMockData() {
  // Mock data for development/testing
  const countries = [
    { code: 'US', name: 'United States', lat: 39.8283, lng: -98.5795 },
    { code: 'CA', name: 'Canada', lat: 56.1304, lng: -106.3468 },
    { code: 'GB', name: 'United Kingdom', lat: 55.3781, lng: -3.4360 },
    { code: 'DE', name: 'Germany', lat: 51.1657, lng: 10.4515 },
    { code: 'FR', name: 'France', lat: 46.2276, lng: 2.2137 },
    { code: 'JP', name: 'Japan', lat: 36.2048, lng: 138.2529 },
    { code: 'AU', name: 'Australia', lat: -25.2744, lng: 133.7751 },
    { code: 'BR', name: 'Brazil', lat: -14.2350, lng: -51.9253 },
    { code: 'IN', name: 'India', lat: 20.5937, lng: 78.9629 },
    { code: 'CN', name: 'China', lat: 35.8617, lng: 104.1954 },
  ];
  
  const moods = ['😊', '😐', '😞', '😡', '😴', '🤯'];
  
  const rows = [];
  countries.forEach(country => {
    const numSubmissions = Math.floor(Math.random() * 500) + 100;
    for (let i = 0; i < numSubmissions; i++) {
      rows.push({
        timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
        mood: moods[Math.floor(Math.random() * moods.length)],
        lat: country.lat + (Math.random() - 0.5) * 10,
        lng: country.lng + (Math.random() - 0.5) * 10,
        country_code: country.code,
        country_name: country.name
      });
    }
  });
  
  return rows;
}
