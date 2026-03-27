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

    // Center on India
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

    // Rain Overlay
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
      const size = city.riskLevel === 'EXTREME' ? 50 : city.riskLevel === 'HIGH' ? 40 : city.riskLevel === 'MEDIUM' ? 30 : city.riskLevel === 'LOW' ? 25 : 20;
      const isAnimated = city.riskLevel === 'EXTREME' || city.riskLevel === 'HIGH';
      
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div class="marker-container" style="width: ${size}px; height: ${size}px;">
            ${isAnimated ? `<div class="pulse-ring" style="background: ${city.riskColor}44;"></div>` : ''}
            <div class="center-dot" style="background: ${city.riskColor}; width: ${size * 0.4}px; height: ${size * 0.4}px;"></div>
          </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
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
            
            <div class="risk-bar-container">
              <div class="risk-label">Protection Threshold (50mm)</div>
              <div class="progress-bg">
                <div class="progress-fill" style="width: ${city.percent}%; background: ${city.riskColor}"></div>
              </div>
            </div>

            <div class="status-badge" style="background: ${city.riskColor}11; color: ${city.riskColor}">
              ${city.riskLevel === 'SAFE' || city.riskLevel === 'LOW' ? '🟢 SAFE FOR DELIVERY' : '⚠️ CAUTION ADVISED'}
            </div>
          </div>
        </div>
      `;

      const marker = L.marker([city.lat, city.lng], { icon })
        .addTo(layerGroupRef.current!)
        .bindPopup(popupHtml, { maxWidth: 280, className: 'leaflet-cute-popup' });

      // Link marker to window for search
      if (!(window as any).cityMarkers) (window as any).cityMarkers = {};
      (window as any).cityMarkers[city.name.toLowerCase()] = marker;
    });
  }, [data, riskFilter]);

  return (
    <div className="w-full h-full relative">
      <style jsx global>{`
        .marker-container { position: relative; display: flex; align-items: center; justify-content: center; }
        .pulse-ring { position: absolute; width: 100%; height: 100%; border-radius: 50%; animation: marker-pulse 2s infinite; border: 2px solid currentColor; }
        .center-dot { border-radius: 50%; border: 2px solid white; z-index: 2; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        @keyframes marker-pulse { 0% { transform: scale(0.5); opacity: 1; } 100% { transform: scale(2); opacity: 0; } }
        
        .leaflet-cute-popup .leaflet-popup-content-wrapper { padding: 0; overflow: hidden; border-radius: 16px; border: 1px solid #E8E6FF; box-shadow: 0 8px 30px rgba(108,71,255,0.15); }
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
