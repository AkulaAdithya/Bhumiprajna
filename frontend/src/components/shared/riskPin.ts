/**
 * Bhumi Prajna - Risk map marker
 * Compact circular marker (Leaflet DivIcon) shared by the GIS page and the
 * public landing/login map previews.
 */

import L from 'leaflet';

const cache = new Map<string, L.DivIcon>();

/** Circular marker in the given risk colour. `size` is the dot diameter in px (default 14). */
export function riskPinIcon(color: string, size = 14): L.DivIcon {
  const key = `${color}-${size}`;
  const hit = cache.get(key);
  if (hit) return hit;

  // Soft halo around a solid dot with a white ring
  const box = size + 8;
  const c = box / 2;
  const icon = L.divIcon({
    className: 'bp-risk-dot',
    html: `<svg width="${box}" height="${box}" viewBox="0 0 ${box} ${box}" style="display:block;overflow:visible">
      <circle cx="${c}" cy="${c}" r="${c}" fill="${color}" fill-opacity="0.18"/>
      <circle cx="${c}" cy="${c}" r="${size / 2}" fill="${color}" stroke="#fff" stroke-width="2" style="filter:drop-shadow(0 1px 1.5px rgba(24,49,83,0.3))"/>
    </svg>`,
    iconSize: [box, box],
    iconAnchor: [c, c],
    popupAnchor: [0, -c],
    tooltipAnchor: [0, -c],
  });
  cache.set(key, icon);
  return icon;
}
