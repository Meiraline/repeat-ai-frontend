export function sampleCourses() {
  const date = (days: number) => new Date(Date.now() + days * 86400000).toISOString();
  return [
    {
      id: 'sample-projects',
      title: 'Планирование проектов',
      status: 'active',
      progressPercent: 81,
      currentTopic: { id: 'p1', title: 'Итоговая практика' },
      nextAction: 'continue_topic',
      nextDeadline: date(-1),
      riskStatus: 'overdue',
    },
    {
      id: 'sample-data',
      title: 'Аналитика данных',
      status: 'active',
      progressPercent: 45,
      currentTopic: { id: 'd1', title: 'Интерпретация распределений' },
      nextAction: 'continue_topic',
      nextDeadline: date(3),
      riskStatus: 'due_soon',
    },
    {
      id: 'sample-english',
      title: 'Деловой английский B2',
      status: 'active',
      progressPercent: 12,
      currentTopic: { id: 'e1', title: 'Деловая переписка' },
      nextAction: 'start_topic',
      nextDeadline: date(8),
      riskStatus: null,
    },
    {
      id: 'sample-complete',
      title: 'Основы презентаций',
      status: 'completed',
      progressPercent: 100,
      currentTopic: null,
      nextAction: 'open_track',
      nextDeadline: null,
      riskStatus: null,
    },
  ];
}
