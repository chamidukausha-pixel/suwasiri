import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb, googleProvider } from "./firebase";
import type { StaffUser } from "./types";

export const DEMO_PHONE_OTP = "123456";

export function phoneSyntheticEmail(phone: string): string {
  const normalized = phone.replace(/\s+/g, "");
  return `${normalized}@phone.suwasiri.lk`;
}

export function phoneSyntheticPassword(phone: string): string {
  const normalized = phone.replace(/\s+/g, "");
  return `Suwasiri!${normalized}`;
}

function ceylonHealthId(uid: string): string {
  let hash = 0;
  for (let i = 0; i < uid.length; i++) hash = (hash * 31 + uid.charCodeAt(i)) | 0;
  return `CH-${Math.abs(hash) % 1000000}`;
}

export async function upsertUserProfile(user: User, name?: string): Promise<void> {
  const db = getFirebaseDb();
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;
  await setDoc(ref, {
    name: name || user.displayName || "Patient",
    email: user.email || "",
    mobileNo: user.phoneNumber || null,
    ceylonHealthId: ceylonHealthId(user.uid),
  });
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
  await upsertUserProfile(cred.user);
  return cred.user;
}

export async function registerWithEmail(name: string, email: string, password: string): Promise<User> {
  const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
  if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
  await upsertUserProfile(cred.user, name.trim());
  return cred.user;
}

/** Same stub as Flutter: OTP `123456` → synthetic `$phone@phone.suwasiri.lk`. */
export async function signInWithPhoneDemo(phone: string, otp: string): Promise<User> {
  if (otp !== DEMO_PHONE_OTP) {
    throw new Error("Invalid OTP. Use demo code 123456.");
  }
  const email = phoneSyntheticEmail(phone);
  const password = phoneSyntheticPassword(phone);
  try {
    const cred = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
    await upsertUserProfile(cred.user);
    return cred.user;
  } catch (err: any) {
    if (err?.code !== "auth/user-not-found" && err?.code !== "auth/invalid-credential") {
      throw err;
    }
    const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
    await updateProfile(cred.user, { displayName: "Patient" });
    await upsertUserProfile(cred.user, "Patient");
    return cred.user;
  }
}

export async function signInWithGoogle(): Promise<User> {
  const cred = await signInWithPopup(getFirebaseAuth(), googleProvider);
  await upsertUserProfile(cred.user);
  return cred.user;
}

export async function signOutFirebase(): Promise<void> {
  await signOut(getFirebaseAuth());
}

export function subscribeAuth(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(getFirebaseAuth(), callback);
}

export function staffForAuthUser(user: User | null, staffUsers: StaffUser[]): StaffUser | null {
  if (!user?.email) return null;
  const email = user.email.trim().toLowerCase();
  return staffUsers.find((s) => s.email.trim().toLowerCase() === email) ?? null;
}

export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code;
  const map: Record<string, string> = {
    "auth/invalid-email": "That email address is not valid.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/user-not-found": "No account exists for that email. Register first, or sign in with Google.",
    "auth/wrong-password": "Incorrect password.",
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/email-already-in-use": "That email is already registered. Sign in instead.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/popup-closed-by-user": "Google sign-in was cancelled.",
    "auth/unauthorized-domain": "Add this domain under Firebase Auth → Settings → Authorized domains.",
    "auth/operation-not-allowed": "Enable Email/Password and Google in Firebase Console → Authentication.",
  };
  if (code && map[code]) return map[code];
  if (err instanceof Error) return err.message;
  return "Sign-in failed.";
}
