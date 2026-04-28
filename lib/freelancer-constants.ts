/** Curated specializations for multi-select (display + validation). */
export const FREELANCER_SPECIALIZATIONS = [
  "Director",
  "DP / Cinematographer",
  "Camera Operator",
  "Gaffer",
  "Key Grip",
  "Sound Mixer",
  "Boom Operator",
  "Editor",
  "Colorist",
  "VFX",
  "Motion Graphics",
  "Producer",
  "Production Assistant",
  "Hair & Makeup",
  "Stylist",
  "Photographer",
  "Drone Operator",
  "Script Supervisor",
  "Art Department",
  "Set Design",
  "Wardrobe",
] as const;

export type FreelancerSpecialization = (typeof FREELANCER_SPECIALIZATIONS)[number];

export const FREELANCER_SPECIALIZATION_SET = new Set<string>(FREELANCER_SPECIALIZATIONS);

/** Suggested gear tags for quick-add in filters (users can add any tag). */
export const SUGGESTED_GEAR_TAGS = [
  "Sony FX",
  "ARRI",
  "RED",
  "Canon C",
  "Blackmagic",
  "Lighting package",
  "G&E truck",
  "Sound Devices",
  "Wireless lav",
  "Ronin",
  "Figma",
  "Premiere",
  "DaVinci",
  "Avid",
] as const;
