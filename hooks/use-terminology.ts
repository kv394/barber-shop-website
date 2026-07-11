import { useMemo } from 'react';
import { IndustryType } from '@prisma/client';
import { getTerminology, TerminologyKey } from '@/lib/shop-terminology';

export function useTerminology(industryType: IndustryType | null | undefined) {
  const t = useMemo(() => {
    return (key: TerminologyKey) => getTerminology(industryType, key);
  }, [industryType]);

  return { t, industryType };
}
