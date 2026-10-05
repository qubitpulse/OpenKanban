import { useEffect, useMemo } from "preact/hooks";
import { BoardContext } from "./context";
import { useBoardState } from "./hooks/use-board";
import { createHttpBackend } from "./backends/http";
import type { Backend } from "./backends/types";
import { Toolbar } from "./components/toolbar";
import { Board } from "./components/board";
import { ErrorBanner } from "./components/error-banner";
import { AuthGate } from "./components/auth-gate";

const USE_FIREBASE = import.meta.env.VITE_BACKEND === "firebase";

export function App() {
  const isAgent = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.has("agent") || params.get("mode") === "agent";
  }, []);

  useEffect(() => {
    if (isAgent) {
      document.documentElement.setAttribute("data-agent", "");
    }
  }, [isAgent]);

  if (USE_FIREBASE) {
    // Nothing from the board loads until the user signs in
    return (
      <AuthGate>
        {(session) => <BoardApp isAgent={isAgent} backend={session.backend} signOut={session.signOut} />}
      </AuthGate>
    );
  }
  return <HttpBoardApp isAgent={isAgent} />;
}

function HttpBoardApp({ isAgent }: { isAgent: boolean }) {
  const backend = useMemo(createHttpBackend, []);
  return <BoardApp isAgent={isAgent} backend={backend} />;
}

interface BoardAppProps {
  isAgent: boolean;
  backend: Backend;
  signOut?: () => void;
}

function BoardApp({ isAgent, backend, signOut }: BoardAppProps) {
  const boardState = useBoardState(isAgent, backend, signOut);

  return (
    <BoardContext.Provider value={boardState}>
      <Toolbar />
      <Board />
      <ErrorBanner />
    </BoardContext.Provider>
  );
}
