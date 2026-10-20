/**
 * DUMMY DATA — placeholder stories so the UI is not empty during the demo.
 * Replace with real, consented patient feedback before the public launch
 * (publishing made-up reviews as genuine is not allowed under Indian consumer rules).
 */
export interface Testimonial {
  id: string;
  name: string;
  /** Shown under the name: city + service. */
  meta: string;
  quote: string;
  rating: number; // 1-5
  /** Anonymous = name withheld on purpose (used for sensitive services). */
  anonymous?: boolean;
  /** Language tag so screen readers pronounce it properly. */
  lang: "hi" | "hi-Latn";
}

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "t1",
    name: "सुनीता वर्मा",
    meta: "बिलासपुर · Elderly Care",
    quote:
      "पापा के घर पर चेकअप की बुकिंग बहुत आसान रही। सारी रिपोर्ट्स अब एक ही जगह मिल जाती हैं, बार-बार फाइल ढूँढनी नहीं पड़ती।",
    rating: 5,
    lang: "hi",
  },
  {
    id: "t2",
    name: "Rohit Agrawal",
    meta: "Raipur · Second Opinion",
    quote:
      "Surgery ka suggestion aaya tha, toh yahan se second opinion liya. Specialist ne saari reports dekhkar saaf-saaf samjhaya. Bahut tasalli mili.",
    rating: 5,
    lang: "hi-Latn",
  },
  {
    id: "t3",
    name: "Anonymous",
    meta: "Sexual Health · Name withheld",
    quote:
      "Is topic par kisi se baat karna hamesha mushkil lagta tha. Yahan bina jhijhak consult book kar paaya aur sab kuch private raha. Shukriya.",
    rating: 5,
    anonymous: true,
    lang: "hi-Latn",
  },
  {
    id: "t4",
    name: "प्रिया शर्मा",
    meta: "भिलाई · Mental Health",
    quote:
      "बहुत दिनों से तनाव में थी। यहाँ काउंसलर से बात करके हल्का महसूस हुआ, और मेरी प्राइवेसी का पूरा ध्यान रखा गया।",
    rating: 5,
    lang: "hi",
  },
  {
    id: "t5",
    name: "Anonymous",
    meta: "Sexual Health · Name withheld",
    quote:
      "Discreet booking aur bina judge kiye consultation. Mere records bhi sirf mere paas rehte hain. Sach mein bharosa mila.",
    rating: 5,
    anonymous: true,
    lang: "hi-Latn",
  },
  {
    id: "t6",
    name: "Mohammed Irfan",
    meta: "Durg · Vitals Vault",
    quote:
      "Ammi ka BP aur sugar pehle copy mein likhte the. Ab sab app mein ek jagah hai, doctor ko seedha dikha dete hain.",
    rating: 4,
    lang: "hi-Latn",
  },
];
