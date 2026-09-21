import { setupWorker } from 'msw/browser';
import { dashboardHandlers } from './handlers/dashboard';
import { authHandlers } from './handlers/auth';
import { planHandlers } from './handlers/plans';
import { reviewHandlers } from './handlers/reviews';
import { learningHandlers } from './handlers/learning';
import { tutorHandlers } from './handlers/tutor';
import { assessmentHandlers } from './handlers/assessments';
import { diplomaHandlers } from './handlers/diplomas';
import { billingHandlers } from './handlers/billing';

const worker = setupWorker(
  ...authHandlers,
  ...dashboardHandlers,
  ...planHandlers,
  ...reviewHandlers,
  ...learningHandlers,
  ...tutorHandlers,
  ...assessmentHandlers,
  ...diplomaHandlers,
  ...billingHandlers,
);

export async function startMocks() {
  await worker.start({
    serviceWorker: { url: '/mockServiceWorker.js' },
    onUnhandledRequest(request, print) {
      if (new URL(request.url).pathname.startsWith('/api/')) print.error();
    },
  });
}
