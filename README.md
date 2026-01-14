# Internet Mood Globe 🌍

A static React + Vite web app that visualizes anonymous global mood data on an interactive 3D globe. Each country aggregates mood submissions into percentages, with dominant mood emojis displayed on the globe.

## Project Architecture

### Tech Stack

- **Frontend**: React 18 with Hooks (useState, useEffect, useMemo)
- **Build Tool**: Vite 4.5.3
- **Styling**: Tailwind CSS
- **3D Globe**: react-globe.gl (Three.js wrapper)
- **Geodata**: GeoJSON (fetched from CDN)
- **Animation**: Framer Motion
- **Data Source**: Google Sheets CSV export
- **Submission Backend**: Google Apps Script (serverless)

## Project Structure

```
internet-mood-globe/
├── src/
│   ├── App.jsx                    # Main application component (orchestrator)
│   ├── main.jsx                   # React entry point
│   ├── components/
│   │   ├── GlobeView.jsx          # 3D globe rendering and interaction
│   │   ├── CountryTooltip.jsx     # Hover tooltip with mood breakdown
│   │   ├── MoodSelector.jsx        # Bottom emoji selector tray
│   │   └── LocationPermissionModal.jsx  # Location permission request
│   └── utils/
│       ├── fetchData.js           # CSV fetching and parsing
│       ├── aggregateByCountry.js  # Country-level data aggregation
│       ├── submitMood.js          # Mood submission to Google Apps Script
│       ├── geolocation.js         # Browser geolocation API wrapper
│       ├── moodConfig.js          # Mood definitions (emojis, labels, colors)
│       ├── countryCenters.js      # Hardcoded country center coordinates
│       └── countryNameToCode.js   # Country name → ISO code mapping
├── public/
│   └── countries.geojson          # (Optional) Local GeoJSON file
└── vite.config.js                 # Vite configuration (base path for GitHub Pages)
```

## Data Flow

### 1. Data Fetching (`src/utils/fetchData.js`)

The app fetches raw mood submissions from a Google Sheets CSV export:

```javascript
// Raw data structure (from CSV)
{
  timestamp: "2026-01-14T01:09:15.118Z",
  mood: "😴",
  lat: 49.28,
  lng: -123.12,
  country_code: "CA",
  country_name: "Canada"
}
```

**Key Functions:**
- `fetchMoodData()`: Fetches CSV from Google Sheets, handles emoji encoding issues
- `parseCSV()`: Parses CSV text into structured objects, filters to last 24 hours
- `fixEmojiEncoding()`: Fixes corrupted emoji encoding from CSV export (UTF-8 → Latin-1 issue)

**Emoji Encoding Fix:**
Google Sheets CSV exports can corrupt emojis (e.g., `😴` becomes `ðŸ˜´`). The `fixEmojiEncoding()` function:
1. Maps known corrupted patterns to correct emojis
2. Attempts byte-level decoding (treating Latin-1 bytes as UTF-8)

### 2. Data Aggregation (`src/utils/aggregateByCountry.js`)

Raw submissions are aggregated by country code:

```javascript
// Input: Array of raw submissions
// Output: Object keyed by country code
{
  "CA": {
    country: "Canada",
    lat: 56.1304,
    lng: -106.3468,
    total: 1243,
    moods: {
      "😊": 412,
      "😐": 301,
      "😴": 530
    },
    percentages: {
      "😊": 33.1,
      "😐": 24.2,
      "😴": 42.7
    },
    dominantMood: "😴",
    dominantPercent: 42.7
  }
}
```

**Process:**
1. Group submissions by `country_code` (normalized to uppercase)
2. Count mood occurrences per country
3. Calculate percentages
4. Determine dominant mood (highest percentage)

**Country Centers:**
- First tries to extract from GeoJSON features
- Falls back to hardcoded coordinates in `countryCenters.js`
- Last resort: uses lat/lng from submission data

### 3. Globe Rendering (`src/components/GlobeView.jsx`)

The globe uses `react-globe.gl` (Three.js wrapper) to render:

**Polygons Layer:**
- Renders country boundaries from GeoJSON
- Handles hover/click events
- Visual highlighting (blue fill + outline) on hover

