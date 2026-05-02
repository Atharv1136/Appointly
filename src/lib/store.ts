// Local mock store. Replace with API calls once backend is ready.
export type Role = "customer" | "organiser" | "admin";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
};

export type Provider = {
  id: string;
  name: string;
  title: string;
  initials: string;
};

export type AppointmentType = {
  id: string;
  title: string;
  description: string;
  durationMins: number;
  organiser: string;
  category: string;
  providers: Provider[];
  manageCapacity: boolean;
  maxCapacity: number;
  advancePayment: boolean;
  paymentAmount: number;
  currency: string;
  manualConfirm: boolean;
  questions: { id: string; label: string; type: "text" | "textarea" | "select"; options?: string[]; required: boolean }[];
  workingHours: { start: string; end: string }; // HH:MM 24h
};

export type BookingStatus = "pending" | "confirmed" | "cancelled";
export type Booking = {
  id: string;
  appointmentTypeId: string;
  providerId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  slotStart: string; // ISO
  capacityCount: number;
  status: BookingStatus;
  paymentStatus: "paid" | "unpaid";
  answers: Record<string, string>;
  createdAt: string;
};

const APPT_TYPES: AppointmentType[] = [
  {
    id: "dental-checkup",
    title: "Dental Checkup & Cleaning",
    description: "Routine dental examination and professional cleaning. Includes X-ray if needed.",
    durationMins: 30,
    organiser: "Dr. Mehta's Dental Care",
    category: "Health",
    providers: [
      { id: "p1", name: "Dr. Anjali Mehta", title: "Senior Dentist", initials: "AM" },
      { id: "p2", name: "Dr. Rohan Shah", title: "Dentist", initials: "RS" },
    ],
    manageCapacity: false,
    maxCapacity: 1,
    advancePayment: true,
    paymentAmount: 900,
    currency: "INR",
    manualConfirm: false,
    questions: [
      { id: "q1", label: "Any current dental concerns?", type: "textarea", required: false },
      { id: "q2", label: "First time visiting?", type: "select", options: ["Yes", "No"], required: true },
    ],
    workingHours: { start: "09:00", end: "17:00" },
  },
  {
    id: "yoga-class",
    title: "Morning Yoga Class",
    description: "Group hatha yoga session for all levels. Mats provided.",
    durationMins: 60,
    organiser: "Wellness Studio",
    category: "Fitness",
    providers: [{ id: "p3", name: "Priya Nair", title: "Certified Instructor", initials: "PN" }],
    manageCapacity: true,
    maxCapacity: 10,
    advancePayment: true,
    paymentAmount: 400,
    currency: "INR",
    manualConfirm: false,
    questions: [
      { id: "q1", label: "Experience level", type: "select", options: ["Beginner", "Intermediate", "Advanced"], required: true },
    ],
    workingHours: { start: "06:00", end: "10:00" },
  },
  {
    id: "consultation",
    title: "Business Consultation",
    description: "60-minute strategy call with a senior consultant.",
    durationMins: 60,
    organiser: "Acme Advisory",
    category: "Business",
    providers: [
      { id: "p4", name: "Vikram Iyer", title: "Principal Consultant", initials: "VI" },
      { id: "p5", name: "Sara Khan", title: "Senior Consultant", initials: "SK" },
    ],
    manageCapacity: false,
    maxCapacity: 1,
    advancePayment: false,
    paymentAmount: 0,
    currency: "INR",
    manualConfirm: true,
    questions: [
      { id: "q1", label: "What would you like to discuss?", type: "textarea", required: true },
    ],
    workingHours: { start: "10:00", end: "18:00" },
  },
  {
    id: "haircut",
    title: "Haircut & Styling",
    description: "Professional haircut tailored to your style.",
    durationMins: 45,
    organiser: "The Grooming Lounge",
    category: "Beauty",
    providers: [
      { id: "p6", name: "Arjun Kapoor", title: "Senior Stylist", initials: "AK" },
    ],
    manageCapacity: false,
    maxCapacity: 1,
    advancePayment: true,
    paymentAmount: 600,
    currency: "INR",
    manualConfirm: false,
    questions: [],
    workingHours: { start: "10:00", end: "20:00" },
  },
];

const BOOKINGS_KEY = "apt_bookings_v1";
const USER_KEY = "apt_user_v1";

export function getAppointmentTypes() {
  return APPT_TYPES;
}
export function getAppointmentType(id: string) {
  return APPT_TYPES.find((a) => a.id === id);
}

