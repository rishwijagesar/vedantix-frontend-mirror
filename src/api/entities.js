/**
 * Base44 entity SDK placeholder.
 *
 * The original file re-exported entities from the Base44 SDK. That backend is
 * intentionally not migrated yet, so these stubs keep the public frontend
 * building and rendering unchanged while every data call fails softly (the
 * pages already handle load errors and empty states).
 */
const NOT_CONFIGURED = "Backend is nog niet gekoppeld.";

function createEntityStub() {
  return {
    async list() {
      return [];
    },
    async filter() {
      return [];
    },
    async get() {
      return null;
    },
    async create() {
      throw new Error(NOT_CONFIGURED);
    },
    async update() {
      throw new Error(NOT_CONFIGURED);
    },
    async delete() {
      throw new Error(NOT_CONFIGURED);
    },
  };
}

export const Availability = createEntityStub();
export const Appointment = createEntityStub();
