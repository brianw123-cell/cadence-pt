"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Referral,
  Patient,
  RTMCheckin,
  ReferralStage,
  POCTransmission,
  Authorization,
  PROMScore,
  Appointment,
  AppointmentStatus,
  Followup,
  FollowupStatus,
  WaitlistEntry,
  WaitlistStatus,
} from "@/lib/types";
import {
  seedReferrals,
  seedPatients,
  seedCheckins,
  seedPromScores,
  seedAppointments,
  seedFollowups,
  seedWaitlist,
} from "@/lib/data/seed";

interface AppState {
  referrals: Referral[];
  patients: Patient[];
  checkins: RTMCheckin[];
  promScores: PROMScore[];
  appointments: Appointment[];
  followups: Followup[];
  waitlist: WaitlistEntry[];

  addPROMScore: (s: Omit<PROMScore, "id">) => void;
  addReferral: (r: Omit<Referral, "id" | "pocTransmissions">) => void;
  updateReferral: (id: string, patch: Partial<Omit<Referral, "id" | "pocTransmissions" | "authorization">>) => void;
  deleteReferral: (id: string) => void;
  updateReferralStage: (id: string, stage: ReferralStage) => void;
  addPOCTransmission: (referralId: string, t: Omit<POCTransmission, "id">) => void;
  setAuthorization: (referralId: string, a: Omit<Authorization, "id">) => void;
  incrementVisitsUsed: (referralId: string) => void;

  // Patients
  addPatient: (p: Omit<Patient, "id">) => string;
  updatePatient: (id: string, patch: Partial<Omit<Patient, "id">>) => void;
  deletePatient: (id: string) => void;
  enrollRTM: (patientId: string) => void;
  unenrollRTM: (patientId: string) => void;
  addCheckin: (c: Omit<RTMCheckin, "id">) => void;

  // Appointments
  addAppointment: (a: Omit<Appointment, "id">) => void;
  addAppointmentBatch: (as: Omit<Appointment, "id">[]) => void;
  updateAppointment: (id: string, patch: Partial<Omit<Appointment, "id">>) => void;
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => void;
  deleteAppointment: (id: string) => void;

  // Followups
  addFollowup: (f: Omit<Followup, "id">) => void;
  updateFollowupStatus: (
    id: string,
    status: FollowupStatus,
    extra?: { notes?: string; completedBy?: string },
  ) => void;

  // Waitlist
  addWaitlistEntry: (w: Omit<WaitlistEntry, "id" | "addedAt">) => void;
  updateWaitlistStatus: (id: string, status: WaitlistStatus) => void;

  resetToSeed: () => void;
}