**Labels Layer:**
- Uses `htmlElementsData` prop (custom HTML elements, not Three.js text)
- Each country gets a label showing: `{dominantMood} {dominantPercent}%`
- Labels positioned at country centers (lat/lng from aggregated data)

**Hover Detection:**
1. `onPolygonHover` fires when mouse enters/exits polygon
2. Extracts country code from polygon properties (`ISO_A2`, `ISO_A2_EH`, `ISO_A3`)
3. Falls back to name-to-code mapping if no ISO code found
4. Updates `hoveredCountryISO` state
5. Triggers tooltip display in parent component

**Country Code Matching:**
- Primary: GeoJSON `properties.ISO_A2` (2-letter code)
- Fallback: `countryNameToCode.js` mapping (for GeoJSON with only names)

### 4. State Management (`src/App.jsx`)

The main `App` component orchestrates all state:

```javascript
// Data State
const [rawData, setRawData] = useState([]);              // Raw CSV rows
const [countriesGeoJSON, setCountriesGeoJSON] = useState(null);  // GeoJSON features

// UI State
const [hoveredCountry, setHoveredCountry] = useState(null);      // Tooltip data
const [loading, setLoading] = useState(true);
const [globalDominantMood, setGlobalDominantMood] = useState('😊');

// Location State
const [userLocation, setUserLocation] = useState(null);
const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);

// Submission State
const [submitting, setSubmitting] = useState(false);
const [submitStatus, setSubmitStatus] = useState(null);
```

**Data Flow:**
1. `useEffect` fetches GeoJSON on mount
2. `useEffect` fetches mood data on mount, then every 120 seconds
3. `rawData` → `GlobeView` → aggregated via `useMemo` → rendered
4. Hover events bubble up: `GlobeView` → `App` → `CountryTooltip`

**Auto-refresh:**
- Polls Google Sheets CSV every 120 seconds
- Updates `rawData` state
- React re-renders globe with new aggregated data

### 5. Mood Submission (`src/utils/submitMood.js`)

When user selects a mood:

1. **Location Request** (`src/utils/geolocation.js`):
   - Requests browser geolocation API
   - Reverse geocodes coordinates → country (using OpenStreetMap Nominatim API)
   - Returns: `{ latitude, longitude, country_code, country_name }`

