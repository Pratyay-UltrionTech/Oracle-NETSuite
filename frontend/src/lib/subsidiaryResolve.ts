export interface SubsidiaryRow {
  internalId: string;
  name: string;
}

function subsidiaryNameKey(name: string): string {
  let s = name.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!s) return '';
  if (s.includes(',')) s = s.split(',')[0].trim();
  if (s.includes(':')) {
    const parts = s.split(':').map(p => p.trim()).filter(Boolean);
    s = parts[parts.length - 1] ?? s;
  }
  for (const suffix of [
    ' private limited',
    ' pvt. ltd.',
    ' pvt ltd',
    ' llc',
    ' inc',
    ' ltd',
  ]) {
    if (s.endsWith(suffix)) s = s.slice(0, -suffix.length).trim();
  }
  return s;
}

export function matchSubsidiaryName(query: string, candidateName: string): boolean {
  const raw = query.trim().toLowerCase();
  const name = candidateName.trim().toLowerCase();
  if (!raw || !name) return false;
  if (raw === name) return true;
  if (raw.includes(name) || name.includes(raw)) return true;
  const rawKey = subsidiaryNameKey(query);
  const nameKey = subsidiaryNameKey(candidateName);
  if (rawKey && nameKey && rawKey === nameKey) return true;
  if (rawKey && nameKey && (rawKey.includes(nameKey) || nameKey.includes(rawKey))) return true;
  return false;
}

/** Map a subsidiary label or internalId string to NetSuite internalId. */
export function resolveSubsidiaryInternalId(
  query: string,
  rows: SubsidiaryRow[],
): string | undefined {
  const q = query.trim();
  if (!q) return undefined;
  if (/^\d+$/.test(q)) return q;
  for (const row of rows) {
    if (matchSubsidiaryName(q, row.name)) return String(row.internalId);
  }
  return undefined;
}
