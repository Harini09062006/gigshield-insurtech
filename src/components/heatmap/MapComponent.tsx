'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CityRiskData, getWeatherByCoords, getAQIByCoords, calculateRisk } from '@/services/weatherService';

const CITIES_LIST = [
  { name: "Chennai", lat: 13.0827, lng: 80.2707 },
  { name: "Mumbai", lat: 19.0760, lng: 72.8777 },
  { name: "Bengaluru", lat: 12.9716, lng: 77.5946 },
  { name: "Hyderabad", lat: 17.3850, lng: 78.4867 },
  { name: "Delhi", lat: 28.7041, lng: 77.1025 },
  { name: "Kolkata", lat: 22.5726, lng: 88.3639 },
  { name: "Howrah", lat: 22.5958, lng: 88.2636 },
  { name: "Pune", lat: 18.5204, lng: 73.8567 },
  { name: "Kochi", lat: 9.9312, lng: 76.2673 },
  { name: "Jaipur", lat: 26.9124, lng: 75.7873 }
];

interface MapProps {
  searchQuery: string;
  riskFilter: string;
  dataType: string;
  activeLayer: string;
  onDataLoaded?: (data: CityRiskData[]) => void;
  flyToCity?: { lat: number, lng: number } | null;
}

export default function MapComponent({ searchQuery, riskFilter, dataType, activeLayer, onDataLoaded, flyToCity }: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const overlayGroupRef = useRef<L.LayerGroup | null>(null);
  const [cityData, setCityRiskData] = useState<CityRiskData[]>([]);
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);

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
    overlayGroupRef.current = L.layerGroup().addTo(map);

    // Get real GPS
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLoc([pos.coords.latitude, pos.coords.longitude]),
      () => console.log("Location access denied")
    );

    fetchData();
    const timer = setInterval(fetchData, 120000);

    return () => {
      clearInterval(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const fetchData = async () => {
    const results = await Promise.all(CITIES_LIST.map(async (city) => {
      const weather = await getWeatherByCoords(city.lat, city.lng);
      const aqi = await getAQIByCoords(city.lat, city.lng);
      const risk = calculateRisk(weather.rainfall);
      return {
        ...city,
        ...weather,
        aqi: aqi.aqi,
        aqiLabel: aqi.label,
        riskLevel: risk.level as any,
        riskColor: risk.color,
        riskEmoji: risk.emoji,
        percent: risk.percent
      };
    }));
    setCityRiskData(results);
    onDataLoaded?.(results);
  };

  useEffect(() => {
    if (!mapRef.current || !overlayGroupRef.current) return;
    overlayGroupRef.current.clearLayers();

    if (activeLayer !== 'base') {
      const typeMap: Record<string, string> = { rain: 'precipitation_new', wind: 'wind_new', clouds: 'clouds_new' };
      const layer = L.tileLayer(`https://tile.openweathermap.org/map/${typeMap[activeLayer]}/{z}/{x}/{y}.png?appid=be5f61ff6b261dedfa89e321d466a063`, {
        opacity: 0.6
      });
      overlayGroupRef.current.addLayer(layer);
    }
  }, [activeLayer]);

  useEffect(() => {
    if (flyToCity && mapRef.current) {
      mapRef.current.flyTo([flyToCity.lat, flyToCity.lng], 10, { duration: 1.5 });
    }
  }, [flyToCity]);

  useEffect(() => {
    if (!mapRef.current || !layerGroupRef.current) return;
    layerGroupRef.current.clearLayers();

    // User Location Pin
    if (userLoc) {
      const userIcon = L.divIcon({
        className: 'user-marker',
        html: `<div style="width:20px;height:20px;background:#6C47FF;border:3px solid white;border-radius:50%;box-shadow:0 0 10px #6C47FF;"></div>`,
        iconSize: [20, 20]
      });
      L.marker(userLoc, { icon: userIcon }).addTo(layerGroupRef.current)
        .bindPopup(`<b>📍 Your Location</b><br/>GPS Verified ✅`);
    }

    const filtered = cityData.filter(c => {
      if (riskFilter !== 'all' && c.riskLevel.toLowerCase() !== riskFilter.toLowerCase()) return false;
      if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });

    filtered.forEach(city => {
      const size = city.riskLevel === 'EXTREME' ? 60 : city.riskLevel === 'HIGH' ? 45 : city.riskLevel === 'MEDIUM' ? 35 : city.riskLevel === 'LOW' ? 25 : 15;
      const dotSize = city.riskLevel === 'EXTREME' ? 20 : 12;
      
      const icon = L.divIcon({
        className: `marker-${city.riskLevel.toLowerCase()}`,
        html: `
          <div class="marker-container" style="width:${size}px;height:${size}px;">
            ${city.riskLevel !== 'SAFE' && city.riskLevel !== 'LOW' ? `<div class="pulse-ring" style="background:${city.riskColor}44; animation-duration:${city.riskLevel === 'MEDIUM' ? '3s' : '2s'}"></div>` : ''}
            <div class="center-dot" style="background:${city.riskColor}; width:${dotSize}px; height:${dotSize}px;"></div>
          </div>
        `,
        iconSize: [size, size]
      });

      const popupHtml = `
        <div class="custom-popup-card">
          <div class="popup-header" style="background:${city.riskColor}">
            📍 ${city.name.toUpperCase()} — ${city.riskLevel}
          </div>
          <div class="popup-content">
            <div class="weather-row">
              <span>🌧️ Rainfall: ${city.rainfall}mm</span><br/>
              <span>💨 AQI: ${city.aqi} (${city.aqiLabel})</span><br/>
              <span>🌡️ Temp: ${city.temp}°C</span><br/>
              <span>💧 Humidity: ${city.humidity}%</span>
            </div>
            <hr class="popup-divider"/>
            <div class="stats-row">
              Active Workers: 234<br/>
              At Risk: ${city.rainfall > 30 ? 89 : 12} workers<br/>
              Protected: ${city.rainfall > 30 ? 145 : 222} workers ✅
            </div>
            <hr class="popup-divider"/>
            <div class="risk-row">
              Risk Level: ${city.riskEmoji} ${city.riskLevel}<br/>
              Current: ${city.rainfall}mm (${city.percent}%)
              <div class="risk-bar-bg"><div class="risk-bar-fill" style="width:${city.percent}%; background:${city.riskColor}"></div></div>
            </div>
            <button class="popup-btn" onclick="window.triggerAlert('${city.name}')">⚡ Trigger City Alert</button>
          </div>
        </div>
      `;

      L.marker([city.lat, city.lng], { icon }).addTo(layerGroupRef.current!)
        .bindPopup(popupHtml, { maxWidth: 280, className: 'leaflet-custom-popup' });
    });
  }, [cityData, riskFilter, searchQuery, userLoc]);

  return (
    <div className="w-full h-full relative">
      <style jsx global>{`
        .marker-container { position: relative; display: flex; align-items: center; justify-content: center; }
        .pulse-ring { position: absolute; width: 100%; height: 100%; border-radius: 50%; animation: pulse 2s infinite; }
        .center-dot { border-radius: 50%; border: 2px solid white; z-index: 2; }
        @keyframes pulse { 0% { transform: scale(0.5); opacity: 1; } 100% { transform: scale(1.5); opacity: 0; } }
        
        .leaflet-custom-popup .leaflet-popup-content-wrapper { padding: 0; overflow: hidden; border-radius: 12px; }
        .leaflet-custom-popup .leaflet-popup-content { margin: 0; width: 260px !important; }
        .custom-popup-card { font-family: 'Inter', sans-serif; }
        .popup-header { color: white; padding: 12px 16px; font-weight: bold; }
        .popup-content { padding: 12px 16px; font-size: 13px; color: #1A1A2E; line-height: 1.6; }
        .popup-divider { border: 0; border-top: 1px solid #E8E6FF; margin: 12px 0; }
        .risk-bar-bg { height: 6px; background: #E8E6FF; border-radius: 3px; margin-top: 8px; overflow: hidden; }
        .risk-bar-fill { height: 100%; border-radius: 3px; transition: width 0.5s ease; }
        .popup-btn { width: 100%; background: #6C47FF; color: white; border: none; padding: 10px; border-radius: 8px; font-weight: bold; cursor: pointer; margin-top: 12px; }
      `}</style>
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
