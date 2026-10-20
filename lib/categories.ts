import type { Booking, CategoryId } from "@/lib/types";

export interface CareCategory {
  id: CategoryId;
  title: string;
  /** Privacy label shown on the card (Mental / Sexual Health). */
  badge?: string;
  blurb: string;
  service: string;
  image: string;
  position: string;
  confidential: boolean;
}

export const CATEGORIES: CareCategory[] = [
  {
    id: "elderly", title: "Elderly Care",
    blurb: "Home visits, nurse support and routine checkups for parents and grandparents.",
    service: "Elderly Care OPD", image: "/assets/images/elderly_care_female_doctor_with_senior.webp", position: "center",
    confidential: false,
  },
  {
    id: "second-opinion", title: "Second Opinion",
    blurb: "Share your reports and get an independent specialist review before you decide.",
    service: "Second Opinion OPD", image: "/assets/images/second_opinion_woman_doctor_tablet.webp", position: "50% 40%",
    confidential: false,
  },
  {
    id: "mental-health", title: "Mental Health", badge: "Confidential",
    blurb: "A private space to talk with a qualified professional, at your pace.",
    service: "Mental Health OPD", image: "/assets/images/mental_health_male_doctor_consultation.webp", position: "center",
    confidential: true,
  },
  {
    id: "sexual-health", title: "Sexual Health", badge: "Discreet",
    blurb: "Discreet consultations and records, shared with no one unless you choose.",
    service: "Sexual Health OPD", image: "/assets/images/sexual_health_female_doctor_tablet.webp", position: "center",
    confidential: true,
  },
];

export const categoryById = (id?: CategoryId) => CATEGORIES.find((c) => c.id === id);

/** Label safe to show on shared screens: confidential bookings stay generic. */
export function bookingLabel(b: Pick<Booking, "service" | "category">): string {
  return categoryById(b.category)?.confidential ? "Confidential consultation" : b.service;
}
