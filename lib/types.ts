export type ReferralStage =
  | "new"
  | "contacted"
  | "verified"
  | "authorized"
  | "scheduled"
  | "evaluated"
  | "active"
  | "discharged";

export const STAGE_LABELS: Record<ReferralStage, string> = {
  new: "New",
  contacted: "Contacted",
  verified: "Insurance verified",
  authorized: "Auth obtained",
  scheduled: "Scheduled",
  evaluated: "Evaluated",
  active: "Active treatment",
  discharged: "Discharged",
};

export const STAGE_ORDER: ReferralStage[] = [
  "new",
  "contacted",
  "verified",
  "authorized",
  "scheduled",
  "evaluated",
  "active",
  "discharged",
];

export type IntakeChannel = "fax" | "portal" | "email" | "phone" | "walk-in";

export interface POCTransmission {
  id: string;
  sentAt: string; // ISO date
  method: "fax" | "secure-message" | "portal" | "email";
  recipient: string;
  daysFromEval: number;
  acknowledgedAt?: string;
  notes?: string;
}

export interface Authorization {
  id: string;
  payer: string;
  authNumber?: string;
  visitsApproved: number;
  visitsUsed: number;
  validFrom: string;
  validThrough: string;
  status: "pending" | "approved" | "denied" | "expired";
}

export interface Referral {
  id: string;
  patientName: string;
  dateOfBirth: string;
  diagnosis: string;
  diagnosisCode?: string;
  referringPhysician: string;
  physicianNPI?: string;
  physicianFax?: string;
  intakeChannel: IntakeChannel;
  receivedAt: string;
  insurancePrimary: string;
  insuranceMemberId?: string;
  priorAuthRequired: boolean;
  stage: ReferralStage;
  evaluationDate?: string;
  pocTransmissions: POCTransmission[];
  authorization?: Authorization;
  assignedTherapist?: string;
  location: string;
  notes?: string;
}

export interface Patient {
  id: string;
  name: string;
  dateOfBirth: string;
  primaryDiagnosis: string;
  primaryInsurance: string;
  payerCategory: "medicare" | "medicare-advantage" | "commercial" | "medicaid" | "self-pay";
  status: "active" | "discharged" | "on-hold";
  activeAuthorization?: Authorization;
  rtmEnrolled: boolean;
  rtmEnrolledAt?: string;
  primaryTherapist?: string;
}

export interface RTMCheckin {
  id: string;
  patientId: string;
  date: string;
  source: "app" | "wearable" | "manual";
  painLevel?: number;
  exercisesCompleted: number;
  exercisesPrescribed: number;
  minutesActive: number;
  notes?: string;
}

// Patient-Reported Outcome Measures (PROMs) used in PT.
// Score interpretation: lower = better function for Oswestry/NDI,
// higher = better function for KOOS. MCID = minimal clinically important difference.
export interface PROMInstrument {
  code: "ODI" | "NDI" | "KOOS" | "DASH" | "LEFS";
  name: string;
  region: string;
  scoreRange: [number, number];
  betterIs: "lower" | "higher";
  mcid: number;
  description: string;
}

export const PROM_INSTRUMENTS: Record<string, PROMInstrument> = {
  ODI: {
    code: "ODI",
    name: "Oswestry Disability Index",
    region: "Low back",
    scoreRange: [0, 100],
    betterIs: "lower",
    mcid: 10,
    description: "Percentage disability from chronic low back pain.",
  },
  NDI: {
    code: "NDI",
    name: "Neck Disability Index",
    region: "Cervical / neck",
    scoreRange: [0, 50],
    betterIs: "lower",
    mcid: 7,
    description: "Functional impact of neck pain on daily activities.",
  },
  KOOS: {
    code: "KOOS",
    name: "Knee injury and Osteoarthritis Outcome Score",
    region: "Knee",
    scoreRange: [0, 100],
    betterIs: "higher",
    mcid: 10,
    description: "Patient-reported knee function across 5 subscales.",
  },
  DASH: {
    code: "DASH",
    name: "Disabilities of the Arm, Shoulder and Hand",
    region: "Upper extremity",
    scoreRange: [0, 100],
    betterIs: "lower",
    mcid: 10.2,
    description: "Functional limitation in upper-extremity disorders.",
  },
  LEFS: {
    code: "LEFS",
    name: "Lower Extremity Functional Scale",
    region: "Lower extremity",
    scoreRange: [0, 80],
    betterIs: "higher",
    mcid: 9,
    description: "Functional difficulty with lower-extremity activities.",
  },
};

