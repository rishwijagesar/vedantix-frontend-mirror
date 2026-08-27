/**
 * Compatibility shim so migrated pages can keep importing the same router
 * primitives they used on the previous stack, while the app actually runs on
 * TanStack Router. No visual or behavioural changes.
 */
import { forwardRef, type AnchorHTMLAttributes, type ReactNode } from "react";
import {
  Link as TanstackLink,
  useLocation as useTanstackLocation,
  useNavigate as useTanstackNavigate,
  useParams as useTanstackParams,
  useRouterState,
} from "@tanstack/react-router";

type ToValue = string | { pathname?: string; search?: string; hash?: string };

function splitTo(to: ToValue) {
  if (typeof to !== "string") {
    return {
      pathname: to.pathname ?? "",
      search: to.search ?? "",
      hash: to.hash ?? "",
    };
  }
  let rest = to;
  let hash = "";
  let search = "";
  const hashIndex = rest.indexOf("#");
  if (hashIndex >= 0) {
    hash = rest.slice(hashIndex + 1);
    rest = rest.slice(0, hashIndex);
  }
  const searchIndex = rest.indexOf("?");
  if (searchIndex >= 0) {
    search = rest.slice(searchIndex + 1);
    rest = rest.slice(0, searchIndex);
  }
  return { pathname: rest, search, hash };
}

function isExternal(to: ToValue) {
  return (
    typeof to === "string" &&
    /^(https?:|mailto:|tel:|\/\/|#)/.test(to)
  );
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  to: ToValue;
  replace?: boolean;
  state?: unknown;
  children?: ReactNode;
};

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { to, replace, state: _state, children, ...rest },
  ref,
) {
  if (isExternal(to)) {
    return (
      <a ref={ref} href={to as string} {...rest}>
        {children}
      </a>
    );
  }

  const { pathname, search, hash } = splitTo(to);
  const searchObject = search
    ? Object.fromEntries(new URLSearchParams(search).entries())
    : undefined;

  return (
    <TanstackLink
      ref={ref}
      to={pathname || "/"}
      {...(searchObject ? { search: searchObject } : {})}
      {...(hash ? { hash } : {})}
      {...(replace ? { replace: true } : {})}
      {...(rest as Record<string, unknown>)}
    >
      {children}
    </TanstackLink>
  );
});

export const NavLink = Link;

export function useLocation() {
  const location = useTanstackLocation();
  return {
    pathname: location.pathname,
    search: location.searchStr ? `?${location.searchStr}` : "",
    hash: location.hash ? `#${location.hash}` : "",
    state: location.state,
    key: location.href,
  };
}

export function useParams() {
  return useTanstackParams({ strict: false }) as Record<string, string>;
}

export function useNavigate() {
  const navigate = useTanstackNavigate();
  return (to: ToValue | number, options?: { replace?: boolean }) => {
    if (typeof to === "number") {
      if (typeof window !== "undefined") window.history.go(to);
      return;
    }
    const { pathname, search, hash } = splitTo(to);
    navigate({
      to: pathname || "/",
      ...(search
        ? { search: Object.fromEntries(new URLSearchParams(search).entries()) }
        : {}),
      ...(hash ? { hash } : {}),
      ...(options?.replace ? { replace: true } : {}),
    });
  };
}

export function useSearchParams(): [
  URLSearchParams,
  (next: URLSearchParams | Record<string, string>) => void,
] {
  const searchStr = useRouterState({
    select: (s) => s.location.searchStr,
  });
  const navigate = useTanstackNavigate();
  const params = new URLSearchParams(searchStr ?? "");
  const setParams = (next: URLSearchParams | Record<string, string>) => {
    const nextParams =
      next instanceof URLSearchParams ? next : new URLSearchParams(next);
    navigate({
      to: ".",
      search: Object.fromEntries(nextParams.entries()),
    });
  };
  return [params, setParams];
}

export function Navigate({ to, replace }: { to: ToValue; replace?: boolean }) {
  const navigate = useNavigate();
  navigateOnMount(() => navigate(to, replace ? { replace: true } : {}));
  return null;
}

function navigateOnMount(run: () => void) {
  if (typeof window === "undefined") return;
  queueMicrotask(run);
}

export { Outlet } from "@tanstack/react-router";
