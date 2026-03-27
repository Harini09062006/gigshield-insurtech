'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CityRiskData } from '@/services/weatherService';

interface MapProps {
  data: CityRiskData[];
  riskFilter: string;
}

export default function MapComponent({ data, riskFilter }: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Center on India with restricted bounds
    const map = L.map(mapContainerRef.current, {
      center: [20.5937, 78.9629],
      zoom: 5,
      zoomControl: false,
      minZoom: 4,
      maxZoom: 12,
      maxBounds: [
        [6.0, 68.0], // Southwest India
        [37.0, 97.0]  // Northeast India
      ],
      maxBoundsViscosity: 1.0
    });

    // Base Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    // Default Rain Overlay
    L.tileLayer(
      `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=be5f61ff6b261dedfa89e321d466a063`,
      { opacity: 0.6 }
    ).addTo(map);

    mapRef.current = map;
    layerGroupRef.current = L.layerGroup().addTo(map);

    // Expose map to window for search functionality
    (window as any).leafletMap = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !layerGroupRef.current) return;
    layerGroupRef.current.clearLayers();

    const filtered = data.filter(c => riskFilter === 'all' || c.riskLevel.toLowerCase() === riskFilter.toLowerCase());

    filtered.forEach(city => {
      const riskColors: Record<string, string> = {
        'EXTREME': '#EF4444',
        'HIGH': '#F59E0B',
        'MEDIUM': '#EAB308',
        'LOW': '#22C55E',
        'SAFE': '#64748B'
      };
      
      const color = riskColors[city.riskLevel] || '#64748B';
      
      // Professional Pin Marker
      const icon = L.divIcon({
        className: 'custom-pin-container',
        html: `
          <div class="pin" style="background-color: ${color}; box-shadow: 0 0 15px ${color}66;">
            <div class="pin-inner"></div>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
      });

      const popupHtml = `
        <div class="cute-popup">
          <div class="popup-header" style="background: #6C47FF">
            📍 ${city.name.toUpperCase()} — ${city.riskLevel}
          </div>
          <div class="popup-body">
            <div class="data-row"><span>🌧️ Rainfall</span> <b>${city.rainfall}mm</b></div>
            <div class="data-row"><span>💨 AQI</span> <b>${city.aqi} (${city.aqiLabel})</b></div>
            <div class="data-row"><span>🌡️ Temp</span> <b>${city.temp}°C</b></div>
            <div class="data-row"><span>💧 Humidity</span> <b>${city.humidity}%</b></div>
            <div class="data-row"><span>🌦️ Condition</span> <b>${city.condition}</b></div>
            
            <div class="risk-bar-container">
              <div class="risk-label">Protection Threshold (50mm)</div>
              <div class="progress-bg">
                <div class="progress-fill" style="width: ${city.percent}%; background: ${color}"></div>
              </div>
            </div>

            <div class="status-badge" style="background: ${color}11; color: ${color}">
              ${city.riskLevel === 'SAFE' || city.riskLevel === 'LOW' ? '🟢 SAFE FOR DELIVERY' : city.riskLevel === 'MEDIUM' ? '🟡 CAUTION ADVISED' : '🔴 HIGH DISRUPTION RISK'}
            </div>
          </div>
        </div>
      `;

      const marker = L.marker([city.lat, city.lng], { icon })
        .addTo(layerGroupRef.current!)
        .bindPopup(popupHtml, { maxWidth: 280, className: 'leaflet-cute-popup' });

      if (!(window as any).cityMarkers) (window as any).cityMarkers = {};
      (window as any).cityMarkers[city.name.toLowerCase()] = marker;
    });
  }, [data, riskFilter]);

  return (
    <div className="w-full h-full relative">
      <style jsx global>{`
        .pin {
          width: 30px;
          height: 30px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          position: relative;
          display: block;
          transition: transform 0.2s ease;
        }
        .pin:hover { transform: rotate(-45deg) scale(1.2); z-index: 1000; }
        .pin-inner {
          width: 12px;
          height: 12px;
          background: white;
          border-radius: 50%;
          position: absolute;
          top: 9px;
          left: 9px;
        }
        .custom-pin-container { background: none; border: none; }
        .leaflet-cute-popup .leaflet-popup-content-wrapper { 
          padding: 0; 
          overflow: hidden; 
          border-radius: 16px; 
          border: 1px solid #E8E6FF; 
          box-shadow: 0 8px 30px rgba(108,71,255,0.15); 
        }
        .leaflet-cute-popup .leaflet-popup-content { margin: 0; width: 260px !important; }
        .cute-popup { font-family: 'Inter', sans-serif; }
        .popup-header { color: white; padding: 12px 16px; font-weight: 800; font-size: 13px; letter-spacing: 0.5px; }
        .popup-body { padding: 16px; font-size: 13px; color: #1A1A2E; }
        .data-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
        .risk-bar-container { margin-top: 16px; margin-bottom: 12px; }
        .risk-label { font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase; margin-bottom: 4px; }
        .progress-bg { height: 8px; background: #EEEEFF; border-radius: 4px; overflow: hidden; }
        .progress-fill { height: 100%; border-radius: 4px; transition: width 1s ease-out; }
        .status-badge { margin-top: 12px; padding: 8px; border-radius: 8px; text-align: center; font-weight: 800; font-size: 11px; }
      `}</style>
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
