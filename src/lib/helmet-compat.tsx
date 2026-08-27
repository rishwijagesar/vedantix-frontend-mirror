/**
 * Minimal Helmet replacement. React 19 hoists <title>/<meta>/<link> into the
 * document head automatically, so rendering children as-is keeps the previous
 * behaviour without the react-helmet-async dependency.
 */
import type { ReactNode } from "react";

export function Helmet({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

export function HelmetProvider({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

export default Helmet;
