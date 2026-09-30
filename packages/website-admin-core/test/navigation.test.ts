import assert from "node:assert/strict";
import test from "node:test";
import { enabledModules, groupModules, safePublicUrl } from "../src/navigation.ts";

test("disabled modules stay hidden and enabled group order is retained", () => {
  const modules = [
    { id: "intro", label: "Intro", enabled: true, group: "Homepage" },
    { id: "shop", label: "Shop", enabled: false, group: "Commerce" },
    { id: "profile", label: "Profiel", enabled: true, group: "Account" },
    { id: "about", label: "Over mij", enabled: true, group: "Homepage" },
  ];
  assert.deepEqual(groupModules(modules).map(group => [group.label, group.modules.map(module => module.id)]), [["Homepage", ["intro", "about"]], ["Account", ["profile"]]]);
  assert.equal(enabledModules(modules).length, 3);
});
test("duplicate module IDs cannot silently select the wrong editor", () => {
  assert.throws(() => enabledModules([{ id: "a", label: "A", enabled: true }, { id: "a", label: "B", enabled: false }]));
});
test("public website links accept http(s) and local previews, reject executable links and credentials", () => {
  assert.equal(safePublicUrl("https://naturehealing.nl"), "https://naturehealing.nl/");
  assert.equal(safePublicUrl("/admin/voorbeeld"), "/admin/voorbeeld");
  for (const value of ["javascript:alert(1)", "data:text/html,test", "//example.com", "https://user:pass@example.com"]) assert.equal(safePublicUrl(value), null);
});
