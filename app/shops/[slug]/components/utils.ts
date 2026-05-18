export function formatAddress(addr: any): string {
  if (!addr) return '';
  if (typeof addr === 'string') return addr;
  const parts = [
    addr.street,
    addr.suite,
    addr.city,
    addr.state && addr.zip ? `${addr.state} ${addr.zip}` : (addr.state || addr.zip),
  ].filter(Boolean);
  return parts.join(', ');
}

