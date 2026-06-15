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

// 2026 CMS Medicare Physician Fee Schedule national-average reimbursement rates
export const RTM_RATES = {
  setup: { code: "98975", description: "Initial setup & patient education", amount: 19.65, frequency: "per episode" },
  monitorMSK: { code: "98977", description: "Musculoskeletal monitoring", amount: 40.0, frequency: "monthly" },
  monitorResp: { code: "98976", description: "Respiratory monitoring", amount: 46.83, frequency: "monthly" },
  manageFirst20: { code: "98980", description: "First 20 min management", amount: 50.45, frequency: "monthly" },
  manageAddl20: { code: "98981", description: "Each additional 20 min management", amount: 39.95, frequency: "monthly" },
} as const;
