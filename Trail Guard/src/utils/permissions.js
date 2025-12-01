import { ADMIN_ROLE_ID, STAFF_ROLE_ID } from "../config.js";

export function hasStaffOrAdmin(member) {
  if (!member || !member.roles) return false;
  return member.roles.cache.has(STAFF_ROLE_ID) || member.roles.cache.has(ADMIN_ROLE_ID);
}

export function ensureStaffOrAdmin(interaction) {
  const member = interaction.member;
  if (!hasStaffOrAdmin(member)) {
    throw new Error("You do not have permission to use this command (staff/admin only).");
  }
}