export interface PROMScore {
  id: string;
  patientId: string;
  instrumentCode: keyof typeof PROM_INSTRUMENTS;
  date: string;
  score: number;
  visit: number; // 1 = initial eval, N = Nth visit
}

// ---------- Appointments / scheduling ----------

export type VisitType =
  | "evaluation"
  | "treatment"
  | "progress-note"
  | "re-evaluation"
  | "discharge";

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "arrived"
  | "completed"
  | "no-show"
  | "cancelled"
  | "rescheduled";

export interface Appointment {
  id: string;
  patientId: string;
  therapist: string;
  scheduledAt: string; // ISO timestamp
  durationMinutes: number;
  visitType: VisitType;
  status: AppointmentStatus;
  location?: string;
  notes?: string;
  recurringSeriesId?: string;
}

export const VISIT_TYPE_LABELS: Record<VisitType, string> = {
  evaluation: "Initial evaluation",
  treatment: "Treatment",
  "progress-note": "Progress note",
  "re-evaluation": "Re-evaluation",
  discharge: "Discharge visit",
};

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  arrived: "Arrived",
  completed: "Completed",
  "no-show": "No-show",
  cancelled: "Cancelled",
  rescheduled: "Rescheduled",
};

// ---------- Follow-ups (staff queue, manual outreach) ----------

export type FollowupReason =
  | "post-discharge-30d"
  | "post-discharge-60d"
  | "post-discharge-90d"
  | "no-show"
  | "auth-expiring"
  | "manual";

export type FollowupStatus = "pending" | "completed" | "skipped" | "snoozed";

export interface Followup {
  id: string;
  patientId: string;
  reason: FollowupReason;
  dueDate: string; // YYYY-MM-DD
  status: FollowupStatus;
  notes?: string;
  completedAt?: string;
  completedBy?: string;
}

export const FOLLOWUP_REASON_LABELS: Record<FollowupReason, string> = {
  "post-discharge-30d": "30 days post-discharge",
  "post-discharge-60d": "60 days post-discharge",
  "post-discharge-90d": "90 days post-discharge",
  "no-show": "No-show recovery",
  "auth-expiring": "Authorization expiring",
  manual: "Manual follow-up",
};

// ---------- Waitlist ----------

export type WaitlistPriority = "low" | "normal" | "high" | "urgent";
export type WaitlistStatus = "active" | "scheduled" | "removed";

export interface WaitlistEntry {
  id: string;
  patientId: string;
  preferredDays: string[]; // ['mon','tue','wed','thu','fri']
  preferredTimes: string[]; // ['early-am','morning','midday','afternoon','evening']
  therapistPreference?: string;
  priority: WaitlistPriority;
  notes?: string;
  status: WaitlistStatus;
  addedAt: string;
}

export const DAY_LABELS: Record<string, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

export const TIME_LABELS: Record<string, string> = {
  "early-am": "Early AM",
  morning: "Morning",
  midday: "Midday",
  afternoon: "Afternoon",
  evening: "Evening",
};

// 2026 CMS Medicare Physician Fee Schedule national-average reimbursement rates
export const RTM_RATES = {
  setup: { code: "98975", description: "Initial setup & patient education", amount: 19.65, frequency: "per episode" },
  monitorMSK: { code: "98977", description: "Musculoskeletal monitoring", amount: 40.0, frequency: "monthly" },
  monitorResp: { code: "98976", description: "Respiratory monitoring", amount: 46.83, frequency: "monthly" },
  manageFirst20: { code: "98980", description: "First 20 min management", amount: 50.45, frequency: "monthly" },
  manageAddl20: { code: "98981", description: "Each additional 20 min management", amount: 39.95, frequency: "monthly" },
} as const;
