import React, { useEffect, useRef, useCallback, useState } from 'react';
import L from 'leaflet';
import { useAppStore, Drop } from '../store/appStore';
import { fetchNearbyDrops } from '../lib/api';
import BottomSheet from '../components/BottomSheet';
import LocationSetter from '../components/LocationSetter';

const PICKUP_RANGE = 50;
const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const LIGHT_TILES = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

const VOTD_VERSES = [
  { ref: 'Psalm 118:24', text: 'This is the day which the LORD hath made; we will rejoice and be glad in it.' },
  { ref: 'Lamentations 3:22-23', text: 'It is of the LORD\'s mercies that we are not consumed. They are new every morning: great is thy faithfulness.' },
  { ref: 'Proverbs 3:5-6', text: 'Trust in the LORD with all thine heart; and lean not unto thine own understanding.' },
  { ref: 'Philippians 4:13', text: 'I can do all things through Christ which strengtheneth me.' },
  { ref: 'Isaiah 40:31', text: 'But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles.' },
  { ref: 'Romans 8:28', text: 'And we know that all things work together for good to them that love God.' },
  { ref: 'Psalm 46:10', text: 'Be still, and know that I am God.' },
];

// Points of interest to show on the map
const POI_TYPES = {
  church: { emoji: '⛪', label: 'Church' },
  park: { emoji: '🌳', label: 'Park' },
  cross: { emoji: '✝️', label: 'Memorial' },
  school: { emoji: '🏫', label: 'School' },
};

function getVotd() {
  const day = Math.floor(Date.now() / 86400000);
  return VOTD_VERSES[day % VOTD_VERSES.length];
}

