'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CityRiskData } from '@/services/weatherService';

interface MapProps {
  data: CityRiskData[];
  searchResult?: CityRiskData | null;
}

const API_KEY = "be5f61ff6b261dedfa89e321d466a063";

export default function MapComponent({ data, searchResult }: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const markerRefsMap = useRef<Record<string, L.Marker>>({});

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize Map with India Focus
    const map = L.map(mapContainerRef.current, {
      center: [20.5937, 78.9629],
      zoom: 5,
      zoomControl: false,
      minZoom: 4,
      maxZoom: 12,
      maxBounds: [
        [6.0, 68.0],
        [37.0, 97.0]
      ],
      maxBoundsViscosity: 1.0
    });

    // Base Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    // Rain Tile Overlay (Default ON)
    L.tileLayer(
      `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${API_KEY}`,
      { opacity: 0.4 }
    ).addTo(map);

    // Initialize Marker Layer Group
    const markerLayerGroup = L.layerGroup().addTo(map);
    markerLayerGroupRef.current = markerLayerGroup;

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // ── RENDER MARKERS ON DATA CHANGE ──────────────────────────
  useEffect(() => {
    if (!mapRef.current || !markerLayerGroupRef.current) return;
    
    // Clear ALL existing markers
    markerLayerGroupRef.current.clearLayers();
    markerRefsMap.current = {};

    data.forEach(city => {
      const riskColors: Record<string, string> = {
        'EXTREME': '#EF4444',
        'HIGH': '#F59E0B',
        'MEDIUM': '#EAB308',
        'LOW': '#22C55E',
        'SAFE': '#64748B'
      };
      
      const color = riskColors[city.riskLevel.toUpperCase()] || '#64748B';
      const rainfall = city.rainfall || 0;
      const progress = Math.min(100, (rainfall / 50) * 100);

      // Custom Location Pin (Google style teardrop)
      const icon = L.divIcon({
        className: 'custom-pin-container',
        html: `
          <div class="pin" style="background-color: ${color}; box-shadow: 0 0 10px ${color}60;">
            <div class="pin-inner"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 24],
        popupAnchor: [0, -24]
      });

      const recommendation = rainfall > 50 ? '🚫 Deliveries Suspended' : rainfall > 30 ? '⚠️ Exercise Caution' : '✅ Safe for Delivery';
      const recColor = rainfall > 50 ? '#EF4444' : rainfall > 30 ? '#F59E0B' : '#22C55E';

      const popupHtml = `
        <div class="modern-popup">
          <div class="popup-header" style="background: #6C47FF">
            📍 ${city.name.toUpperCase()} — ${city.riskLevel}
          </div>
          <div class="popup-body">
            <div class="data-section">
              <div class="data-row"><span>🌧️ Rainfall</span> <b>${rainfall}mm</b></div>
              <div class="data-row"><span>💨 AQI</span> <b>${city.aqi} (${city.aqiLabel})</b></div>
              <div class="data-row"><span>🌡️ Temp</span> <b>${city.temp}°C</b></div>
              <div class="data-row"><span>💧 Humidity</span> <b>${city.humidity}%</b></div>
            </div>

            <div class="progress-container">
              <div class="progress-bar-bg">
                <div class="progress-bar-fill" style="width: ${progress}%; background: ${color}"></div>
              </div>
              <div class="progress-label">Threshold: 50mm</div>
            </div>

            <div class="recommendation" style="color: ${recColor}; background: ${recColor}10; padding: 8px; border-radius: 8px; border: 1px solid ${recColor}30;">
              ${recommendation}
            </div>
          </div>
        </div>
      `;

      const marker = L.marker([city.lat, city.lng], { icon })
        .bindPopup(popupHtml, { maxWidth: 260, className: 'leaflet-modern-popup' })
        .addTo(markerLayerGroupRef.current!);
      
      markerRefsMap.current[city.name] = marker;
    });
  }, [data]);

  // ── HANDLE SEARCH NAVIGATION ──────────────────────────────
  useEffect(() => {
    if (searchResult && mapRef.current && markerRefsMap.current[searchResult.name]) {
      const city = searchResult;
      mapRef.current.flyTo([city.lat, city.lng], 10, {
        duration: 1.5,
        easeLinearity: 0.25
      });
      
      // Delay popup opening slightly to allow flyTo to complete or be mostly there
      setTimeout(() => {
        markerRefsMap.current[city.name].openPopup();
      }, 1000);
    }
  }, [searchResult]);

  return (
    <div className="w-full h-full relative">
      <style jsx global>{`
        .pin {
          width: 24px;
          height: 24px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          position: relative;
          border: 2px solid white;
          transition: all 0.2s ease;
        }
        .pin:hover { 
          transform: rotate(-45deg) scale(1.2); 
          z-index: 1000;
        }
        .pin-inner {
          width: 10px;
          height: 10px;
          background: white;
          border-radius: 50%;
          position: absolute;
          top: 5px;
          left: 5px;
        }
        .custom-pin-container { background: none; border: none; }
        
        .leaflet-modern-popup .leaflet-popup-content-wrapper { 
          padding: 0; 
          overflow: hidden; 
          border-radius: 16px; 
          border: 1px solid #E8E6FF; 
          box-shadow: 0 10px 30px rgba(108,71,255,0.15); 
        }
        .leaflet-modern-popup .leaflet-popup-content { margin: 0; width: 260px !important; }
        
        .modern-popup { font-family: 'Inter', sans-serif; overflow: hidden; }
        .popup-header { color: white; padding: 12px 16px; font-weight: 800; font-size: 11px; letter-spacing: 0.5px; }
        .popup-body { padding: 16px; color: #1A1A2E; }
        
        .data-section { margin-bottom: 12px; border-bottom: 1px solid #F5F3FF; padding-bottom: 8px; }
        .data-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 10px; }
        .data-row span { color: #64748B; font-weight: 600; }
        
        .progress-container { margin-bottom: 12px; }
        .progress-bar-bg { height: 6px; background: #EEEEFF; border-radius: 3px; overflow: hidden; margin-bottom: 4px; }
        .progress-bar-fill { height: 100%; border-radius: 3px; transition: width 1s ease-out; }
        .progress-label { font-size: 8px; color: #94A3B8; font-weight: 700; text-align: right; text-transform: uppercase; }
        
        .recommendation {
          font-size: 10px;
          font-weight: 800;
          text-align: center;
        }
      `}</style>
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
