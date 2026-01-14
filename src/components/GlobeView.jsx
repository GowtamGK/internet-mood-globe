import { useMemo, useState, useRef, useEffect } from 'react';
import Globe from 'react-globe.gl';
import { aggregateByCountry } from '../utils/aggregateByCountry';
import { getCountryCenterFromGeoJSON } from '../utils/countryCenters';
import { countryNameToCode } from '../utils/countryNameToCode';

export default function GlobeView({ rawData, countriesGeoJSON, onCountryHover }) {
  const [hoveredCountryISO, setHoveredCountryISO] = useState(null);
  const [clickedCountryISO, setClickedCountryISO] = useState(null);
  const globeEl = useRef();

  // Aggregate data by country
  const countryStats = useMemo(() => {
    if (!rawData) return {};
    
    // Build country centers map from GeoJSON (if available)
    const countryCentersMap = {};
    if (countriesGeoJSON && countriesGeoJSON.features && countriesGeoJSON.features.length > 0) {
      countriesGeoJSON.features.forEach(feature => {
        const code = feature.properties?.ISO_A2 || feature.properties?.ISO_A2_EH || feature.properties?.ISO_A3;
        if (code) {
          const center = getCountryCenterFromGeoJSON(code, countriesGeoJSON);
          // Store both uppercase and lowercase versions for matching
          countryCentersMap[code.toUpperCase()] = center;
          countryCentersMap[code.toLowerCase()] = center;
        }
      });
    }
    
    return aggregateByCountry(rawData, countryCentersMap);
  }, [rawData, countriesGeoJSON]);

  // Convert country stats to labels data - include country_code for hover detection
  // Recreate when hover/click changes to update label display
  // Add a renderKey that changes when hover/click changes to force re-render
  const labelsData = useMemo(() => {
    const renderKey = `${hoveredCountryISO || 'none'}-${clickedCountryISO || 'none'}`;
    
    const labels = Object.entries(countryStats)
      .filter(([code, stats]) => stats.dominantMood && stats.total > 0)
      .map(([code, stats]) => {
        const isHovered = hoveredCountryISO === code;
        const isClicked = clickedCountryISO === code;
        return {
          ...stats,
          country_code: code, // Add country_code for hover/click detection
          isHovered,
          isClicked,
          renderKey // Add key to force re-render
        };
      });
    
    return labels;
  }, [countryStats, hoveredCountryISO, clickedCountryISO]);

  // Country name to ISO code mapping is imported from countryNameToCode.js
  // This provides complete ISO 3166-1 alpha-2 mapping for all countries

  // Helper to check if polygon is hovered (by code or name)
  const isPolygonHovered = (d) => {
    if (!d || !d.properties || !hoveredCountryISO) return false;
    
    // Try ISO codes first
    let code = d.properties.ISO_A2 || 
               d.properties.ISO_A2_EH || 
               d.properties.ISO_A3 ||
               d.properties.ADM0_A3;
    
    if (code && String(code).toUpperCase().trim() === hoveredCountryISO) {
      return true;
    }
    
    // Try name mapping
    if (d.properties.name && countryNameToCode[d.properties.name] === hoveredCountryISO) {
      return true;
    }
    
    // Direct name match (for when hoveredCountryISO is set to country name)
    if (d.properties.name === hoveredCountryISO || d.properties.ADMIN === hoveredCountryISO) {
      return true;
    }
    
    return false;
  };

  // Handle polygon hover - works with names or codes
  const handlePolygonHover = (polygon, prevPolygon, event) => {
    if (polygon && polygon.properties) {
      // Try ISO codes first
      let countryCode = polygon.properties.ISO_A2 || 
                       polygon.properties.ISO_A2_EH || 
                       polygon.properties.ISO_A3 ||
                       polygon.properties.ADM0_A3;
      
      // If no ISO code, try name mapping
      const countryName = polygon.properties.name || polygon.properties.ADMIN;
      if (!countryCode && countryName) {
        countryCode = countryNameToCode[countryName];
      }
      
      // Set hover state - use code if found, otherwise use name for visual highlighting
      const hoverIdentifier = countryCode ? countryCode.toUpperCase().trim() : countryName;
      
      if (hoverIdentifier) {
        setHoveredCountryISO(hoverIdentifier);
        // Try to find country stats by code
        if (countryCode) {
          const codeUpper = countryCode.toUpperCase().trim();
          if (onCountryHover) {
            onCountryHover(countryStats[codeUpper] || null);
          }
        } else if (onCountryHover) {
          // Try to find by name mapping
          const mappedCode = countryNameToCode[countryName];
          if (mappedCode) {
            onCountryHover(countryStats[mappedCode.toUpperCase()] || null);
          } else {
            onCountryHover(null);
          }
        }
      }
    } else {
      setHoveredCountryISO(null);
      if (onCountryHover) {
        onCountryHover(null);
      }
    }
  };

  // Handle polygon click
  const handlePolygonClick = (polygon, event) => {
    if (polygon) {
      const countryCode = polygon.properties?.ISO_A2 || polygon.properties?.ISO_A2_EH || polygon.properties?.ISO_A3;
      
      if (countryCode) {
        const codeUpper = countryCode.toUpperCase();
        // Toggle click - if same country clicked again, deselect it
        if (clickedCountryISO === codeUpper) {
          setClickedCountryISO(null);
          setHoveredCountryISO(null);
          if (onCountryHover) {
            onCountryHover(null);
          }
        } else {
          setClickedCountryISO(codeUpper);
          setHoveredCountryISO(codeUpper);
          if (onCountryHover) {
            onCountryHover(countryStats[codeUpper] || null);
          }
        }
      }
    }
  };

  // Auto-rotate globe
  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.5;
    }
  }, []);

  if (!countriesGeoJSON || !countriesGeoJSON.features || countriesGeoJSON.features.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-white/70">Loading globe data...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <Globe
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        polygonsData={countriesGeoJSON.features}
        polygonAltitude={(d) => {
          return isPolygonHovered(d) ? 0.08 : 0.01;
        }}
        polygonCapColor={(d) => {
          if (isPolygonHovered(d)) {
            return 'rgba(59, 130, 246, 0.6)'; // Bright blue for hovered
          }
          return 'rgba(255,255,255,0.03)';
        }}
        polygonSideColor={() => 'rgba(0,0,0,0)'}
        polygonStrokeColor={(d) => {
          if (isPolygonHovered(d)) {
            return 'rgba(59, 130, 246, 1)'; // Bright blue outline for hovered
          }
          return 'rgba(255,255,255,0.1)';
        }}
        polygonStrokeWidth={(d) => {
          return isPolygonHovered(d) ? 4 : 0.5;
        }}
        polygonLabel={({ properties }) => properties?.ADMIN || ''}
        onPolygonHover={handlePolygonHover}
        // Use HTML elements for emoji support - show only dominant mood (no breakdown on globe)
        htmlElementsData={labelsData}
        htmlElement={d => {
          const htmlEl = document.createElement('div');
          // Always show only dominant mood on the globe (breakdown is in tooltip)
          const content = `<span style="font-size: 36px;">${d.dominantMood}</span> <span style="font-size: 22px;">${d.dominantPercent}%</span>`;
          
          htmlEl.style.cssText = `
            color: white;
            font-size: 32px;
            font-weight: bold;
            text-align: center;
            text-shadow: 2px 2px 8px rgba(0,0,0,1);
            background: rgba(0,0,0,0.7);
            padding: 8px 14px;
            border-radius: 8px;
            white-space: nowrap;
            pointer-events: none;
            font-family: 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', 'Twemoji Mozilla', sans-serif;
            line-height: 1.4;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          `;
          htmlEl.innerHTML = content;
          return htmlEl;
        }}
        htmlLat={d => d.lat || 0}
        htmlLng={d => d.lng || 0}
        enablePointerInteraction={true}
        showAtmosphere={false}
        showGlobe={true}
        showGraticules={false}
      />
    </div>
  );
}