export default function MapScreen() {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [showVotd, setShowVotd] = useState(true);
  const [showLocationSetter, setShowLocationSetter] = useState(false);
  const [locationMode, setLocationMode] = useState<'auto' | 'manual'>('auto');
  const centeredOnceRef = useRef(false);

  const userLocation = useAppStore((s) => s.userLocation);
  const nearbyDrops = useAppStore((s) => s.nearbyDrops);
  const selectedDrop = useAppStore((s) => s.selectedDrop);
  const showComposer = useAppStore((s) => s.showComposer);
  const theme = useAppStore((s) => s.theme);
  const setUserLocation = useAppStore((s) => s.setUserLocation);
  const setNearbyDrops = useAppStore((s) => s.setNearbyDrops);
  const setSelectedDrop = useAppStore((s) => s.setSelectedDrop);
  const setShowComposer = useAppStore((s) => s.setShowComposer);

  const votd = getVotd();
  const inRangeCount = nearbyDrops.filter((d) => (d.distance_meters ?? Infinity) <= PICKUP_RANGE && !d.is_picked_up).length;

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [39.7392, -104.9903],
      zoom: 17,
      zoomControl: true,
      attributionControl: true,
      maxZoom: 19,
      minZoom: 3,
    });

    const initialTiles = useAppStore.getState().theme === 'light' ? LIGHT_TILES : DARK_TILES;
    tileLayerRef.current = L.tileLayer(initialTiles, {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    // Click map to set location in manual mode
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (locationMode === 'manual' || true) {
        // Always allow click-to-set for desktop testing
        setUserLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
        setLocationMode('manual');
      }
    });

    mapRef.current = map;
    setMapReady(true);

    return () => {
      tileLayerRef.current = null;
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  // Swap tile layer when theme changes
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;
    const tiles = theme === 'light' ? LIGHT_TILES : DARK_TILES;
    tileLayerRef.current.setUrl(tiles);
  }, [theme]);

  // Center map + add user marker
  useEffect(() => {
    if (!mapReady || !mapRef.current || !userLocation) return;

    // Only auto-center on first load or when user explicitly recenters
    if (!centeredOnceRef.current) {
      mapRef.current.setView([userLocation.lat, userLocation.lng], 17, { animate: true });
      centeredOnceRef.current = true;
    }

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
    } else {
      const icon = L.divIcon({
        className: 'user-marker',
        html: '<div class="user-marker-outer"></div><div class="user-marker-inner"></div>',
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      });
      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon, zIndexOffset: 1000 })
        .addTo(mapRef.current);
    }

    if (radiusCircleRef.current) {
      radiusCircleRef.current.setLatLng([userLocation.lat, userLocation.lng]);
    } else {
      radiusCircleRef.current = L.circle([userLocation.lat, userLocation.lng], {
        radius: 200,
        fillColor: 'rgba(200, 151, 58, 0.04)',
        fillOpacity: 1,
        color: 'rgba(200, 151, 58, 0.15)',
        weight: 1,
        dashArray: '4 6',
      }).addTo(mapRef.current);
    }
  }, [mapReady, userLocation]);

  // Force refetch drops
  const forceRefresh = useCallback(async () => {
    if (!userLocation) return;
    try {
      const drops = await fetchNearbyDrops(userLocation.lat, userLocation.lng, 500);
      setNearbyDrops(drops);
    } catch (err) {
      console.error('Failed to fetch drops:', err);
    }
  }, [userLocation, setNearbyDrops]);

  // Poll for drops
  useEffect(() => {
    if (!userLocation) return;
    forceRefresh();
    const interval = setInterval(forceRefresh, 10000);
    return () => clearInterval(interval);
  }, [userLocation, forceRefresh]);

  // Refetch when composer closes
  const prevShowComposer = useRef(showComposer);
  useEffect(() => {
    if (prevShowComposer.current && !showComposer) {
      forceRefresh();
    }
    prevShowComposer.current = showComposer;
  }, [showComposer, forceRefresh]);

  // Render drop orbs
  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    nearbyDrops.forEach((drop) => {
      const isPickedUp = drop.is_picked_up;
      const dist = drop.distance_meters ?? Infinity;
      const isInRange = dist <= PICKUP_RANGE;
      const size = isPickedUp ? 16 : 22;

      const pulseHtml = isInRange && !isPickedUp
        ? '<div class="drop-orb-pulse"></div>'
        : '';

      const icon = L.divIcon({
        className: 'drop-orb',
        html: `<div class="drop-orb-inner ${isPickedUp ? 'picked-up' : 'active'} ${isInRange && !isPickedUp ? 'in-range' : ''}" style="width:${size}px;height:${size}px">${pulseHtml}</div>`,
        iconSize: [size + 20, size + 20],
        iconAnchor: [(size + 20) / 2, (size + 20) / 2],
      });

      const marker = L.marker([drop.latitude, drop.longitude], { icon })
        .addTo(mapRef.current!)
        .on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          setSelectedDrop(drop);
          mapRef.current?.panTo([drop.latitude, drop.longitude], { animate: true });
        });

      markersRef.current.push(marker);
    });
  }, [nearbyDrops, setSelectedDrop]);

  const handleRecenter = useCallback(() => {
    if (mapRef.current && userLocation) {
      mapRef.current.setView([userLocation.lat, userLocation.lng], 17, { animate: true });
    }
  }, [userLocation]);

  const handleSetLocation = (lat: number, lng: number) => {
    setUserLocation({ lat, lng });
    setLocationMode('manual');
    setShowLocationSetter(false);
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 17, { animate: true });
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* Top bar — brand + live count */}
      <div className="map-header">
        <div className="map-brand">VerseDrop</div>
        {nearbyDrops.length > 0 && (
          <div className="nearby-badge">
            <span className="nearby-dot" />
            <span><strong>{nearbyDrops.filter(d => !d.is_picked_up).length}</strong> nearby</span>
            {inRangeCount > 0 && <span><span className="in-range">·</span> <span className="in-range">{inRangeCount} in range</span></span>}
          </div>
        )}
      </div>

      {/* Verse of the Day */}
      {showVotd && (
        <div className="votd-card" onClick={() => setShowVotd(false)}>
          <div className="votd-header">
            <div className="votd-label">Verse of the Day</div>
            <button
              className="votd-close"
              onClick={(e) => { e.stopPropagation(); setShowVotd(false); }}
              aria-label="Dismiss verse of the day"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="votd-text">&ldquo;{votd.text}&rdquo;</div>
          <div className="votd-ref">— {votd.ref}</div>
        </div>
      )}

      {/* Bottom left controls */}
      <div className="map-bottom-left">
        <button className="recenter-btn" onClick={handleRecenter} title="Re-center" aria-label="Re-center map on my location">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="2" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="22" y2="12" />
          </svg>
        </button>

        <button className="recenter-btn" onClick={() => setShowLocationSetter(true)} title="Set location manually" aria-label="Set location manually">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </button>
      </div>

      {/* Location mode indicator */}
      {locationMode === 'manual' && (
        <div className="location-mode-badge">
          📍 Manual — click map to move
        </div>
      )}

      {/* FAB */}
      <button className="fab" onClick={() => setShowComposer(true)}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {selectedDrop && <BottomSheet drop={selectedDrop} />}
      {showLocationSetter && <LocationSetter onSet={handleSetLocation} onClose={() => setShowLocationSetter(false)} />}
    </div>
  );
}
