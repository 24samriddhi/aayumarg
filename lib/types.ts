export interface Profile {
  name: string; age: string; gender: string; phone: string;
  emergency: string; address: string;
  type: "Elderly" | "General Public";
  caregiverName: string; caregiverPhone: string;
}

export interface Vital {
  id?: string;
  date: string; bp: string; hr: string; spo2: string;
  temp: string; sugar: string; weight: string;
}

export interface MedicalDocument {
  id: string; name: string; size: number; type: string; date: string;
}

export type CategoryId = "elderly" | "second-opinion" | "mental-health" | "sexual-health";

export interface Booking {
  id?: string;
  service: string; date: string; time: string; reason: string; status: string;
  /** Set when booked through a care category (OPD modal). */
  category?: CategoryId;
  patientId?: string; patientName?: string;
  /** Names of files attached to the booking (files themselves go through POST /documents). */
  attachments?: string[];
  /** Set by the backend: short booking code (e.g. AM-7K3Q9X). */
  ref?: string;
  /** Set by the backend. "unpaid" until the patient submits a UTR, "submitted" until the doctor confirms. */
  paymentStatus?: "unpaid" | "submitted" | "paid";
  /** Consultation fee in rupees (set by the backend). */
  amount?: number;
}

export interface FamilyMember { id: string; name: string; relation: string }

export interface AiMessage { role: "user" | "assistant"; content: string }
export interface AiChatResponse { reply: string }
export interface AiHealthSummary { summary: string; generatedAt: string }
