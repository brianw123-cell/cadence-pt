/**
 * Repository pattern interfaces. The UI talks to these interfaces, not to the
 * Zustand store or Supabase client directly. To swap storage backends:
 *
 *   1. Implement these interfaces against the new backend (e.g. Supabase queries)
 *   2. Change the factory in lib/repo/index.ts to return the new implementation
 *   3. UI code does not change
 *
 * This is the single most important architectural seam in the app. Resist the
 * temptation to bypass it for "just this one component".
 */

import type {
  Referral,
  Patient,
  RTMCheckin,
  PROMScore,
  ReferralStage,
  POCTransmission,
  Authorization,
  Appointment,
  AppointmentStatus,
  Followup,
  FollowupStatus,
  WaitlistEntry,
  WaitlistStatus,
} from "@/lib/types";

export interface ReferralsRepo {
  list(): Referral[];
  get(id: string): Referral | undefined;
  create(referral: Omit<Referral, "id" | "pocTransmissions">): void;
  updateStage(id: string, stage: ReferralStage): void;
  addPOCTransmission(referralId: string, t: Omit<POCTransmission, "id">): void;
  setAuthorization(referralId: string, a: Omit<Authorization, "id">): void;
  incrementVisitsUsed(referralId: string): void;
}

export interface PatientsRepo {
  list(): Patient[];
  get(id: string): Patient | undefined;
  enrollRTM(id: string): void;
  unenrollRTM(id: string): void;
}

export interface CheckinsRepo {
  list(): RTMCheckin[];
  listForPatient(patientId: string): RTMCheckin[];
  create(c: Omit<RTMCheckin, "id">): void;
}

export interface PROMsRepo {
  listForPatient(patientId: string): PROMScore[];
  list(): PROMScore[];
  create(s: Omit<PROMScore, "id">): void;
}

export interface AppointmentsRepo {
  list(): Appointment[];
  listForPatient(patientId: string): Appointment[];
  create(a: Omit<Appointment, "id">): void;
  createBatch(as: Omit<Appointment, "id">[]): void;
  updateStatus(id: string, status: AppointmentStatus): void;
}

export interface FollowupsRepo {
  list(): Followup[];
  listForPatient(patientId: string): Followup[];
  create(f: Omit<Followup, "id">): void;
  updateStatus(
    id: string,
    status: FollowupStatus,
    extra?: { notes?: string; completedBy?: string },
  ): void;
}

export interface WaitlistRepo {
  list(): WaitlistEntry[];
  create(w: Omit<WaitlistEntry, "id" | "addedAt">): void;
  updateStatus(id: string, status: WaitlistStatus): void;
}

export interface CadenceRepo {
  referrals: ReferralsRepo;
  patients: PatientsRepo;
  checkins: CheckinsRepo;
  proms: PROMsRepo;
  appointments: AppointmentsRepo;
  followups: FollowupsRepo;
  waitlist: WaitlistRepo;
}
