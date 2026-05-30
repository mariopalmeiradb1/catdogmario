const roleHomeMap: Record<string, string> = {
  adopter: '/catalog',
  ong_volunteer: '/ong/dashboard',
  ong_admin: '/ong/dashboard',
  system_admin: '/admin/ongs',
};

export function getRoleHome(role: string): string {
  return roleHomeMap[role] || '/login';
}
