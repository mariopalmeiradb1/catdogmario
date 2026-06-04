const roleHomeMap: Record<string, string> = {
  adopter: '/catalog',
  ong_volunteer: '/ong/animals',
  ong_admin: '/ong/animals',
  system_admin: '/admin/ongs',
};

export function getRoleHome(role: string): string {
  return roleHomeMap[role] || '/login';
}
