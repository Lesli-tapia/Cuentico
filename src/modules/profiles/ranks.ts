export const readingRanks = ['Explorador de historias','Lector novato','Lector aventurero','Lector experto','Devorador de cuentos'] as const;
export function readingRank(ids: string[]) { return readingRanks[Math.min(new Set(ids).size,readingRanks.length-1)]; }
