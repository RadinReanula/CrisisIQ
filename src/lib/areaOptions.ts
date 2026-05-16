/** Shared Sri Lanka area presets for GPS fallback (volunteer + public submit). */
export const AREA_OPTIONS = [
  { id: 'colombo', label: 'Colombo', lat: 6.9271, lng: 79.8612 },
  { id: 'kandy', label: 'Kandy', lat: 7.2906, lng: 80.6337 },
  { id: 'galle', label: 'Galle', lat: 6.0535, lng: 80.221 },
  { id: 'jaffna', label: 'Jaffna', lat: 9.6615, lng: 80.0255 },
  { id: 'negombo', label: 'Negombo', lat: 7.2088, lng: 79.8358 },
  { id: 'kurunegala', label: 'Kurunegala', lat: 7.4818, lng: 80.365 },
  { id: 'anuradhapura', label: 'Anuradhapura', lat: 8.3114, lng: 80.4037 },
  { id: 'batticaloa', label: 'Batticaloa', lat: 7.7102, lng: 81.6924 },
  { id: 'matara', label: 'Matara', lat: 5.9549, lng: 80.555 },
  { id: 'ratnapura', label: 'Ratnapura', lat: 6.6828, lng: 80.4032 },
] as const;

export type AreaId = (typeof AREA_OPTIONS)[number]['id'];
