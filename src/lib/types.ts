// Client-only types and a Razorpay checkout helper that uses a server-issued order.
export type Role = "customer" | "organiser" | "admin";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
};

export type Provider = { id: string; name: string; title: string; initials: string };
export type Question = { id: string; label: string; type: "text" | "textarea" | "select"; options?: string[]; required: boolean };

export type WeeklySlots = Record<string, { start: string; end: string }[]>;
export type FlexibleSlots = Record<string, { start: string; end: string }[]>;
export type ScheduleEntry = {
  providerId: string;
  scheduleType: "weekly" | "flexible";
  slots: WeeklySlots | FlexibleSlots;
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
  questions: Question[];
  workingHours: { start: string; end: string };
  isPublished?: boolean;
  shareToken?: string;
  kind?: "user" | "resource";
  assignmentMode?: "manual" | "auto";
  schedules?: ScheduleEntry[];
  minLeadMins?: number;
  maxAdvanceDays?: number;
  bufferMins?: number;
};

export type BookingStatus = "pending" | "confirmed" | "cancelled";
export type Booking = {
  id: string;
  appointmentTypeId: string;
  providerId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  slotStart: string;
  capacityCount: number;
  status: BookingStatus;
  paymentStatus: "paid" | "unpaid";
  paymentId?: string;
  razorpayOrderId?: string;
  answers: Record<string, string>;
  createdAt: string;
};
