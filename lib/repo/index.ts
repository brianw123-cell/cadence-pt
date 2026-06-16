/**
 * Single import point for the data layer. Components should NOT import directly
 * from ./hooks or any storage-specific implementation.
 *
 * Currently routes to the Zustand+localStorage implementation. To switch to
 * Supabase, change the re-exports here.
 */

export {
  useReferralsRepo,
  usePatientsRepo,
  useCheckinsRepo,
  usePROMsRepo,
  useAppointmentsRepo,
  useFollowupsRepo,
  useWaitlistRepo,
} from "./hooks";

export type {
  ReferralsRepo,
  PatientsRepo,
  CheckinsRepo,
  PROMsRepo,
  AppointmentsRepo,
  FollowupsRepo,
  WaitlistRepo,
  CadenceRepo,
} from "./types";
