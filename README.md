# Internet Mood Globe 🌍

A static React + Vite web app that visualizes anonymous global mood data on an interactive 3D globe. Each country aggregates mood submissions into percentages, with dominant mood emojis displayed on the globe.

## Features

- ✅ 3D spinnable globe with auto-rotation
- ✅ Country hover tooltips showing mood percentage breakdown
- ✅ Dominant mood emoji + percentage rendered over each country
- ✅ Static deployment on GitHub Pages
- ✅ No backend required
- ✅ Mobile responsive

## Tech Stack

- **Frontend**: React + Vite
- **Styling**: Tailwind CSS
- **3D Globe**: react-globe.gl (Three.js)
- **Geodata**: GeoJSON (countries)
- **Animation**: Framer Motion
- **Data Store**: Google Sheets CSV (configurable)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure your Google Sheets CSV URL in `src/utils/fetchData.js`:
```javascript
const GOOGLE_SHEETS_CSV_URL = 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/export?format=csv&gid=0';
```

3. Add countries GeoJSON file to `public/countries.geojson`
   
   You can download a countries GeoJSON file from:
   - Natural Earth: https://www.naturalearthdata.com/downloads/50m-cultural-vectors/
   - Or use: https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson
   
   The file should have features with `properties.ISO_A2` (2-letter country code) and `properties.ADMIN` (country name).
   If the file is not found locally, the app will attempt to fetch from a CDN fallback.

4. Run development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
```

## Google Apps Script Setup (For Mood Submissions)

To enable mood submissions, you need to create a Google Apps Script web app:

1. **Create a Google Apps Script:**
   - Go to https://script.google.com/
   - Click "New Project"
   - Paste this code:

```javascript
// Handle GET requests (more reliable for Google Apps Script web apps)
function doGet(e) {
  try {
    // Replace with your Google Sheet ID (from the URL)
    const SHEET_ID = '12sGepXa5WvUgieWpAT6d93V2uVTeT6lzlrNQ1tPGyOA';
    
    // Open the spreadsheet
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheet = spreadsheet.getActiveSheet();
    
    // IMPORTANT: e.parameter might be undefined when testing from editor
    // This is normal! The function works when called as a web app via URL
    // Get data from URL parameters (with safety check)
    const params = e && e.parameter ? e.parameter : {};
    const data = {
      timestamp: params.timestamp || new Date().toISOString(),
      mood: params.mood ? decodeURIComponent(params.mood) : '',
      lat: parseFloat(params.lat) || 0,
      lng: parseFloat(params.lng) || 0,
      country_code: (params.country_code || '').toUpperCase(),
      country_name: params.country_name ? decodeURIComponent(params.country_name) : ''
    };
    
    // Log for debugging (check Execution log in Apps Script)
    console.log('Received data:', data);
    
    // Check if headers exist, if not add them
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['timestamp', 'mood', 'lat', 'lng', 'country_code', 'country_name']);
    }
    
    // Append row: timestamp, mood, lat, lng, country_code, country_name
    sheet.appendRow([
      data.timestamp,
      data.mood,
      data.lat,
      data.lng,
      data.country_code,
      data.country_name
    ]);
    
    // Force spreadsheet to save
    SpreadsheetApp.flush();
    
    console.log('Row appended successfully');
    
    // Return success response with CORS headers
    return ContentService.createTextOutput(JSON.stringify({ 
      success: true,
      message: 'Data saved successfully'
    }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error('Error in doGet:', error);
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      error: error.toString(),
      stack: error.stack
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Also handle POST requests (for JSON data)
function doPost(e) {
  try {
    const SHEET_ID = '12sGepXa5WvUgieWpAT6d93V2uVTeT6lzlrNQ1tPGyOA';
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheet = spreadsheet.getActiveSheet();
    
    // Parse JSON data from request (with safety check)
    const postData = e && e.postData ? e.postData : { contents: '{}' };
    const data = JSON.parse(postData.contents);
    
    // Check if headers exist, if not add them
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['timestamp', 'mood', 'lat', 'lng', 'country_code', 'country_name']);
    }
    
    // Check if headers exist, if not add them
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['timestamp', 'mood', 'lat', 'lng', 'country_code', 'country_name']);
    }
    
    // Append row
    sheet.appendRow([
      data.timestamp,
      data.mood,
      data.lat,
      data.lng,
      data.country_code || '',
      data.country_name || ''
    ]);
    
    // Force spreadsheet to save
    SpreadsheetApp.flush();
    
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error('Error in doPost:', error);
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      error: error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

2. **Deploy as Web App:**
   - Click "Deploy" → "New deployment"
   - Choose type: "Web app"
   - Execute as: "Me"
   - Who has access: "Anyone"
   - Click "Deploy"
   - Copy the Web App URL

3. **Update the URL in code:**
   - Open `src/utils/submitMood.js`
   - Replace `YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE` with your Web App URL

## Data Format

Your Google Sheets should have these columns in the first row:
- `timestamp` - ISO date string
- `mood` - Emoji (😊, 😐, 😞, 😡, 😴, 🤯)
- `lat` - Latitude
- `lng` - Longitude
- `country_code` - ISO 2-letter country code (e.g., "US", "CA")
- `country_name` - Full country name

## Deployment to GitHub Pages

1. Update `vite.config.js` base path to match your repository name:
```javascript
base: '/your-repo-name/',
```

2. Deploy:
```bash
npm run deploy
```

## License

MIT
