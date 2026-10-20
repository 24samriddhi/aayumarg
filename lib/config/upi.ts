/** Where patients pay. Change these two lines if the client's UPI ID or QR changes (QR image: public/upi-qr.png). */
export const UPI = {
  id: "shikharchepe7@oksbi",
  name: "Dr. Shikhar Chepe",
} as const;

export const upiLink = (amountRupees: number, ref: string) =>
  `upi://pay?pa=${UPI.id}&pn=${encodeURIComponent(UPI.name)}&am=${amountRupees}&cu=INR&tn=${encodeURIComponent(ref)}`;
