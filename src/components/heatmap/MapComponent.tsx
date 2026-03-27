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

    // Strict India-centric bounds
    const map = L.map(mapContainerRef.current, {
      center: [20.5937, 78.9629],
      zoom: 5,
      zoomControl: false,
      minZoom: 4,
      maxZoom: 10,
      maxBounds: [
        [6.0, 68.0],
        [37.0, 97.0]
      ],
      maxBoundsViscosity: 1.0
    });

    // Base Layer - Light OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    // Rain Tile Overlay
    L.tileLayer(
      `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=be5f61ff6b261dedfa89e321d466a063`,
      { opacity: 0.4 }
    ).addTo(map);

    mapRef.current = map;
    layerGroupRef.current = L.layerGroup().addTo(map);

    // Expose for search
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
      
      // Clean 20px Mini-Pin
      const icon = L.divIcon({
        className: 'custom-pin-container',
        html: `
          <div class="pin" style="background-color: ${color}; box-shadow: 0 2px 8px ${color}44;">
            <div class="pin-inner"></div>
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 20],
        popupAnchor: [0, -20]
      });

      const popupHtml = `
        <div class="cute-popup">
          <div class="popup-header" style="background: #6C47FF">
            📍 ${city.name.toUpperCase()}
          </div>
          <div class="popup-body">
            <div class="data-row"><span>🌧️ Rain</span> <b>${city.rainfall}mm</b></div>
            <div class="data-row"><span>💨 AQI</span> <b>${city.aqi}</b></div>
            <div class="data-row"><span>🌡️ Temp</span> <b>${city.temp}°C</b></div>
            
            <div class="risk-bar-container">
              <div class="progress-bg">
                <div class="progress-fill" style="width: ${city.percent}%; background: ${color}"></div>
              </div>
            </div>

            <div class="status-badge" style="background: ${color}11; color: ${color}">
              ${city.riskLevel} RISK
            </div>
          </div>
        </div>
      `;

      const marker = L.marker([city.lat, city.lng], { icon })
        .addTo(layerGroupRef.current!)
        .bindPopup(popupHtml, { maxWidth: 220, className: 'leaflet-cute-popup' });

      if (!(window as any).cityMarkers) (window as any).cityMarkers = {};
      (window as any).cityMarkers[city.name.toLowerCase()] = marker;
    });
  }, [data, riskFilter]);

  return (
    <div className="w-full h-full relative">
      <style jsx global>{`
        .pin {
          width: 20px;
          height: 20px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          position: relative;
          display: block;
          transition: transform 0.2s ease;
          border: 1px solid white;
        }
        .pin:hover { transform: rotate(-45deg) scale(1.3); z-index: 1000; }
        .pin-inner {
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          position: absolute;
          top: 5px;
          left: 5px;
        }
        .custom-pin-container { background: none; border: none; }
        .leaflet-cute-popup .leaflet-popup-content-wrapper { 
          padding: 0; 
          overflow: hidden; 
          border-radius: 12px; 
          border: 1px solid #E8E6FF; 
          box-shadow: 0 4px 20px rgba(108,71,255,0.1); 
        }
        .leaflet-cute-popup .leaflet-popup-content { margin: 0; width: 200px !important; }
        .cute-popup { font-family: 'Inter', sans-serif; }
        .popup-header { color: white; padding: 8px 12px; font-weight: 800; font-size: 11px; letter-spacing: 0.5px; }
        .popup-body { padding: 12px; font-size: 11px; color: #1A1A2E; }
        .data-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .risk-bar-container { margin-top: 10px; margin-bottom: 8px; }
        .progress-bg { height: 6px; background: #EEEEFF; border-radius: 3px; overflow: hidden; }
        .progress-fill { height: 100%; border-radius: 3px; transition: width 1s ease-out; }
        .status-badge { margin-top: 8px; padding: 6px; border-radius: 6px; text-align: center; font-weight: 800; font-size: 10px; }
      `}</style>
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
