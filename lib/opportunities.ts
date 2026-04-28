export type FeaturedOpportunity = {
  id: string;
  title: string;
  meta: string;
  location: string;
  duration: string;
  pay: string;
  description: string;
  requirements?: string[];
};

export const featuredOpportunities: FeaturedOpportunity[] = [
  {
    id: "short-doc-sound-recordist",
    title: "Short doc — sound recordist",
    meta: "Cape Town • 2 days • Paid",
    location: "Cape Town",
    duration: "2 days",
    pay: "Paid",
    description:
      "Small documentary crew looking for a sound recordist for an intimate two-day shoot. Clean dialogue capture is the priority; minimal kit, fast moving locations.",
    requirements: ["Recorder + lav kit", "Boom mic + pole", "Reliable monitoring", "On-set etiquette + quick turnaround"],
  },
  {
    id: "commercial-gaffer-swing",
    title: "Commercial — gaffer + swing",
    meta: "Johannesburg • Friday • Paid",
    location: "Johannesburg",
    duration: "Friday",
    pay: "Paid",
    description:
      "One-day commercial shoot. Looking for an experienced gaffer with a reliable swing. Efficiency and safety-first rigging required. Tight schedule, high standards.",
    requirements: ["Gaffer experience on commercial sets", "Basic grip/rigging knowledge", "Can work fast and safely", "Own transport preferred"],
  },
];

export function getFeaturedOpportunity(id: string) {
  return featuredOpportunities.find((o) => o.id === id) ?? null;
}

