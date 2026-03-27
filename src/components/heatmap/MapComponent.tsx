'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CityRiskData } from '@/services/weatherService';

interface MapProps {
  data: CityRiskData[];
  riskFilter: string;
  activeLayer: 'base' | 'rain';
  searchQuery: string;
}

export default function MapComponent({ data, riskFilter, activeLayer, searchQuery }: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const rainOverlayRef = useRef<L.TileLayer | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [20.5937, 78.9629],
      zoom: 5,
      zoomControl: false,
      minZoom: 4,
      maxZoom: 12
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    mapRef.current = map;
    layerGroupRef.current = L.layerGroup().addTo(map);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Handle Rain Layer Toggle
  useEffect(() => {
    if (!mapRef.current) return;

    if (activeLayer === 'rain') {
      rainOverlayRef.current = L.tileLayer(
        `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=be5f61ff6b261dedfa89e321d466a063`,
        { opacity: 0.6 }
      ).addTo(mapRef.current);
    } else {
      if (rainOverlayRef.current) {
        mapRef.current.removeLayer(rainOverlayRef.current);
        rainOverlayRef.current = null;
      }
    }
  }, [activeLayer]);

  // Render Markers
  useEffect(() => {
    if (!mapRef.current || !layerGroupRef.current) return;
    layerGroupRef.current.clearLayers();

    const filteredData = data.filter(city => {
      const matchesRisk = riskFilter === 'all' || city.riskLevel.toLowerCase() === riskFilter.toLowerCase();
      const matchesSearch = !searchQuery || city.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesRisk && matchesSearch;
    });

    filteredData.forEach(city => {
      const size = city.riskLevel === 'EXTREME' ? 60 : city.riskLevel === 'HIGH' ? 45 : city.riskLevel === 'MEDIUM' ? 35 : city.riskLevel === 'LOW' ? 25 : 15;
      const dotSize = city.riskLevel === 'SAFE' ? 8 : 12;
      
      const icon = L.divIcon({
        className: `marker-container-${city.riskLevel.toLowerCase()}`,
        html: `
          <div class="marker-wrapper" style="width:${size}px; height:${size}px;">
            ${city.riskLevel !== 'SAFE' ? `<div class="pulse-ring" style="background:${city.riskColor}44; animation-duration:${city.riskLevel === 'MEDIUM' ? '3s' : '2s'}"></div>` : ''}
            <div class="center-dot" style="background:${city.riskColor}; width:${dotSize}px; height:${dotSize}px;"></div>
          </div>
        `,
        iconSize: [size, size]
      });

      const popupHtml = `
        <div class="risk-popup">
          <div class="popup-header" style="background: #6C47FF">
            📍 ${city.name.toUpperCase()} — ${city.riskLevel}
          </div>
          <div class="popup-body">
            <div class="data-row"><span>🌧️ Rainfall</span> <b>${city.rainfall}mm</b></div>
            <div class="data-row"><span>💨 AQI</span> <b>${city.aqi} (${city.aqiLabel})</b></div>
            <div class="data-row"><span>🌡️ Temp</span> <b>${city.temp}°C</b></div>
            <div class="data-row"><span>💧 Humidity</span> <b>${city.humidity}%</b></div>
            <hr class="popup-divider" />
            <div class="risk-meter-label">Risk Level: ${city.riskEmoji} ${city.riskLevel}</div>
            <div class="risk-progress-bg">
              <div class="risk-progress-fill" style="width:${city.percent}%; background:${city.riskColor}"></div>
            </div>
          </div>
        </div>
      `;

      L.marker([city.lat, city.lng], { icon })
        .addTo(layerGroupRef.current!)
        .bindPopup(popupHtml, { maxWidth: 280, className: 'leaflet-custom-popup' });
    });

    // Fly to first match if searching
    if (searchQuery && filteredData.length > 0) {
      mapRef.current.flyTo([filteredData[0].lat, filteredData[0].lng], 8, { duration: 1.5 });
    }
  }, [data, riskFilter, searchQuery]);

  return (
    <div className="w-full h-full relative">
      <style jsx global>{`
        .marker-wrapper { position: relative; display: flex; align-items: center; justify-content: center; }
        .pulse-ring { position: absolute; width: 100%; height: 100%; border-radius: 50%; animation: pulse 2s infinite; }
        .center-dot { border-radius: 50%; border: 2px solid white; z-index: 2; }
        @keyframes pulse { 0% { transform: scale(0.5); opacity: 1; } 100% { transform: scale(1.5); opacity: 0; } }
        
        .leaflet-custom-popup .leaflet-popup-content-wrapper { padding: 0; overflow: hidden; border-radius: 12px; }
        .leaflet-custom-popup .leaflet-popup-content { margin: 0; width: 260px !important; }
        .risk-popup { font-family: 'Inter', sans-serif; }
        .popup-header { color: white; padding: 12px 16px; font-weight: bold; font-size: 14px; }
        .popup-body { padding: 12px 16px; font-size: 13px; color: #1A1A2E; }
        .data-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .popup-divider { border: 0; border-top: 1px solid #E8E6FF; margin: 12px 0; }
        .risk-meter-label { font-weight: 600; margin-bottom: 6px; font-size: 12px; }
        .risk-progress-bg { height: 6px; background: #E8E6FF; border-radius: 3px; overflow: hidden; }
        .risk-progress-fill { height: 100%; border-radius: 3px; transition: width 0.5s ease; }
      `}</style>
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
