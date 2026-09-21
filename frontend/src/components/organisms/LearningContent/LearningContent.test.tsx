import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LearningContent } from './LearningContent';
describe('safe learning content', () => {
  it('renders markup as text and excludes executable links', () => {
    const { container } = render(
      <LearningContent
        blocks={[
          { type: 'paragraph', text: '<script>alert(1)</script>' },
          { type: 'link', title: 'Unsafe', url: 'javascript:alert(1)' },
          { type: 'code', language: 'HTML', text: '<img src=x onerror=alert(1)>' },
        ]}
      />,
    );
    expect(container.querySelector('script,img')).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('<script>alert(1)</script>')).toBeInTheDocument();
  });
  it('renders structured tables and safe external links', () => {
    render(
      <LearningContent
        blocks={[
          { type: 'table', headers: ['Тема', 'Статус'], rows: [['Практика', 'Изучено']] },
          { type: 'link', title: 'Source', url: 'https://example.test/docs' },
        ]}
      />,
    );
    expect(screen.getAllByRole('columnheader')).toHaveLength(2);
    expect(screen.getByRole('link')).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
