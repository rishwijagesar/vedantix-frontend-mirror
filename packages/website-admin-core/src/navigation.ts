import type { AdminModuleDefinition } from "./types.ts";

export function enabledModules<T extends AdminModuleDefinition>(modules: readonly T[]): T[] {
  const ids = new Set<string>();
  return modules.filter(module => {
    if (!module.id || ids.has(module.id)) throw new Error("Admin module IDs must be non-empty and unique.");
    ids.add(module.id);
    return module.enabled;
  });
}

export function groupModules<T extends AdminModuleDefinition>(modules: readonly T[]): { label: string; modules: T[] }[] {
  const groups = new Map<string, T[]>();
  for (const module of enabledModules(modules)) {
    const label = module.group || "Website";
    const group = groups.get(label) || [];
    group.push(module);
    groups.set(label, group);
  }
  return [...groups].map(([label, modules]) => ({ label, modules }));
}

export function safePublicUrl(value: string): string | null {
  try {
    if (!value.startsWith("/") && !/^https?:\/\//i.test(value)) return null;
    const url = new URL(value, "https://vedantix.invalid");
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (url.username || url.password || value.startsWith("//")) return null;
    return value.startsWith("/") ? url.pathname + url.search + url.hash : url.href;
  } catch { return null; }
}
