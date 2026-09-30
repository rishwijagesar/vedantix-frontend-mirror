import assert from "node:assert/strict";
import test from "node:test";
import { createClientAccessApi, ClientAccessError, invitationIsOpen, invitationStatus, type ClientAccessBody } from "../src/admin/client-access-api.ts";

test("loading the module performs only a list request and requires server authorization", async () => {
  const requests: ClientAccessBody[] = [];
  const api = createClientAccessApi(async body => { requests.push(body); return { data: { can_manage: true, sites: [], members: [], invitations: [] }, error: null }; });
  assert.equal((await api.list()).can_manage, true);
  assert.deepEqual(requests, [{ action: "list" }]);
  const denied = createClientAccessApi(async () => ({ data: { can_manage: false, sites: [], members: [], invitations: [] }, error: null }));
  await assert.rejects(denied.list(), ClientAccessError);
});
test("explicit mutation retains the request ID across a network retry", async () => {
  const requests: ClientAccessBody[] = [];
  const api = createClientAccessApi(async body => {
    requests.push(body);
    if (requests.length === 1) throw new Error("Network unavailable");
    return { data: { ok: true, status: "sent" }, error: null };
  });
  const action = { action: "invite" as const, site_slug: "naturehealing", email: "client@example.test", request_id: "11111111-1111-4111-8111-111111111111" };
  await assert.rejects(api.mutate(action));
  await api.mutate(action);
  assert.deepEqual(requests, [action, action]);
});
test("403 and unconfirmed writes cannot be shown as success", async () => {
  const denied = createClientAccessApi(async () => ({ data: null, error: { context: { status: 403 } } }));
  await assert.rejects(denied.list(), error => error instanceof ClientAccessError && error.status === 403);
  const failed = createClientAccessApi(async () => ({ data: { ok: false }, error: null }));
  await assert.rejects(failed.mutate({ action: "cancel_invitation", invitation_id: "invitation", request_id: "request" }));
});
test("mail replay statuses only report sent after actual delivery confirmation", async () => {
  const action = { action: "invite" as const, site_slug: "naturehealing", email: "client@example.test", request_id: "request" };
  for (const status of ["pending", "sending", "failed", "revoked"]) {
    const api = createClientAccessApi(async () => ({ data: { ok: true, status }, error: null }));
    await assert.rejects(api.mutate(action));
  }
});
test("accepted, cancelled and expired invitations are not offered cancellation", () => {
  const invitation = { id: "i", site_slug: "naturehealing", email: "client@example.test", status: "SENT", created_at: "2026-09-30T12:00:00Z", sent_at: null, expires_at: null };
  assert.equal(invitationIsOpen(invitation), true);
  for (const status of ["accepted", "cancelled", "expired"]) assert.equal(invitationIsOpen({ ...invitation, status }), false);
  assert.equal(invitationIsOpen({ ...invitation, expires_at: "2026-01-01T00:00:00Z" }), false);
  assert.equal(invitationStatus("SENT"), "Verstuurd");
});
