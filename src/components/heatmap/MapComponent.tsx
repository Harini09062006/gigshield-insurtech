'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getWeatherByCoords, getAQIByCoords } from '@/services/weatherService';

const CITIES = [
  {name:"Chennai", lat:13.0827, lng:80.2707, baseRisk: "high"},
  {name:"Mumbai", lat:19.0760, lng:72.8777, baseRisk: "medium"},
  {name:"Bengaluru", lat:12.9716, lng:77.5946, baseRisk: "low"},
  {name:"Hyderabad", lat:17.3850, lng:78.4867, baseRisk: "low"},
  {name:"Delhi", lat:28.7041, lng:77.1025, baseRisk: "extreme"},
  {name:"Kolkata", lat:22.5726, lng:88.3639, baseRisk: "medium"},
  {name:"Pune", lat:18.5204, lng:73.8567, baseRisk: "low"},
  {name:"Kochi", lat:9.9312, lng:76.2673, baseRisk: "safe"},
  {name:"Jaipur", lat:26.9124, lng:75.7873, baseRisk: "medium"},
];

interface MapProps {
  searchQuery: string;
  riskFilter: string;
  dataType: string;
  activeLayer: string;
  onStatsUpdate?: (stats: any) => void;
}

export default function MapComponent({ searchQuery, riskFilter, dataType, activeLayer, onStatsUpdate }: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const weatherLayerRef = useRef<L.TileLayer | null>(null);
  const db = useFirestore();

  const [localStats, setLocalStats] = useState({
    extreme: 0, high: 4, medium: 3, safe: 6
  });

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [20.5937, 78.9629], // Center of India
      zoom: 5,
      zoomControl: false,
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

  // Handle Layer Changes
  useEffect(() => {
    if (!mapRef.current) return;

    if (weatherLayerRef.current) {
      mapRef.current.removeLayer(weatherLayerRef.current);
    }

    if (activeLayer !== 'base') {
      const layerType = activeLayer === 'rain' ? 'precipitation_new' : activeLayer === 'wind' ? 'wind_new' : 'clouds_new';
      weatherLayerRef.current = L.tileLayer(`https://tile.openweathermap.org/map/${layerType}/{z}/{x}/{y}.png?appid=be5f61ff6b261dedfa89e321d466a063`, {
        opacity: 0.5
      }).addTo(mapRef.current);
    }
  }, [activeLayer]);

  // Render Zones and Markers
  useEffect(() => {
    if (!mapRef.current || !layerGroupRef.current) return;

    const renderZones = async () => {
      layerGroupRef.current?.clearLayers();

      const riskColors: any = {
        extreme: {fill:'#EF4444', border:'#991B1B', ring: 'rgba(239,68,68,0.3)'},
        high:    {fill:'#F59E0B', border:'#C2410C', ring: 'rgba(245,158,11,0.3)'},
        medium:  {fill:'#EAB308', border:'#D97706', ring: 'rgba(234,179,8,0.2)'},
        low:     {fill:'#22C55E', border:'#16A34A', ring: 'transparent'},
        safe:    {fill:'#64748B', border:'#475569', ring: 'transparent'}
      };

      const filteredCities = CITIES.filter(c => {
        if (riskFilter !== 'all' && c.baseRisk !== riskFilter) return false;
        if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      });

      filteredCities.forEach(async (city) => {
        const c = riskColors[city.baseRisk] || riskColors.safe;
        
        // Main Marker Dot
        const dot = L.circleMarker([city.lat, city.lng], {
          radius: 8,
          fillColor: c.fill,
          fillOpacity: 1,
          color: '#FFFFFF',
          weight: 2,
        }).addTo(layerGroupRef.current!);

        // Pulsing Ring for High/Extreme
        if (city.baseRisk === 'extreme' || city.baseRisk === 'high') {
          const ring = L.circle([city.lat, city.lng], {
            radius: city.baseRisk === 'extreme' ? 40000 : 25000,
            fillColor: c.ring,
            fillOpacity: 0.3,
            color: 'transparent',
            className: 'pulse-ring'
          }).addTo(layerGroupRef.current!);
        }

        dot.on('click', async (e) => {
          const weather = await getWeatherByCoords(city.lat, city.lng);
          const aqi = await getAQIByCoords(city.lat, city.lng);
          
          const popupContent = `
            <div style="min-width:240px; font-family: Inter, sans-serif;">
              <div style="background:#6C47FF; color:white; padding:12px; border-radius:8px 8px 0 0; font-weight:700; display:flex; justify-content:between; align-items:center;">
                <span>📍 ${city.name.toUpperCase()}</span>
                <span style="background:rgba(255,255,255,0.2); padding:2px 8px; border-radius:99px; font-size:10px; margin-left:auto;">
                  ${city.baseRisk.toUpperCase()}
                </span>
              </div>
              <div style="padding:12px; background:white; border:1px solid #E8E6FF; border-top:none; border-radius:0 0 8px 8px;">
                <div style="display:grid; grid-template-cols: 1fr 1fr; gap:8px; margin-bottom:12px;">
                  <div>
                    <p style="font-size:9px; color:#64748B; text-transform:uppercase; font-weight:700;">Rainfall</p>
                    <p style="font-size:14px; font-weight:700; color:#1A1A2E;">${weather.rainfall}mm</p>
                  </div>
                  <div>
                    <p style="font-size:9px; color:#64748B; text-transform:uppercase; font-weight:700;">AQI</p>
                    <p style="font-size:14px; font-weight:700; color:${aqi.color};">${aqi.aqi} (${aqi.label})</p>
                  </div>
                  <div>
                    <p style="font-size:9px; color:#64748B; text-transform:uppercase; font-weight:700;">Temp</p>
                    <p style="font-size:14px; font-weight:700; color:#1A1A2E;">${weather.temp}°C</p>
                  </div>
                  <div>
                    <p style="font-size:9px; color:#64748B; text-transform:uppercase; font-weight:700;">Humidity</p>
                    <p style="font-size:14px; font-weight:700; color:#1A1A2E;">${weather.humidity}%</p>
                  </div>
                </div>
                <hr style="border:none; border-top:1px solid #E8E6FF; margin:12px 0;">
                <div style="font-size:11px; color:#64748B; margin-bottom:12px;">
                  Active Workers: <b>234</b><br>
                  At Risk: <b>${city.baseRisk === 'extreme' ? 145 : 42}</b>
                </div>
                <button style="width:100%; background:#6C47FF; color:white; border:none; padding:8px; border-radius:6px; font-weight:700; font-size:12px; cursor:pointer;">
                  ⚡ Trigger City Alert
                </button>
              </div>
            </div>
          `;
          dot.bindPopup(popupContent, { maxWidth: 280, className: 'custom-popup' }).openPopup();
        });
      });
    };

    renderZones();
  }, [searchQuery, riskFilter, dataType]);

  return (
    <div className="w-full h-full relative">
      <style jsx global>{`
        .pulse-ring {
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(0.9); opacity: 0.7; }
          70% { transform: scale(1); opacity: 0.3; }
          100% { transform: scale(0.9); opacity: 0.7; }
        }
        .leaflet-popup-content-wrapper {
          padding: 0 !important;
          overflow: hidden;
          border-radius: 12px !important;
          box-shadow: 0 10px 25px rgba(108, 71, 255, 0.15) !important;
        }
        .leaflet-popup-content {
          margin: 0 !important;
        }
        .leaflet-popup-tip-container {
          display: none;
        }
      `}</style>
      <div ref={mapContainerRef} className="w-full h-full rounded-2xl overflow-hidden border border-[#E8E6FF] shadow-lg" />
      
      {/* Legend */}
      <div className="absolute bottom-6 left-6 z-[1000] bg-white border-2 border-[#6C47FF] p-4 rounded-xl shadow-xl min-w-[180px]">
        <p className="text-xs font-black text-[#1A1A2E] uppercase tracking-widest mb-3 border-b border-[#E8E6FF] pb-2">Disruption Legend</p>
        <div className="space-y-2">
          <div className="flex items-center gap-3"><div className="h-3 w-3 rounded-full bg-[#EF4444] shadow-[0_0_8px_rgba(239,68,68,0.5)]" /><span className="text-[10px] font-bold text-[#1A1A2E]">Extreme Risk</span></div>
          <div className="flex items-center gap-3"><div className="h-3 w-3 rounded-full bg-[#F59E0B] shadow-[0_0_8px_rgba(245,158,11,0.5)]" /><span className="text-[10px] font-bold text-[#1A1A2E]">High Risk</span></div>
          <div className="flex items-center gap-3"><div className="h-3 w-3 rounded-full bg-[#EAB308] shadow-[0_0_8px_rgba(234,179,8,0.5)]" /><span className="text-[10px] font-bold text-[#1A1A2E]">Medium Risk</span></div>
          <div className="flex items-center gap-3"><div className="h-3 w-3 rounded-full bg-[#22C55E]" /><span className="text-[10px] font-bold text-[#1A1A2E]">Low Risk</span></div>
          <div className="flex items-center gap-3"><div className="h-3 w-3 rounded-full bg-[#64748B]" /><span className="text-[10px] font-bold text-[#1A1A2E]">Safe Zone</span></div>
        </div>
      </div>
    </div>
  );
}