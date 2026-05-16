import { useEffect, useMemo } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { Need } from '../../types';
import {
  classifyUrgency,
  NEED_TYPE_LABEL,
  SRI_LANKA_CENTER,
  SRI_LANKA_DEFAULT_ZOOM,
  URGENCY_BADGE_CLASS,
  type ThreatUrgencyLabel,
} from './threatUtils';
import './threatMap.css';

interface ThreatMapProps {
  threats: Need[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const ICON_CACHE = new Map<string, L.DivIcon>();

function getMarkerIcon(urgency: ThreatUrgencyLabel, isSelected: boolean): L.DivIcon {
  const cacheKey = `${urgency}-${isSelected ? 'sel' : 'idle'}`;
  const cached = ICON_CACHE.get(cacheKey);
  if (cached) return cached;

  const html = `<span class="threat-marker-pin threat-marker-pin--${urgency}${
    isSelected ? ' threat-marker-pin--selected' : ''
  }"></span>`;

  const icon = L.divIcon({
    html,
    className: 'threat-marker-wrapper',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });

  ICON_CACHE.set(cacheKey, icon);
  return icon;
}

/**
 * Pans the map to the selected threat whenever the selection or threat list changes.
 * Must be a child of MapContainer so useMap() resolves.
 */
function FlyToSelected({
  threats,
  selectedId,
}: {
  threats: Need[];
  selectedId: string | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!selectedId) return;
    const target = threats.find((t) => t.id === selectedId);
    if (!target) return;
    map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 12), {
      duration: 0.8,
    });
  }, [map, threats, selectedId]);

  return null;
}

export function ThreatMap({ threats, selectedId, onSelect }: ThreatMapProps) {
  // Memoize so changing selection doesn't recompute the marker list.
  const markers = useMemo(
    () =>
      threats.map((threat) => {
        const urgency = classifyUrgency(threat);
        const isSelected = threat.id === selectedId;
        return {
          threat,
          urgency,
          icon: getMarkerIcon(urgency, isSelected),
        };
      }),
    [threats, selectedId],
  );

  return (
    <div className="threat-map-container">
      <MapContainer
        center={SRI_LANKA_CENTER}
        zoom={SRI_LANKA_DEFAULT_ZOOM}
        minZoom={3}
        maxZoom={18}
        scrollWheelZoom
        worldCopyJump
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains={['a', 'b', 'c', 'd']}
        />

        {markers.map(({ threat, urgency, icon }) => (
          <Marker
            key={threat.id}
            position={[threat.lat, threat.lng]}
            icon={icon}
            eventHandlers={{
              click: () => onSelect(threat.id),
            }}
          >
            <Popup>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${URGENCY_BADGE_CLASS[urgency]}`}
                  >
                    {urgency}
                  </span>
                  <span className="text-xs text-slate-400">
                    {NEED_TYPE_LABEL[threat.need_type]}
                  </span>
                </div>
                <p className="text-sm font-semibold text-white">{threat.submitter_name}</p>
                <p className="text-xs text-slate-300 line-clamp-3">{threat.description}</p>
                <p className="text-[10px] text-slate-500">
                  {threat.lat.toFixed(4)}, {threat.lng.toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

        <FlyToSelected threats={threats} selectedId={selectedId} />
      </MapContainer>
    </div>
  );
}
