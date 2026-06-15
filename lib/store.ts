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
} from "@/lib/types";
import { seedReferrals, seedPatients, seedCheckins, seedPromScores } from "@/lib/data/seed";

interface AppState {
  referrals: Referral[];
  patients: Patient[];
  checkins: RTMCheckin[];
  promScores: PROMScore[];
  addPROMScore: (s: Omit<PROMScore, "id">) => void;
  addReferral: (r: Omit<Referral, "id" | "pocTransmissions">) => void;
  updateReferralStage: (id: string, stage: ReferralStage) => void;
  addPOCTransmission: (referralId: string, t: Omit<POCTransmission, "id">) => void;
  setAuthorization: (referralId: string, a: Omit<Authorization, "id">) => void;
  incrementVisitsUsed: (referralId: string) => void;
  enrollRTM: (patientId: string) => void;
  unenrollRTM: (patientId: string) => void;
  addCheckin: (c: Omit<RTMCheckin, "id">) => void;
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

      resetToSeed: () =>
        set({
          referrals: seedReferrals,
          patients: seedPatients,
          checkins: seedCheckins,
          promScores: seedPromScores,
        }),
    }),
    { name: "cadence-pt-store-v2" },
  ),
);
