export const Roles = {
  ADOPTER: 'adopter',
  ONG_VOLUNTEER: 'ong_volunteer',
  ONG_ADMIN: 'ong_admin',
  SYSTEM_ADMIN: 'system_admin',
} as const;

export type Role = (typeof Roles)[keyof typeof Roles];
