'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CityRiskData } from '@/services/weatherService';

interface MapProps {
  data: CityRiskData[];
}

const API_KEY = "be5f61ff6b261dedfa89e321d466a063";

export default function MapComponent({ data }: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerLayerGroupRef = useRef<L.LayerGroup | null>(null);

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

    // Rain Tile Overlay
    L.tileLayer(
      `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${API_KEY}`,
      { opacity: 0.6 }
    ).addTo(map);

    // Initialize Marker Layer Group
    const markerLayerGroup = L.layerGroup().addTo(map);
    markerLayerGroupRef.current = markerLayerGroup;

    mapRef.current = map;
    (window as any).leafletMap = map;

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
    
    // 1. Clear ALL existing markers
    markerLayerGroupRef.current.clearLayers();
    const cityMarkers: Record<string, L.Marker> = {};

    // 2. Add filtered markers
    data.forEach(city => {
      const riskColors: Record<string, string> = {
        'EXTREME': '#EF4444',
        'HIGH': '#F59E0B',
        'MEDIUM': '#EAB308',
        'LOW': '#22C55E',
        'SAFE': '#64748B'
      };
      
      const color = riskColors[city.riskLevel] || '#64748B';
      const rainfall = city.rainfall || 0;
      const progress = Math.min(100, (rainfall / 50) * 100);

      const icon = L.divIcon({
        className: 'custom-pin-container',
        html: `
          <div class="pin" style="background-color: ${color}; border: 1px solid white;">
            <div class="pin-inner"></div>
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 20],
        popupAnchor: [0, -20]
      });

      const popupHtml = `
        <div class="modern-popup">
          <div class="popup-header" style="background: #6C47FF">
            📍 ${city.name.toUpperCase()}
          </div>
          <div class="popup-body">
            <div class="risk-badge" style="background: ${color}11; color: ${color}; border: 1px solid ${color}33">
              ${city.riskLevel} RISK
            </div>
            
            <div class="data-section">
              <div class="data-row"><span>🌧️ Rainfall</span> <b>${rainfall}mm</b></div>
              <div class="data-row"><span>💨 AQI</span> <b>${city.aqi} (${city.aqiLabel})</b></div>
              <div class="data-row"><span>🌡️ Temp</span> <b>${city.temp}°C</b></div>
            </div>

            <div class="progress-container">
              <div class="progress-bar-bg">
                <div class="progress-bar-fill" style="width: ${progress}%; background: ${color}"></div>
              </div>
              <div class="progress-label">Threshold: 50mm</div>
            </div>

            <button class="action-btn" onclick="console.log('Operational Alert for ${city.name}')">
              TRIGGER ALERT
            </button>
          </div>
        </div>
      `;

      const marker = L.marker([city.lat, city.lng], { icon })
        .bindPopup(popupHtml, { maxWidth: 220, className: 'leaflet-modern-popup' });

      markerLayerGroupRef.current!.addLayer(marker);
      cityMarkers[city.name.toLowerCase()] = marker;
    });

    (window as any).cityMarkers = cityMarkers;
  }, [data]);

  return (
    <div className="w-full h-full relative">
      <style jsx global>{`
        .pin {
          width: 20px;
          height: 20px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          position: relative;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          transition: transform 0.2s ease;
        }
        .pin:hover { transform: rotate(-45deg) scale(1.2); z-index: 1000; }
        .pin-inner {
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          position: absolute;
          top: 6px;
          left: 6px;
        }
        .custom-pin-container { background: none; border: none; }
        
        .leaflet-modern-popup .leaflet-popup-content-wrapper { 
          padding: 0; 
          overflow: hidden; 
          border-radius: 12px; 
          border: 1px solid #E8E6FF; 
          box-shadow: 0 10px 30px rgba(108,71,255,0.15); 
        }
        .leaflet-modern-popup .leaflet-popup-content { margin: 0; width: 220px !important; }
        
        .modern-popup { font-family: 'Inter', sans-serif; }
        .popup-header { color: white; padding: 10px 14px; font-weight: 800; font-size: 11px; letter-spacing: 0.5px; }
        .popup-body { padding: 14px; color: #1A1A2E; }
        
        .risk-badge { 
          padding: 4px 10px; 
          border-radius: 20px; 
          font-weight: 800; 
          font-size: 9px; 
          display: inline-block; 
          margin-bottom: 10px;
          letter-spacing: 0.5px;
        }
        
        .data-section { margin-bottom: 12px; border-bottom: 1px solid #E8E6FF; padding-bottom: 8px; }
        .data-row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 10px; }
        .data-row span { color: #64748B; font-weight: 500; }
        
        .progress-container { margin-bottom: 12px; }
        .progress-bar-bg { height: 6px; background: #EEEEFF; border-radius: 3px; overflow: hidden; margin-bottom: 4px; }
        .progress-bar-fill { height: 100%; border-radius: 3px; transition: width 1s ease-out; }
        .progress-label { font-size: 8px; color: #94A3B8; font-weight: 700; text-align: right; text-transform: uppercase; }
        
        .action-btn { 
          width: 100%; 
          background: #6C47FF; 
          color: white; 
          border: none; 
          padding: 8px; 
          border-radius: 8px; 
          font-weight: 800; 
          font-size: 9px; 
          cursor: pointer;
          transition: background 0.2s;
        }
        .action-btn:hover { background: #5535E8; }
      `}</style>
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
