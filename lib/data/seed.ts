import type {
  Referral,
  Patient,
  RTMCheckin,
  PROMScore,
  Appointment,
  Followup,
  WaitlistEntry,
} from "@/lib/types";

const today = "2026-06-14";
const daysAgo = (n: number): string => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

// ISO timestamp at given local-ish hour, N days from today
const apptAt = (offsetDays: number, hour: number, minute = 0): string => {
  const d = new Date(today);
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

export const seedReferrals: Referral[] = [
  {
    id: "ref-1001",
    patientName: "Maria Hernandez",
    dateOfBirth: "1958-04-12",
    diagnosis: "Right knee osteoarthritis, post-op TKA",
    diagnosisCode: "M17.11",
    referringPhysician: "Dr. James Patel, MD (Orthopedic)",
    physicianNPI: "1234567890",
    physicianFax: "703-555-0142",
    intakeChannel: "fax",
    receivedAt: daysAgo(0),
    insurancePrimary: "UnitedHealthcare Medicare Advantage",
    insuranceMemberId: "UHC-77881234",
    priorAuthRequired: true,
    stage: "new",
    location: "Main Clinic",
    pocTransmissions: [],
    notes: "Faxed from referring orthopedic group this morning. Post-op day 14.",
  },
  {
    id: "ref-1002",
    patientName: "David Chen",
    dateOfBirth: "1981-11-03",
    diagnosis: "Lumbar radiculopathy",
    diagnosisCode: "M54.16",
    referringPhysician: "Dr. Lisa Kim, MD (Family Medicine)",
    intakeChannel: "portal",
    receivedAt: daysAgo(1),
    insurancePrimary: "Anthem BCBS PPO",
    priorAuthRequired: false,
    stage: "contacted",
    location: "Main Clinic",
    pocTransmissions: [],
    notes: "Left voicemail. Patient returned call, scheduling tomorrow.",
  },
  {
    id: "ref-1003",
    patientName: "Robert Williams",
    dateOfBirth: "1972-08-22",
    diagnosis: "Right rotator cuff repair, post-op",
    diagnosisCode: "S46.011A",
    referringPhysician: "Dr. James Patel, MD (Orthopedic)",
    physicianFax: "703-555-0142",
    intakeChannel: "fax",
    receivedAt: daysAgo(3),
    insurancePrimary: "UnitedHealthcare Medicare Advantage",
    priorAuthRequired: true,
    stage: "verified",
    location: "Main Clinic",
    pocTransmissions: [],
    authorization: {
      id: "auth-2001",
      payer: "UnitedHealthcare Medicare Advantage",
      visitsApproved: 6,
      visitsUsed: 0,
      validFrom: daysAgo(2),
      validThrough: daysAgo(-54),
      status: "pending",
    },
    notes: "Eligibility verified. Auto-approved 6 visits, request needed for additional.",
  },
  {
    id: "ref-1004",
    patientName: "Linda Patel",
    dateOfBirth: "1964-02-18",
    diagnosis: "Bilateral knee OA",
    diagnosisCode: "M17.0",
    referringPhysician: "Dr. Amanda Foster, MD (Internal Medicine)",
    intakeChannel: "fax",
    receivedAt: daysAgo(5),
    insurancePrimary: "Medicare Part B",
    priorAuthRequired: false,
    stage: "scheduled",
    evaluationDate: daysAgo(-2),
    location: "Satellite Clinic",
    pocTransmissions: [],
    notes: "Eval scheduled for next Monday.",
  },
  {
    id: "ref-1005",
    patientName: "James Thompson",
    dateOfBirth: "1955-09-30",
    diagnosis: "Status post left hip arthroplasty",
    diagnosisCode: "Z47.1",
    referringPhysician: "Dr. James Patel, MD (Orthopedic)",
    intakeChannel: "fax",
    receivedAt: daysAgo(7),
    insurancePrimary: "Medicare Part B",
    priorAuthRequired: false,
    stage: "evaluated",
    evaluationDate: daysAgo(2),
    location: "Main Clinic",
    pocTransmissions: [
      {
        id: "poc-3001",
        sentAt: daysAgo(1),
        method: "fax",
        recipient: "Dr. James Patel, MD",
        daysFromEval: 1,
        notes: "POC sent same day as eval finalization. Awaiting ack.",
      },
    ],
    authorization: {
      id: "auth-2002",
      payer: "Medicare Part B",
      visitsApproved: 12,
      visitsUsed: 1,
      validFrom: daysAgo(2),
      validThrough: daysAgo(-88),
      status: "approved",
    },
    notes: "Eval complete. POC drafted and transmitted.",
  },
  {
    id: "ref-1006",
    patientName: "Susan Kowalski",
    dateOfBirth: "1968-06-14",
    diagnosis: "Chronic low back pain",
    diagnosisCode: "M54.5",
    referringPhysician: "Dr. Lisa Kim, MD (Family Medicine)",
    intakeChannel: "fax",
    receivedAt: daysAgo(28),
    insurancePrimary: "Aetna PPO",
    priorAuthRequired: false,
    stage: "active",
    evaluationDate: daysAgo(25),
    location: "Main Clinic",
    pocTransmissions: [
      {
        id: "poc-3002",
        sentAt: daysAgo(23),
        method: "secure-message",
        recipient: "Dr. Lisa Kim, MD",
        daysFromEval: 2,
        acknowledgedAt: daysAgo(20),
      },
    ],
    authorization: {
      id: "auth-2003",
      payer: "Aetna PPO",
      visitsApproved: 10,
      visitsUsed: 5,
      validFrom: daysAgo(25),
      validThrough: daysAgo(-65),
      status: "approved",
    },
    notes: "Halfway through treatment course. Progressing well.",
  },
  {
    id: "ref-1007",
    patientName: "Eleanor Brooks",
    dateOfBirth: "1949-01-25",
    diagnosis: "Vestibular dysfunction, post-fall",
    diagnosisCode: "H81.10",
    referringPhysician: "Dr. Amanda Foster, MD (Internal Medicine)",
    intakeChannel: "phone",
    receivedAt: daysAgo(45),
    insurancePrimary: "UnitedHealthcare Medicare Advantage",
    priorAuthRequired: true,
    stage: "active",
    evaluationDate: daysAgo(42),
    location: "Main Clinic",
    pocTransmissions: [
      {
        id: "poc-3003",
        sentAt: daysAgo(40),
        method: "fax",
        recipient: "Dr. Amanda Foster, MD",
        daysFromEval: 2,
        acknowledgedAt: daysAgo(38),
      },
    ],
    authorization: {
      id: "auth-2004",
      payer: "UnitedHealthcare Medicare Advantage",
      visitsApproved: 6,
      visitsUsed: 5,
      validFrom: daysAgo(42),
      validThrough: daysAgo(-18),
      status: "approved",
    },
    notes: "AT VISIT 5 OF 6 — UHC re-auth needed before next visit.",
  },
  {
    id: "ref-1008",
    patientName: "Michael Foster",
    dateOfBirth: "1989-12-08",
    diagnosis: "Achilles tendinopathy",
    diagnosisCode: "M76.61",
    referringPhysician: "Dr. James Patel, MD (Orthopedic)",
    intakeChannel: "fax",
    receivedAt: daysAgo(60),
    insurancePrimary: "Cigna PPO",
    priorAuthRequired: false,
    stage: "discharged",
    evaluationDate: daysAgo(58),
    location: "Main Clinic",
    pocTransmissions: [
      {
        id: "poc-3004",
        sentAt: daysAgo(55),
        method: "fax",
        recipient: "Dr. James Patel, MD",
        daysFromEval: 3,
        acknowledgedAt: daysAgo(50),
      },
    ],
    notes: "Discharged. 8 visits. Full return to running.",
  },
];

export const seedPatients: Patient[] = [
  {
    id: "pt-5001",
    name: "Susan Kowalski",
    dateOfBirth: "1968-06-14",
    primaryDiagnosis: "Chronic low back pain (M54.5)",
    primaryInsurance: "Aetna PPO",
    payerCategory: "commercial",
    status: "active",
    rtmEnrolled: true,
    rtmEnrolledAt: daysAgo(22),
    primaryTherapist: "Alex Rivera, DPT",
  },
  {
    id: "pt-5002",
    name: "Eleanor Brooks",
    dateOfBirth: "1949-01-25",
    primaryDiagnosis: "Vestibular dysfunction (H81.10)",
    primaryInsurance: "UnitedHealthcare Medicare Advantage",
    payerCategory: "medicare-advantage",
    status: "active",
    rtmEnrolled: true,
    rtmEnrolledAt: daysAgo(40),
    primaryTherapist: "Morgan Chen, DPT",
  },
  {
    id: "pt-5003",
    name: "James Thompson",
    dateOfBirth: "1955-09-30",
    primaryDiagnosis: "Post-op left THA (Z47.1)",
    primaryInsurance: "Medicare Part B",
    payerCategory: "medicare",
    status: "active",
    rtmEnrolled: true,
    rtmEnrolledAt: daysAgo(1),
    primaryTherapist: "Alex Rivera, DPT",
  },
  {
    id: "pt-5004",
    name: "Linda Patel",
    dateOfBirth: "1964-02-18",
    primaryDiagnosis: "Bilateral knee OA (M17.0)",
    primaryInsurance: "Medicare Part B",
    payerCategory: "medicare",
    status: "active",
    rtmEnrolled: false,
    primaryTherapist: "Morgan Chen, DPT",
  },
  {
    id: "pt-5005",
    name: "Robert Williams",
    dateOfBirth: "1972-08-22",
    primaryDiagnosis: "RTC repair (S46.011A)",
    primaryInsurance: "UnitedHealthcare Medicare Advantage",
    payerCategory: "medicare-advantage",
    status: "active",
    rtmEnrolled: false,
    primaryTherapist: "Alex Rivera, DPT",
  },
  {
    id: "pt-5006",
    name: "Patricia Nguyen",
    dateOfBirth: "1962-03-19",
    primaryDiagnosis: "Cervical radiculopathy (M54.12)",
    primaryInsurance: "Medicare Part B",
    payerCategory: "medicare",
    status: "active",
    rtmEnrolled: true,
    rtmEnrolledAt: daysAgo(15),
    primaryTherapist: "Morgan Chen, DPT",
  },
  {
    id: "pt-5007",
    name: "George Martinez",
    dateOfBirth: "1957-07-04",
    primaryDiagnosis: "Right knee OA (M17.11)",
    primaryInsurance: "UnitedHealthcare Medicare Advantage",
    payerCategory: "medicare-advantage",
    status: "active",
    rtmEnrolled: true,
    rtmEnrolledAt: daysAgo(10),
    primaryTherapist: "Alex Rivera, DPT",
  },
  {
    id: "pt-5008",
    name: "Carol Ellison",
    dateOfBirth: "1953-10-11",
    primaryDiagnosis: "Post-op right TSA (Z47.1)",
    primaryInsurance: "Medicare Part B",
    payerCategory: "medicare",
    status: "active",
    rtmEnrolled: false,
    primaryTherapist: "Morgan Chen, DPT",
  },
];

function genCheckins(patientId: string, daysBack: number, completed: number, prescribed: number): RTMCheckin[] {
  const out: RTMCheckin[] = [];
  for (let i = 0; i < daysBack; i++) {
    if (i % 2 !== 0) continue;
    out.push({
      id: `chk-${patientId}-${i}`,
      patientId,
      date: daysAgo(i),
      source: i % 4 === 0 ? "wearable" : "app",
      painLevel: Math.max(1, 7 - Math.floor(i / 5)),
      exercisesCompleted: completed,
      exercisesPrescribed: prescribed,
      minutesActive: 25 + Math.floor(Math.random() * 15),
    });
  }
  return out;
}

// PROM scores — initial eval + reassessments showing typical progression
export const seedPromScores: PROMScore[] = [
  // Susan Kowalski (low back) — Oswestry
  { id: "pr-5001-1", patientId: "pt-5001", instrumentCode: "ODI", date: daysAgo(25), score: 48, visit: 1 },
  { id: "pr-5001-2", patientId: "pt-5001", instrumentCode: "ODI", date: daysAgo(18), score: 42, visit: 4 },
  { id: "pr-5001-3", patientId: "pt-5001", instrumentCode: "ODI", date: daysAgo(10), score: 34, visit: 7 },
  { id: "pr-5001-4", patientId: "pt-5001", instrumentCode: "ODI", date: daysAgo(3), score: 26, visit: 10 },
  // Eleanor Brooks (vestibular post-fall) — measured via LEFS for balance/function
  { id: "pr-5002-1", patientId: "pt-5002", instrumentCode: "LEFS", date: daysAgo(42), score: 28, visit: 1 },
  { id: "pr-5002-2", patientId: "pt-5002", instrumentCode: "LEFS", date: daysAgo(30), score: 38, visit: 4 },
  { id: "pr-5002-3", patientId: "pt-5002", instrumentCode: "LEFS", date: daysAgo(18), score: 48, visit: 7 },
  { id: "pr-5002-4", patientId: "pt-5002", instrumentCode: "LEFS", date: daysAgo(6), score: 56, visit: 10 },
  // James Thompson (post THA) — LEFS
  { id: "pr-5003-1", patientId: "pt-5003", instrumentCode: "LEFS", date: daysAgo(2), score: 22, visit: 1 },
  // Linda Patel (bilateral knee OA) — KOOS
  { id: "pr-5004-1", patientId: "pt-5004", instrumentCode: "KOOS", date: daysAgo(5), score: 41, visit: 1 },
  // Robert Williams (RTC) — DASH
  { id: "pr-5005-1", patientId: "pt-5005", instrumentCode: "DASH", date: daysAgo(3), score: 64, visit: 1 },
  // Patricia Nguyen (cervical) — NDI
  { id: "pr-5006-1", patientId: "pt-5006", instrumentCode: "NDI", date: daysAgo(15), score: 22, visit: 1 },
  { id: "pr-5006-2", patientId: "pt-5006", instrumentCode: "NDI", date: daysAgo(8), score: 17, visit: 4 },
  { id: "pr-5006-3", patientId: "pt-5006", instrumentCode: "NDI", date: daysAgo(1), score: 12, visit: 7 },
  // George Martinez (right knee OA) — KOOS
  { id: "pr-5007-1", patientId: "pt-5007", instrumentCode: "KOOS", date: daysAgo(10), score: 36, visit: 1 },
  { id: "pr-5007-2", patientId: "pt-5007", instrumentCode: "KOOS", date: daysAgo(2), score: 47, visit: 5 },
  // Carol Ellison (post TSA) — DASH
  { id: "pr-5008-1", patientId: "pt-5008", instrumentCode: "DASH", date: daysAgo(7), score: 71, visit: 1 },
  { id: "pr-5008-2", patientId: "pt-5008", instrumentCode: "DASH", date: daysAgo(1), score: 62, visit: 3 },
];

export const seedCheckins: RTMCheckin[] = [
  ...genCheckins("pt-5001", 22, 5, 6),
  ...genCheckins("pt-5002", 40, 4, 5),
  ...genCheckins("pt-5006", 15, 3, 4),
  ...genCheckins("pt-5007", 10, 6, 6),
  ...genCheckins("pt-5003", 1, 0, 4),
];

// Appointments — past visits (completed/no-show/cancelled) + future scheduled
export const seedAppointments: Appointment[] = [
  // PAST (completed) for Susan Kowalski — 5 visits in last 25 days
  { id: "apt-6001", patientId: "pt-5001", therapist: "Alex Rivera, DPT", scheduledAt: apptAt(-23, 9, 0), durationMinutes: 60, visitType: "evaluation", status: "completed", location: "Main Clinic" },
  { id: "apt-6002", patientId: "pt-5001", therapist: "Alex Rivera, DPT", scheduledAt: apptAt(-18, 9, 0), durationMinutes: 45, visitType: "treatment", status: "completed", location: "Main Clinic" },
  { id: "apt-6003", patientId: "pt-5001", therapist: "Alex Rivera, DPT", scheduledAt: apptAt(-14, 9, 0), durationMinutes: 45, visitType: "treatment", status: "completed", location: "Main Clinic" },
  { id: "apt-6004", patientId: "pt-5001", therapist: "Alex Rivera, DPT", scheduledAt: apptAt(-10, 9, 0), durationMinutes: 45, visitType: "treatment", status: "no-show", location: "Main Clinic", notes: "Patient called same-day citing transportation issue." },
  { id: "apt-6005", patientId: "pt-5001", therapist: "Alex Rivera, DPT", scheduledAt: apptAt(-7, 9, 0), durationMinutes: 45, visitType: "treatment", status: "completed", location: "Main Clinic" },

  // PAST for Eleanor Brooks — 5 visits, hit auth limit
  { id: "apt-6010", patientId: "pt-5002", therapist: "Morgan Chen, DPT", scheduledAt: apptAt(-42, 10, 0), durationMinutes: 60, visitType: "evaluation", status: "completed", location: "Main Clinic" },
  { id: "apt-6011", patientId: "pt-5002", therapist: "Morgan Chen, DPT", scheduledAt: apptAt(-35, 10, 0), durationMinutes: 45, visitType: "treatment", status: "completed", location: "Main Clinic" },
  { id: "apt-6012", patientId: "pt-5002", therapist: "Morgan Chen, DPT", scheduledAt: apptAt(-28, 10, 0), durationMinutes: 45, visitType: "treatment", status: "completed", location: "Main Clinic" },
  { id: "apt-6013", patientId: "pt-5002", therapist: "Morgan Chen, DPT", scheduledAt: apptAt(-14, 10, 0), durationMinutes: 45, visitType: "treatment", status: "completed", location: "Main Clinic" },
  { id: "apt-6014", patientId: "pt-5002", therapist: "Morgan Chen, DPT", scheduledAt: apptAt(-7, 10, 0), durationMinutes: 45, visitType: "treatment", status: "completed", location: "Main Clinic" },

  // FUTURE — upcoming appointments
  { id: "apt-6020", patientId: "pt-5001", therapist: "Alex Rivera, DPT", scheduledAt: apptAt(1, 9, 0),   durationMinutes: 45, visitType: "treatment", status: "confirmed", location: "Main Clinic" },
  { id: "apt-6021", patientId: "pt-5001", therapist: "Alex Rivera, DPT", scheduledAt: apptAt(3, 9, 0),   durationMinutes: 45, visitType: "treatment", status: "scheduled", location: "Main Clinic" },
  { id: "apt-6022", patientId: "pt-5006", therapist: "Morgan Chen, DPT", scheduledAt: apptAt(1, 11, 0),  durationMinutes: 45, visitType: "treatment", status: "confirmed", location: "Main Clinic" },
  { id: "apt-6023", patientId: "pt-5006", therapist: "Morgan Chen, DPT", scheduledAt: apptAt(3, 11, 0),  durationMinutes: 45, visitType: "treatment", status: "scheduled", location: "Main Clinic" },
  { id: "apt-6024", patientId: "pt-5007", therapist: "Alex Rivera, DPT", scheduledAt: apptAt(2, 14, 0),  durationMinutes: 45, visitType: "treatment", status: "scheduled", location: "Main Clinic" },
  { id: "apt-6025", patientId: "pt-5003", therapist: "Alex Rivera, DPT", scheduledAt: apptAt(0, 13, 0),  durationMinutes: 60, visitType: "evaluation", status: "confirmed", location: "Main Clinic" },
  { id: "apt-6026", patientId: "pt-5005", therapist: "Alex Rivera, DPT", scheduledAt: apptAt(0, 15, 0),  durationMinutes: 60, visitType: "evaluation", status: "scheduled", location: "Main Clinic", notes: "Newly verified UHC auth — first visit since referral." },
  { id: "apt-6027", patientId: "pt-5008", therapist: "Morgan Chen, DPT", scheduledAt: apptAt(2, 9, 0),   durationMinutes: 60, visitType: "evaluation", status: "scheduled", location: "Satellite Clinic" },
  { id: "apt-6028", patientId: "pt-5004", therapist: "Morgan Chen, DPT", scheduledAt: apptAt(4, 10, 0),  durationMinutes: 45, visitType: "treatment", status: "scheduled", location: "Main Clinic" },
  { id: "apt-6029", patientId: "pt-5002", therapist: "Morgan Chen, DPT", scheduledAt: apptAt(5, 10, 0),  durationMinutes: 45, visitType: "treatment", status: "scheduled", location: "Main Clinic", notes: "Pending UHC re-authorization — confirm before patient arrives." },
];

// Follow-ups — staff call queue (no auto-messaging, this is a TODO list)
export const seedFollowups: Followup[] = [
  {
    id: "fu-7001",
    patientId: "pt-5002", // Eleanor Brooks
    reason: "auth-expiring",
    dueDate: daysAgo(-2), // due in 2 days
    status: "pending",
    notes: "UHC re-auth needs to be submitted before her next visit on Friday.",
  },
  {
    id: "fu-7002",
    patientId: "pt-5001", // Susan Kowalski
    reason: "no-show",
    dueDate: daysAgo(-1),
    status: "pending",
    notes: "Susan missed her appointment 10 days ago. Confirm her current schedule.",
  },
  {
    id: "fu-7003",
    patientId: "pt-5004", // Linda Patel
    reason: "post-discharge-30d",
    dueDate: daysAgo(0), // due today
    status: "pending",
    notes: "30-day check-in. How are the knees holding up post-discharge?",
  },
  {
    id: "fu-7004",
    patientId: "pt-5006", // Patricia Nguyen
    reason: "manual",
    dueDate: daysAgo(-7),
    status: "pending",
    notes: "Patient mentioned a flare-up — schedule re-eval if needed.",
  },
  {
    id: "fu-7005",
    patientId: "pt-5003", // James Thompson
    reason: "post-discharge-60d",
    dueDate: daysAgo(-30),
    status: "pending",
    notes: "60-day follow-up scheduled. THA recovery check.",
  },
  // COMPLETED — show history
  {
    id: "fu-7006",
    patientId: "pt-5001",
    reason: "no-show",
    dueDate: daysAgo(8),
    status: "completed",
    notes: "Called Susan. Rescheduled for next Tuesday.",
    completedAt: new Date(daysAgo(7) + "T14:23:00Z").toISOString(),
    completedBy: "Front Desk",
  },
];

// Waitlist — patients waiting for an opening
export const seedWaitlist: WaitlistEntry[] = [
  {
    id: "wl-8001",
    patientId: "pt-5005", // Robert Williams
    preferredDays: ["mon", "wed", "fri"],
    preferredTimes: ["morning", "midday"],
    therapistPreference: "Alex Rivera, DPT",
    priority: "high",
    notes: "RTC repair — provider asked for prompt scheduling. Will take any AM slot M/W/F.",
    status: "active",
    addedAt: new Date(daysAgo(2) + "T08:14:00Z").toISOString(),
  },
  {
    id: "wl-8002",
    patientId: "pt-5008", // Carol Ellison
    preferredDays: ["tue", "thu"],
    preferredTimes: ["afternoon"],
    therapistPreference: "Morgan Chen, DPT",
    priority: "normal",
    notes: "Post-op TSA — needs afternoons due to work schedule.",
    status: "active",
    addedAt: new Date(daysAgo(5) + "T10:45:00Z").toISOString(),
  },
  {
    id: "wl-8003",
    patientId: "pt-5004", // Linda Patel
    preferredDays: ["mon", "tue", "wed", "thu", "fri"],
    preferredTimes: ["early-am", "morning"],
    priority: "normal",
    notes: "Open to any therapist. Prefers earliest slot of the day.",
    status: "active",
    addedAt: new Date(daysAgo(8) + "T09:00:00Z").toISOString(),
  },
];
