'use client';

import { useEffect, useRef, useState } from 'react';

interface Branch {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  openingHours?: string;
  description?: string;
  isActive: boolean;
}

interface BranchMapProps {
  branches: Branch[];
  center: [number, number];
  selectedBranch: Branch | null;
  onMapClick?: (lat: number, lng: number) => void;
  onMarkerClick?: (branch: Branch) => void;
}

export default function BranchMap({
  branches,
  center,
  selectedBranch,
  onMapClick,
  onMarkerClick,
}: BranchMapProps) {
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load Leaflet dynamically
    Promise.all([
      import('leaflet'),
      import('leaflet/dist/leaflet.css'),
    ]).then(([L]) => {
      // Fix for default marker icon in Next.js
      delete (L.default.Icon.Default.prototype as any)._getIconUrl;
      L.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });

      setLeafletLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || !leafletLoaded) return;

    const L = require('leaflet');

    // Initialize map
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView(center, 13);

      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapRef.current);

      // Handle map click
      if (onMapClick) {
        mapRef.current.on('click', (e: any) => {
          onMapClick(e.latlng.lat, e.latlng.lng);
        });
      }
    } else {
      mapRef.current.setView(center, mapRef.current.getZoom());
    }

    // Clean up markers
    markersRef.current.forEach((marker) => {
      marker.remove();
    });
    markersRef.current = [];

    // Create custom icon
    const createIcon = (isActive: boolean, isSelected: boolean) => {
      return L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          background-color: ${isSelected ? '#3b82f6' : isActive ? '#10b981' : '#ef4444'};
          width: 30px;
          height: 30px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">
          <div style="
            transform: rotate(45deg);
            color: white;
            font-size: 18px;
            line-height: 24px;
            text-align: center;
          ">📍</div>
        </div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
      });
    };

    // Add markers for each branch
    branches.forEach((branch) => {
      const isSelected = selectedBranch?.id === branch.id;
      const marker = L.marker([branch.latitude, branch.longitude], {
        icon: createIcon(branch.isActive, isSelected),
      })
        .addTo(mapRef.current)
        .bindPopup(`
          <div style="min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold;">${branch.name}</h3>
            <p style="margin: 4px 0; font-size: 12px;">${branch.address}</p>
            ${branch.phone ? `<p style="margin: 4px 0; font-size: 12px;">📞 ${branch.phone}</p>` : ''}
            ${branch.description ? `<p style="margin: 4px 0; font-size: 12px;">${branch.description}</p>` : ''}
          </div>
        `);

      if (onMarkerClick) {
        marker.on('click', () => {
          onMarkerClick(branch);
        });
      }

      markersRef.current.push(marker);
    });

    // Center on selected branch
    if (selectedBranch) {
      mapRef.current.setView([selectedBranch.latitude, selectedBranch.longitude], 15);
    }

    return () => {
      // Cleanup markers on unmount
      markersRef.current.forEach((marker) => {
        if (mapRef.current) {
          mapRef.current.removeLayer(marker);
        }
      });
      markersRef.current = [];
    };
  }, [branches, center, selectedBranch, onMapClick, onMarkerClick, leafletLoaded]);

  if (!leafletLoaded) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-panel">
        <div className="text-text-secondary">Cargando mapa...</div>
      </div>
    );
  }

  return (
    <div
      ref={mapContainerRef}
      style={{ width: '100%', height: '100%', minHeight: '500px' }}
    />
  );
}
