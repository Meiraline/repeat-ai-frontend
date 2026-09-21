import type { Review } from '@/features/plans';
export type ReviewDatabase = {
  reviews: Record<string, Review>;
  operations: Record<string, { fingerprint: string; response: Review }>;
};
const key = () =>
  `repeat-preview-reviews:${sessionStorage.getItem('repeat-preview-identity') ?? 'anonymous'}`;
export const readReviews = (): ReviewDatabase =>
  JSON.parse(sessionStorage.getItem(key()) ?? '{"reviews":{},"operations":{}}');
export const writeReviews = (db: ReviewDatabase) =>
  sessionStorage.setItem(key(), JSON.stringify(db));
export function approvedReviews() {
  return Object.values(readReviews().reviews).filter((r) => r.track);
}
