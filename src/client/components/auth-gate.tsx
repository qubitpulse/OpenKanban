import { useState, useEffect, useMemo } from "preact/hooks";
import type { JSX } from "preact";
import type { User } from "firebase/auth";
import type { Backend } from "../backends/types";

type FirebaseModule = typeof import("../backends/firebase");

export interface Session {
  backend: Backend;
  signOut: () => void;
}

interface AuthGateProps {
  children: (session: Session) => JSX.Element;
}

/**
 * Login screen in front of the board (Firebase mode). This only decides what
 * to render; the data itself is protected by firestore.rules, which reject
 * every read and write from anyone but the board's account.
 */
export function AuthGate({ children }: AuthGateProps) {
  const [firebase, setFirebase] = useState<FirebaseModule | null>(null);
  // undefined: still checking for a saved session
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe = () => {};
    let cancelled = false;
    import("../backends/firebase")
      .then((mod) => {
        if (cancelled) return;
        setFirebase(mod);
        unsubscribe = mod.onUserChanged(setUser);
      })
      .catch((err) => setLoadError((err as Error).message));
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  // One backend per signed-in user; a new one after signing out and back in
  const uid = user?.uid;
  const session = useMemo<Session | null>(
    () => (firebase && uid ? { backend: firebase.createFirebaseBackend(), signOut: () => firebase.signOut() } : null),
    [firebase, uid],
  );

  if (loadError) return <div class="gate"><p class="gate-error">Could not load: {loadError}</p></div>;
  if (!firebase || user === undefined) return <div class="gate" aria-busy="true" />;
  if (!session) return <LoginForm firebase={firebase} />;
  return children(session);
}

function LoginForm({ firebase }: { firebase: FirebaseModule }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await firebase.signIn(email.trim(), password);
      // AuthGate swaps in the board once the auth state changes
    } catch (err) {
      setError(firebase.signInErrorMessage(err));
      setPassword("");
      setBusy(false);
    }
  };

  return (
    <div class="gate">
      <form class="gate-form inline-form" onSubmit={handleSubmit}>
        <h1 class="gate-title">Sign in</h1>
        <label for="gate-email">Email</label>
        <input
          id="gate-email"
          type="email"
          autocomplete="username"
          required
          value={email}
          onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
        />
        <label for="gate-password">Password</label>
        <input
          id="gate-password"
          type="password"
          autocomplete="current-password"
          required
          value={password}
          onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
        />
        {error && <p class="gate-error" role="alert">{error}</p>}
        <button class="btn btn-primary" type="submit" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
