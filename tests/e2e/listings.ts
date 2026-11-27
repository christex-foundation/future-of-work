export const E2E_SPONSOR_SLUG = 'e2e-sponsor';
export const COMPLETED_TITLE = 'E2E Completed Listing';
export const COMPLETED_SLUG = 'e2e-completed';
export const TALENT_NAME = 'E2E Talent';
export const WORKER_SLOTS = [0, 1] as const;

export function submitTitle(workerIndex: number): string {
  return `E2E Open Listing ${workerIndex}`;
}

export function submitSlug(workerIndex: number): string {
  return `e2e-submit-${workerIndex}`;
}

export function reviewTitle(workerIndex: number): string {
  return `E2E Review Listing ${workerIndex}`;
}

export function reviewSlug(workerIndex: number): string {
  return `e2e-review-${workerIndex}`;
}
