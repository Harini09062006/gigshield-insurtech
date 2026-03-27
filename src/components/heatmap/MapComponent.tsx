'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { CityRiskData } from '@/services/weatherService';

interface MapProps {
  data: CityRiskData[];
  activeFilter: string;
}

const API_KEY = "be5f61ff6b261dedfa89e321d466a063";

export default function MapComponent({ data, activeFilter }: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const rainLayerRef = useRef<L.TileLayer | null>(null);

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
        [6.0, 68.0],
        [37.0, 97.0]
      ],
      maxBoundsViscosity: 1.0
    });

    // Base Layer - Light Theme
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    // Rain Tile Overlay
    const rainLayer = L.tileLayer(
      `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${API_KEY}`,
      { opacity: 0.6 }
    ).addTo(map);
    rainLayerRef.current = rainLayer;

    mapRef.current = map;
    
    // Initialize Cluster Group
    const clusters = (L as any).markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      zoomToBoundsOnClick: true,
      maxClusterRadius: 40
    });
    clusters.addTo(map);
    clusterGroupRef.current = clusters;

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
    if (!mapRef.current || !clusterGroupRef.current) return;
    
    clusterGroupRef.current.clearLayers();

    const filtered = activeFilter === 'ALL' 
      ? data 
      : data.filter(c => c.riskLevel === activeFilter);

    console.log(`Active Filter: ${activeFilter}`, filtered);

    filtered.forEach(city => {
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

      // Delivery Insight Logic
      let recommendation = "✅ Safe for delivery";
      let statusColor = "#22C55E";
      if (rainfall > 50) {
        recommendation = "🚫 Deliveries not recommended";
        statusColor = "#EF4444";
      } else if (rainfall > 30) {
        recommendation = "⚠️ Risky for delivery";
        statusColor = "#F59E0B";
      }

      // Simulated workers at risk
      const workersAtRisk = Math.floor(Math.random() * 180) + 20;
      
      // Google Maps style pin (teardrop)
      const icon = L.divIcon({
        className: 'custom-pin-container',
        html: `
          <div class="pin" style="background-color: ${color}; border: 1px solid white;">
            <div class="pin-inner"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 24],
        popupAnchor: [0, -24]
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
              <div class="data-row"><span>💧 Humidity</span> <b>${city.humidity}%</b></div>
            </div>

            <div class="progress-container">
              <div class="progress-bar-bg">
                <div class="progress-bar-fill" style="width: ${progress}%; background: ${color}"></div>
              </div>
              <div class="progress-label">Threshold: 50mm</div>
            </div>

            <div class="insight-box" style="border-left: 3px solid ${statusColor}">
              <div class="recommendation" style="color: ${statusColor}">${recommendation}</div>
              <div class="worker-stat">Estimated Workers at Risk: <b>${workersAtRisk}</b></div>
            </div>

            <button class="action-btn" onclick="console.log('Alert sent for ${city.name}')">
              SEND OPS ALERT
            </button>
          </div>
        </div>
      `;

      const marker = L.marker([city.lat, city.lng], { icon })
        .bindPopup(popupHtml, { maxWidth: 260, className: 'leaflet-modern-popup' });

      clusterGroupRef.current!.addLayer(marker);

      if (!(window as any).cityMarkers) (window as any).cityMarkers = {};
      (window as any).cityMarkers[city.name.toLowerCase()] = marker;
    });
  }, [data, activeFilter]);

  return (
    <div className="w-full h-full relative">
      <style jsx global>{`
        .pin {
          width: 24px;
          height: 24px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          position: relative;
          box-shadow: 0 4px 8px rgba(0,0,0,0.25);
          transition: transform 0.2s ease;
        }
        .pin:hover { transform: rotate(-45deg) scale(1.2); z-index: 1000; }
        .pin-inner {
          width: 10px;
          height: 10px;
          background: white;
          border-radius: 50%;
          position: absolute;
          top: 7px;
          left: 7px;
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
        
        .modern-popup { font-family: 'Inter', sans-serif; }
        .popup-header { color: white; padding: 14px 18px; font-weight: 800; font-size: 13px; letter-spacing: 0.5px; }
        .popup-body { padding: 18px; color: #1A1A2E; }
        
        .risk-badge { 
          padding: 6px 12px; 
          border-radius: 20px; 
          font-weight: 800; 
          font-size: 10px; 
          display: inline-block; 
          margin-bottom: 14px;
          letter-spacing: 0.5px;
        }
        
        .data-section { margin-bottom: 16px; border-bottom: 1px solid #E8E6FF; padding-bottom: 12px; }
        .data-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 12px; }
        .data-row span { color: #64748B; font-weight: 500; }
        
        .progress-container { margin-bottom: 16px; }
        .progress-bar-bg { height: 8px; background: #EEEEFF; border-radius: 4px; overflow: hidden; margin-bottom: 4px; }
        .progress-bar-fill { height: 100%; border-radius: 4px; transition: width 1s ease-out; }
        .progress-label { font-size: 9px; color: #94A3B8; font-weight: 700; text-align: right; text-transform: uppercase; }
        
        .insight-box { background: #F8F9FF; padding: 10px 14px; border-radius: 8px; margin-bottom: 16px; }
        .recommendation { font-weight: 800; font-size: 12px; margin-bottom: 4px; }
        .worker-stat { font-size: 11px; color: #64748B; }
        
        .action-btn { 
          width: 100%; 
          background: #6C47FF; 
          color: white; 
          border: none; 
          padding: 10px; 
          border-radius: 10px; 
          font-weight: 800; 
          font-size: 11px; 
          cursor: pointer;
          transition: background 0.2s;
        }
        .action-btn:hover { background: #5535E8; }
      `}</style>
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
