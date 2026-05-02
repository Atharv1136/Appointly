// Static catalog of services (organisers/admin would manage this in v2).
// Lives server-side and is exposed via server functions.

export type Provider = { id: string; name: string; title: string; initials: string };
export type Question = { id: string; label: string; type: "text" | "textarea" | "select"; options?: string[]; required: boolean };

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
  questions: Question[];
  workingHours: { start: string; end: string };
};

export const APPT_TYPES: AppointmentType[] = [
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
    providers: [{ id: "p6", name: "Arjun Kapoor", title: "Senior Stylist", initials: "AK" }],
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

export function findAppt(id: string) {
  return APPT_TYPES.find((a) => a.id === id);
}