const uid = (prefix: string) =>
  `${prefix}-${Math.floor(Math.random() * 1_000_000).toString(36)}`;

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      referrals: seedReferrals,
      patients: seedPatients,
      checkins: seedCheckins,
      promScores: seedPromScores,
      appointments: seedAppointments,
      followups: seedFollowups,
      waitlist: seedWaitlist,

      addPROMScore: (s) =>
        set((state) => ({
          promScores: [{ ...s, id: uid("pr") }, ...state.promScores],
        })),

      addReferral: (r) =>
        set((s) => ({
          referrals: [
            { ...r, id: uid("ref"), pocTransmissions: [] } as Referral,
            ...s.referrals,
          ],
        })),

      updateReferral: (id, patch) =>
        set((s) => ({
          referrals: s.referrals.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        })),

      deleteReferral: (id) =>
        set((s) => ({
          referrals: s.referrals.filter((r) => r.id !== id),
        })),

      updateReferralStage: (id, stage) =>
        set((s) => ({
          referrals: s.referrals.map((r) => (r.id === id ? { ...r, stage } : r)),
        })),

      addPOCTransmission: (referralId, t) =>
        set((s) => ({
          referrals: s.referrals.map((r) =>
            r.id === referralId
              ? { ...r, pocTransmissions: [...r.pocTransmissions, { ...t, id: uid("poc") }] }
              : r,
          ),
        })),

      setAuthorization: (referralId, a) =>
        set((s) => ({
          referrals: s.referrals.map((r) =>
            r.id === referralId ? { ...r, authorization: { ...a, id: uid("auth") } } : r,
          ),
        })),

      incrementVisitsUsed: (referralId) =>
        set((s) => ({
          referrals: s.referrals.map((r) => {
            if (r.id !== referralId || !r.authorization) return r;
            return {
              ...r,
              authorization: {
                ...r.authorization,
                visitsUsed: r.authorization.visitsUsed + 1,
              },
            };
          }),
        })),

      addPatient: (p) => {
        const id = uid("pt");
        set((s) => ({ patients: [{ ...p, id }, ...s.patients] }));
        return id;
      },

      updatePatient: (id, patch) =>
        set((s) => ({
          patients: s.patients.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),

      deletePatient: (id) =>
        set((s) => ({
          patients: s.patients.filter((p) => p.id !== id),
          checkins: s.checkins.filter((c) => c.patientId !== id),
          promScores: s.promScores.filter((sc) => sc.patientId !== id),
          appointments: s.appointments.filter((a) => a.patientId !== id),
          followups: s.followups.filter((f) => f.patientId !== id),
          waitlist: s.waitlist.filter((w) => w.patientId !== id),
        })),

      enrollRTM: (patientId) =>
        set((s) => ({
          patients: s.patients.map((p) =>
            p.id === patientId
              ? { ...p, rtmEnrolled: true, rtmEnrolledAt: new Date().toISOString().slice(0, 10) }
              : p,
          ),
        })),

      unenrollRTM: (patientId) =>
        set((s) => ({
          patients: s.patients.map((p) =>
            p.id === patientId ? { ...p, rtmEnrolled: false, rtmEnrolledAt: undefined } : p,
          ),
        })),

      addCheckin: (c) =>
        set((s) => ({
          checkins: [{ ...c, id: uid("chk") }, ...s.checkins],
        })),

      addAppointment: (a) =>
        set((s) => ({
          appointments: [{ ...a, id: uid("apt") }, ...s.appointments],
        })),

      addAppointmentBatch: (as) =>
        set((s) => ({
          appointments: [
            ...as.map((a) => ({ ...a, id: uid("apt") })),
            ...s.appointments,
          ],
        })),

      updateAppointment: (id, patch) =>
        set((s) => ({
          appointments: s.appointments.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        })),

      updateAppointmentStatus: (id, status) =>
        set((s) => ({
          appointments: s.appointments.map((a) =>
            a.id === id ? { ...a, status } : a,
          ),
        })),

      deleteAppointment: (id) =>
        set((s) => ({
          appointments: s.appointments.filter((a) => a.id !== id),
        })),

      addFollowup: (f) =>
        set((s) => ({
          followups: [{ ...f, id: uid("fu") }, ...s.followups],
        })),

      updateFollowupStatus: (id, status, extra) =>
        set((s) => ({
          followups: s.followups.map((f) =>
            f.id === id
              ? {
                  ...f,
                  status,
                  completedAt:
                    status === "completed"
                      ? new Date().toISOString()
                      : f.completedAt,
                  notes: extra?.notes ?? f.notes,
                  completedBy: extra?.completedBy ?? f.completedBy,
                }
              : f,
          ),
        })),

      addWaitlistEntry: (w) =>
        set((s) => ({
          waitlist: [
            { ...w, id: uid("wl"), addedAt: new Date().toISOString() } as WaitlistEntry,
            ...s.waitlist,
          ],
        })),

      updateWaitlistStatus: (id, status) =>
        set((s) => ({
          waitlist: s.waitlist.map((w) =>
            w.id === id ? { ...w, status } : w,
          ),
        })),

      resetToSeed: () =>
        set({
          referrals: seedReferrals,
          patients: seedPatients,
          checkins: seedCheckins,
          promScores: seedPromScores,
          appointments: seedAppointments,
          followups: seedFollowups,
          waitlist: seedWaitlist,
        }),
    }),
    { name: "cadence-pt-store-v3" },
  ),
);
