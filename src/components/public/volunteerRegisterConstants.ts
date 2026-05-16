export const SKILL_OPTIONS = [
  'First Aid',
  'Search & Rescue',
  'Medical',
  'Logistics',
  'Translation',
  'Driving',
  'Other',
] as const;

export type VolunteerSkillOption = (typeof SKILL_OPTIONS)[number];

export type VolunteerAvailability = 'available' | 'standby';
