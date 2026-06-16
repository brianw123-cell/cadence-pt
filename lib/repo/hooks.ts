"use client";

/**
 * React hooks that implement the repository interfaces against the Zustand store.
 * This is the only file that knows about both Zustand AND the repo interfaces.
 * Everything else uses the interface.
 *
 * To swap to Supabase later:
 *   1. Create lib/repo/supabase.ts that implements the same interfaces using the
 *      Supabase client (likely with TanStack Query for caching).
 *   2. Update components to import from there instead of here.
 *   3. (Optional) Keep this file as a fallback for offline mode.
 */

import { useAppStore } from "@/lib/store";
import type {
  ReferralsRepo,
  PatientsRepo,
  CheckinsRepo,
  PROMsRepo,
  AppointmentsRepo,
  FollowupsRepo,
  WaitlistRepo,
} from "./types";

export function useReferralsRepo(): ReferralsRepo {
  const referrals = useAppStore((s) => s.referrals);
  const addReferral = useAppStore((s) => s.addReferral);
  const updateReferralStage = useAppStore((s) => s.updateReferralStage);
  const addPOCTransmission = useAppStore((s) => s.addPOCTransmission);
  const setAuthorization = useAppStore((s) => s.setAuthorization);
  const incrementVisitsUsed = useAppStore((s) => s.incrementVisitsUsed);

  return {
    list: () => referrals,
    get: (id) => referrals.find((r) => r.id === id),
    create: addReferral,
    updateStage: updateReferralStage,
    addPOCTransmission,
    setAuthorization,
    incrementVisitsUsed,
  };
}

export function usePatientsRepo(): PatientsRepo {
  const patients = useAppStore((s) => s.patients);
  const enrollRTM = useAppStore((s) => s.enrollRTM);
  const unenrollRTM = useAppStore((s) => s.unenrollRTM);

  return {
    list: () => patients,
    get: (id) => patients.find((p) => p.id === id),
    enrollRTM,
    unenrollRTM,
  };
}

export function useCheckinsRepo(): CheckinsRepo {
  const checkins = useAppStore((s) => s.checkins);
  const addCheckin = useAppStore((s) => s.addCheckin);

  return {
    list: () => checkins,
    listForPatient: (patientId) => checkins.filter((c) => c.patientId === patientId),
    create: addCheckin,
  };
}

export function usePROMsRepo(): PROMsRepo {
  const proms = useAppStore((s) => s.promScores);
  const addPROMScore = useAppStore((s) => s.addPROMScore);

  return {
    list: () => proms,
    listForPatient: (patientId) => proms.filter((p) => p.patientId === patientId),
    create: addPROMScore,
  };
}

export function useAppointmentsRepo(): AppointmentsRepo {
  const appointments = useAppStore((s) => s.appointments);
  const addAppointment = useAppStore((s) => s.addAppointment);
  const addAppointmentBatch = useAppStore((s) => s.addAppointmentBatch);
  const updateAppointmentStatus = useAppStore((s) => s.updateAppointmentStatus);

  return {
    list: () => appointments,
    listForPatient: (patientId) => appointments.filter((a) => a.patientId === patientId),
    create: addAppointment,
    createBatch: addAppointmentBatch,
    updateStatus: updateAppointmentStatus,
  };
}

export function useFollowupsRepo(): FollowupsRepo {
  const followups = useAppStore((s) => s.followups);
  const addFollowup = useAppStore((s) => s.addFollowup);
  const updateFollowupStatus = useAppStore((s) => s.updateFollowupStatus);

  return {
    list: () => followups,
    listForPatient: (patientId) => followups.filter((f) => f.patientId === patientId),
    create: addFollowup,
    updateStatus: updateFollowupStatus,
  };
}

export function useWaitlistRepo(): WaitlistRepo {
  const waitlist = useAppStore((s) => s.waitlist);
  const addWaitlistEntry = useAppStore((s) => s.addWaitlistEntry);
  const updateWaitlistStatus = useAppStore((s) => s.updateWaitlistStatus);

  return {
    list: () => waitlist,
    create: addWaitlistEntry,
    updateStatus: updateWaitlistStatus,
  };
}
