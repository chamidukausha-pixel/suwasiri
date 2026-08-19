import React, { FormEvent, useState } from "react";
import { Loader2, Mail, Phone, ShieldCheck } from "lucide-react";
import {
  authErrorMessage,
  DEMO_PHONE_OTP,
  registerWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signInWithPhoneDemo,
} from "../firebaseAuth";

type AuthTab = "signin" | "register" | "phone";

export default function LoginView() {
  const [tab, setTab] = useState<AuthTab>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const onSignIn = (e: FormEvent) => {
    e.preventDefault();
    void run(() => signInWithEmail(email, password));
  };

  const onRegister = (e: FormEvent) => {
    e.preventDefault();
    void run(() => registerWithEmail(name, email, password));
  };

  const onPhone = (e: FormEvent) => {
    e.preventDefault();
    void run(() => signInWithPhoneDemo(phone, otp));
  };

  return (
    <div className="min-h-screen bg-[#f9f9ff] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-8 space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#00334f]">
            <ShieldCheck className="w-6 h-6" />
            <h1 className="font-serif font-bold text-xl">Sri Lankan GP Care</h1>
          </div>
          <p className="text-xs text-slate-500">
            Sign in with the same Firebase Auth as the Suwasiri mobile app (`suwasiri-91824`).
          </p>
        </div>

        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          {([
            { id: "signin" as const, label: "Sign in" },
            { id: "register" as const, label: "Register" },
            { id: "phone" as const, label: "Phone" },
          ]).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => { setTab(t.id); setError(null); }}
              className={`flex-1 py-1.5 rounded-md text-xs font-bold ${
                tab === t.id ? "bg-white text-[#00334f] shadow-xs" : "text-slate-500"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold p-3 rounded-lg">
            {error}
          </div>
        )}

        {tab === "signin" && (
          <form onSubmit={onSignIn} className="space-y-3">
            <label className="block text-xs font-bold text-slate-600">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00334f]"
              />
            </label>
            <label className="block text-xs font-bold text-slate-600">
              Password
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00334f]"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-[#00334f] text-white py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              Sign in
            </button>
          </form>
        )}

        {tab === "register" && (
          <form onSubmit={onRegister} className="space-y-3">
            <p className="text-[11px] text-slate-500">
              Creates a Firebase user and `users/{"{uid}"}` profile, same as mobile. Staff EMR access is granted only if this email already has a hospital membership.
            </p>
            <label className="block text-xs font-bold text-slate-600">
              Full name
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00334f]"
              />
            </label>
            <label className="block text-xs font-bold text-slate-600">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00334f]"
              />
            </label>
            <label className="block text-xs font-bold text-slate-600">
              Password
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00334f]"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-[#00334f] text-white py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Create account
            </button>
          </form>
        )}

        {tab === "phone" && (
          <form onSubmit={onPhone} className="space-y-3">
            <p className="text-[11px] text-slate-500">
              Temporary stub matching mobile: OTP <strong>{DEMO_PHONE_OTP}</strong> signs in via a synthetic email until real Phone Auth is wired.
            </p>
            <label className="block text-xs font-bold text-slate-600">
              Mobile number
              <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+94771234567"
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00334f]"
              />
            </label>
            <label className="block text-xs font-bold text-slate-600">
              OTP
              <input
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder={DEMO_PHONE_OTP}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00334f]"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-[#00334f] text-white py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
              Verify OTP
            </button>
          </form>
        )}

        <button
          type="button"
          disabled={busy}
          onClick={() => void run(() => signInWithGoogle())}
          className="w-full border border-slate-300 py-2.5 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          Continue with Google
        </button>
      </div>
    </div>
  );
}