2. **Submission** (`src/utils/submitMood.js`):
   - Sends GET request to Google Apps Script web app
   - URL parameters: `?timestamp=...&mood=...&lat=...&lng=...&country_code=...&country_name=...`
   - Uses `mode: 'no-cors'` (can't read response, but request succeeds)

3. **Google Apps Script** (external):
   - Receives GET request
   - Appends row to Google Sheet
   - Returns success response

## Component Breakdown

### `App.jsx` (Main Orchestrator)

**Responsibilities:**
- Fetches GeoJSON and mood data
- Manages global state (loading, hover, location, submission)
- Handles location permission flow
- Coordinates mood submission
- Renders layout (header, globe, tooltip, selector, footer)

**Key Effects:**
- GeoJSON loading (once on mount)
- Mood data fetching (on mount + 120s interval)
- Global dominant mood calculation (when `rawData` changes)
- Mouse position tracking (for tooltip positioning)

### `GlobeView.jsx` (3D Globe)

**Responsibilities:**
- Renders 3D globe with country polygons
- Handles polygon hover/click events
- Renders country labels (dominant mood + %)
- Aggregates raw data by country (via `useMemo`)
- Visual highlighting on hover

**Key Memoizations:**
- `countryStats`: Aggregated data (recomputes when `rawData` or `countriesGeoJSON` changes)
- `labelsData`: Label data array (recomputes when `countryStats` or hover state changes)

**Event Handlers:**
- `handlePolygonHover`: Extracts country code, updates hover state, notifies parent
- `handlePolygonClick`: Toggles clicked country (for future expansion)

### `CountryTooltip.jsx` (Hover Tooltip)

**Responsibilities:**
- Displays country name and mood breakdown
- Shows top 4 moods sorted by percentage
- Positions near cursor (avoids screen edges)
- Smooth fade in/out animation (Framer Motion)

**Data Structure:**
Receives `countryData` from `App` (aggregated country stats):
```javascript
{
  country: "Canada",
  total: 1243,
  percentages: { "😴": 42.7, "😊": 33.1, ... },
  dominantMood: "😴",
  dominantPercent: 42.7
}
```

### `MoodSelector.jsx` (Emoji Tray)

**Responsibilities:**
- Renders 6 mood emojis in bottom tray
- Handles emoji click → triggers `onMoodSelect` callback
- Disabled state when location not granted or submitting
- Framer Motion animations (scale on hover/tap)

**Mood Configuration:**
Defined in `src/utils/moodConfig.js`:
```javascript
export const MOODS = [
  { emoji: "😊", label: "Happy", color: "#22c55e" },
  { emoji: "😐", label: "Neutral", color: "#eab308" },
  // ...
];
```

### `LocationPermissionModal.jsx` (Permission Request)

**Responsibilities:**
- Shows modal on first visit (if permission not granted)
- Explains why location is needed
- Handles user response (grant/deny)
- Stores permission in `localStorage`

## Utility Functions

### `src/utils/moodConfig.js`
- Defines available moods (emoji, label, color)
- Helper functions: `getMoodLabel()`, `getMoodColor()`

### `src/utils/countryCenters.js`
- Hardcoded lat/lng for major countries
- Fallback when GeoJSON doesn't provide centers
- Helper: `getCountryCenterFromGeoJSON()` (calculates centroid from polygon)

### `src/utils/countryNameToCode.js`
- Comprehensive mapping: country name → ISO 3166-1 alpha-2 code
- Handles variations (e.g., "United States" → "US", "USA" → "US")
- Used when GeoJSON only has names (no ISO codes)

### `src/utils/geolocation.js`
- `requestLocationPermission()`: Checks/stores permission status
- `getUserLocation()`: Gets coordinates via browser API
- Reverse geocoding: Coordinates → country (OpenStreetMap Nominatim)

## Key Design Decisions

### Why HTML Elements for Labels?
- Three.js text rendering has limited emoji support
- HTML elements allow full CSS control and emoji rendering
- `react-globe.gl`'s `htmlElementsData` prop handles 3D positioning

### Why GET Requests for Submission?
- Google Apps Script web apps handle GET more reliably
- Avoids CORS preflight issues
- Works with `no-cors` mode (can't read response, but request succeeds)

### Why CSV Instead of JSON?
- Google Sheets CSV export is public (no auth needed)
- Simple to parse
- Emoji encoding issues handled in `fixEmojiEncoding()`

### Why Memoization?
- `countryStats` aggregation is expensive (O(n) where n = submissions)
- Only recomputes when `rawData` or `countriesGeoJSON` changes
- `labelsData` only recomputes when stats or hover state changes
- Prevents unnecessary re-renders of 3D globe

### Why Auto-refresh Every 120s?
- Keeps data current without manual refresh
- Balance between freshness and server load
- Users see new submissions appear on globe

## Data Format

### Input (Google Sheets CSV):
```csv
timestamp,mood,lat,lng,country_code,country_name
2026-01-14T01:09:15.118Z,😴,49.28,-123.12,CA,Canada
```

### Output (Aggregated):
```javascript
{
  "CA": {
    country: "Canada",
    lat: 56.1304,
    lng: -106.3468,
    total: 1243,
    moods: { "😴": 530, "😊": 412, ... },
    percentages: { "😴": 42.7, "😊": 33.1, ... },
    dominantMood: "😴",
    dominantPercent: 42.7
  }
}
```

## Performance Considerations

1. **No Raw Point Rendering**: Only renders country polygons and labels (scales to millions of submissions)
2. **Memoization**: Expensive aggregations cached with `useMemo`
3. **Filtering**: Only processes last 24 hours, max 20k rows
4. **Lazy GeoJSON**: Fetched from CDN, not bundled
5. **HTML Labels**: More performant than Three.js text for emojis

## Browser Compatibility

- Requires modern browser with WebGL (for Three.js)
- Geolocation API for mood submission
- Fetch API for data loading
- ES6+ features (async/await, arrow functions, destructuring)

## License

MIT
