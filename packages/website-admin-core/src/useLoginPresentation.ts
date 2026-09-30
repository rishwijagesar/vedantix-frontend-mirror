import { useEffect, useState } from "react";
import { DEFAULT_LOGIN_PRESENTATION, loadLoginPresentation, mayApplyLoginPresentation, type LoginPresentation } from "./login-presentation";

export function useLoginPresentation(interaction: Readonly<{ current: boolean }>): Readonly<LoginPresentation> {
  const [presentation, setPresentation] = useState<Readonly<LoginPresentation>>(DEFAULT_LOGIN_PRESENTATION);
  useEffect(() => {
    let disposed = false;
    const controller = new AbortController();
    void loadLoginPresentation(globalThis.fetch, controller.signal).then(next => {
      if (mayApplyLoginPresentation(interaction.current, disposed)) setPresentation(next);
    });
    return () => { disposed = true; controller.abort(); };
  }, [interaction]);
  return presentation;
}
