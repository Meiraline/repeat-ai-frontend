import { delay, http, HttpResponse } from 'msw';
import { env } from '@/shared/config/env';
import { approvedReviews } from '../fixtures/review-store';
import { findLearning } from '../fixtures/learning-store';
import { sampleCourses } from '../fixtures/courses';
import { mockAuthenticated, mockUnauthorized } from './auth';

export const dashboardHandlers = [
  http.get(`${env.apiBaseUrl}/dashboard`, async ({ request }) => {
    await delay(150);
    if (!mockAuthenticated()) return mockUnauthorized();
    {
      const all = [
          ...(sessionStorage.getItem('repeat-preview-dashboard') === 'sample'
            ? sampleCourses()
            : []),
          ...approvedReviews().map((r) => ({
            ...r.track!,
            progressPercent: findLearning(r.track!.id)?.record.track.progressPercent ?? 0,
            planId: r.id,
            currentTopic: r.program.topics[0]
              ? { id: r.program.topics[0].id, title: r.program.topics[0].title }
              : null,
            nextAction: 'Программа утверждена',
            nextDeadline: r.program.targetDate,
            riskStatus: 'normal',
          })),
        ],
        filter = new URL(request.url).searchParams.get('filter');
      const tracks = all.filter((t) =>
        filter === 'completed'
          ? t.status === 'completed'
          : filter === 'attention'
            ? t.riskStatus === 'overdue'
            : t.status === 'active',
      );
      return HttpResponse.json({
        data: {
          summary: {
            activeTrackCount: all.filter((t) => t.status === 'active').length,
            attentionCount: all.filter((t) => t.riskStatus === 'overdue').length,
            nextDeadline: all[0]?.nextDeadline ?? null,
          },
          tracks,
          partialErrors: [],
        },
      });
    }
  }),
];