export function getAllBookings(): Booking[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(BOOKINGS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveBookings(bs: Booking[]) {
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bs));
}

export function getBookingsForCustomer(customerId: string) {
  return getAllBookings().filter((b) => b.customerId === customerId);
}

export function getBookingsForSlot(appointmentTypeId: string, providerId: string, slotStartISO: string) {
  return getAllBookings().filter(
    (b) =>
      b.appointmentTypeId === appointmentTypeId &&
      b.providerId === providerId &&
      b.slotStart === slotStartISO &&
      b.status !== "cancelled",
  );
}

export class DoubleBookingError extends Error {
  constructor() {
    super("This slot is no longer available. Please pick another time.");
  }
}

export function createBooking(input: Omit<Booking, "id" | "createdAt" | "status" | "paymentStatus"> & {
  paymentStatus?: "paid" | "unpaid";
}): Booking {
  const appt = getAppointmentType(input.appointmentTypeId);
  if (!appt) throw new Error("Appointment type not found");

  const existing = getBookingsForSlot(input.appointmentTypeId, input.providerId, input.slotStart);
  const usedCapacity = existing.reduce((sum, b) => sum + b.capacityCount, 0);
  const cap = appt.manageCapacity ? appt.maxCapacity : 1;
  if (usedCapacity + input.capacityCount > cap) {
    throw new DoubleBookingError();
  }

  const booking: Booking = {
    ...input,
    id: crypto.randomUUID(),
    status: appt.manualConfirm ? "pending" : "confirmed",
    paymentStatus: input.paymentStatus ?? (appt.advancePayment ? "unpaid" : "unpaid"),
    createdAt: new Date().toISOString(),
  };
  const all = getAllBookings();
  all.push(booking);
  saveBookings(all);
  return booking;
}

export function updateBooking(id: string, patch: Partial<Booking>): Booking | undefined {
  const all = getAllBookings();
  const idx = all.findIndex((b) => b.id === id);
  if (idx === -1) return undefined;

  // If rescheduling, re-check capacity for the new slot
  if (patch.slotStart || patch.providerId) {
    const target = { ...all[idx], ...patch };
    const appt = getAppointmentType(target.appointmentTypeId);
    if (!appt) throw new Error("Appointment type not found");
    const existing = getAllBookings().filter(
      (b) =>
        b.id !== id &&
        b.appointmentTypeId === target.appointmentTypeId &&
        b.providerId === target.providerId &&
        b.slotStart === target.slotStart &&
        b.status !== "cancelled",
    );
    const used = existing.reduce((s, b) => s + b.capacityCount, 0);
    const cap = appt.manageCapacity ? appt.maxCapacity : 1;
    if (used + target.capacityCount > cap) throw new DoubleBookingError();
  }

  all[idx] = { ...all[idx], ...patch };
  saveBookings(all);
  return all[idx];
}

export function getAvailableSlots(
  appointmentTypeId: string,
  providerId: string,
  date: Date,
): { time: string; iso: string; available: boolean; remaining: number }[] {
  const appt = getAppointmentType(appointmentTypeId);
  if (!appt) return [];
  const [sh, sm] = appt.workingHours.start.split(":").map(Number);
  const [eh, em] = appt.workingHours.end.split(":").map(Number);
  const start = new Date(date);
  start.setHours(sh, sm, 0, 0);
  const end = new Date(date);
  end.setHours(eh, em, 0, 0);

  const slots: { time: string; iso: string; available: boolean; remaining: number }[] = [];
  const minLead = 60 * 60 * 1000; // 1 hour
  const cap = appt.manageCapacity ? appt.maxCapacity : 1;
  const cursor = new Date(start);
  while (cursor.getTime() + appt.durationMins * 60000 <= end.getTime()) {
    const iso = cursor.toISOString();
    const used = getBookingsForSlot(appointmentTypeId, providerId, iso).reduce(
      (s, b) => s + b.capacityCount,
      0,
    );
    const remaining = cap - used;
    const future = cursor.getTime() > Date.now() + minLead;
    slots.push({
      time: cursor.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      iso,
      available: future && remaining > 0,
      remaining,
    });
    cursor.setMinutes(cursor.getMinutes() + appt.durationMins);
  }
  return slots;
}

// User (mock auth)
export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}
export function setStoredUser(u: User | null) {
  if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
  else localStorage.removeItem(USER_KEY);
}
