export function maskCpf(cpf: string): string {
  return `***.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-**`;
}

export function maskRg(rg: string): string {
  const visibleCount = 4;
  const maskedCount = rg.length - visibleCount;
  return `${'*'.repeat(maskedCount)}${rg.slice(-visibleCount)}`;
}
