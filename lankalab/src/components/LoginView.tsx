import React, { FormEvent, useState } from "react";

export const LANKALAB_LOGIN_EMAIL = "chamidukausha@gmail.com";
export const LANKALAB_LOGIN_PASSWORD = "Admin@123";
export const LANKALAB_SESSION_KEY = "lankalab.session";

export function readLankaLabSession(): { email: string } | null {
  try {
    const raw = localStorage.getItem(LANKALAB_SESSION_KEY) || sessionStorage.getItem(LANKALAB_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { email?: string };
    return parsed.email ? { email: parsed.email } : null;
  } catch {
    return null;
  }
}

export function clearLankaLabSession() {
  localStorage.removeItem(LANKALAB_SESSION_KEY);
  sessionStorage.removeItem(LANKALAB_SESSION_KEY);
}

export default function LoginView({ onSignedIn }: { onSignedIn: (email: string) => void }) {
  const [email, setEmail] = useState(LANKALAB_LOGIN_EMAIL);
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const okEmail = email.trim().toLowerCase() === LANKALAB_LOGIN_EMAIL;
    const okPass = password === LANKALAB_LOGIN_PASSWORD;
    if (!okEmail || !okPass) {
      setError("Email or password is incorrect. Use the pathology lab account.");
      return;
    }
    const payload = JSON.stringify({ email: LANKALAB_LOGIN_EMAIL, at: Date.now() });
    if (remember) localStorage.setItem(LANKALAB_SESSION_KEY, payload);
    else sessionStorage.setItem(LANKALAB_SESSION_KEY, payload);
    onSignedIn(LANKALAB_LOGIN_EMAIL);
  };

  return (
    <div className="min-h-screen bg-white text-slate-700 font-sans">
      <div className="max-w-6xl mx-auto min-h-screen grid grid-cols-1 lg:grid-cols-2 items-center px-6 py-10 gap-10">
        <div className="flex flex-col items-center lg:items-start">
          <p className="italic text-slate-500 text-sm mb-4 self-start">Accurate reports. Trusted pathology.</p>
          <img
            src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=900&q=80"
            alt="Pathology laboratory"
            className="w-full max-w-md h-72 object-cover object-center"
          />
          <div className="w-full max-w-md bg-teal-600 text-white px-6 py-5 -mt-1">
            <h2 className="text-2xl font-semibold tracking-tight">Pathology Portal</h2>
            <p className="text-sm text-teal-50 mt-1">Submit orders, view invoices and laboratory reports</p>
          </div>
        </div>

        <div className="w-full max-w-md mx-auto">
          <div className="flex flex-col items-center mb-8">
            <svg viewBox="0 0 48 48" className="w-12 h-12 text-teal-600" aria-hidden>
              <polygon
                points="24,3 43,13.5 43,34.5 24,45 5,34.5 5,13.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              />
              <polygon points="24,14 32,18.5 32,27.5 24,32 16,27.5 16,18.5" fill="currentColor" />
            </svg>
            <h1 className="mt-3 text-xl font-semibold tracking-[0.18em] text-slate-700">LANKALAB PATHOLOGY</h1>
          </div>

          <p className="text-sm text-slate-600 mb-4">Welcome. Please sign in</p>

          <form onSubmit={submit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Password"
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="accent-sky-600" />
              Remember me
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded">
              Sign In
            </button>
          </form>

          <div className="mt-4 text-sm text-slate-500 space-y-1">
            <button
              type="button"
              className="text-slate-500 hover:underline"
              onClick={() => alert("Password resets are issued by Colombo Central Patholab admin (lis-admin@lankalab.lk).")}
            >
              Forgot your password?
            </button>
            <p>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                className="text-slate-600 hover:underline"
                onClick={() => alert("Pathology portal accounts are created by the laboratory administrator. This is not a dental client signup.")}
              >
                Sign up now
              </button>
            </p>
          </div>
        </div>
      </div>

      <p className="text-center text-[11px] text-slate-400 pb-6">
        Copyright © LankaLab Pathology Portal · Colombo Central Patholab
      </p>
    </div>
  );
}
