import { safeSourceUrl, type ContentBlock } from '@/shared/lib/content';
import styles from './LearningContent.module.css';
export function LearningContent({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className={styles.content}>
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'heading':
            return <h3 key={i}>{block.text}</h3>;
          case 'paragraph':
            return <p key={i}>{block.text}</p>;
          case 'list':
            return (
              <ul key={i}>
                {block.items.map((text, j) => (
                  <li key={j}>{text}</li>
                ))}
              </ul>
            );
          case 'code':
            return (
              <pre key={i} tabIndex={0} aria-label={`Код: ${block.language}`}>
                <code>{block.text}</code>
              </pre>
            );
          case 'table':
            return (
              <div
                key={i}
                className={styles.table}
                tabIndex={0}
                role="region"
                aria-label="Таблица учебного материала"
              >
                <table>
                  <thead>
                    <tr>
                      {block.headers.map((h, j) => (
                        <th key={j} scope="col">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, j) => (
                      <tr key={j}>
                        {row.map((cell, k) => (
                          <td key={k}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case 'link': {
            const url = safeSourceUrl(block.url);
            return url ? (
              <p key={i}>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  {block.title} — открыть в новой вкладке
                </a>
              </p>
            ) : (
              <p key={i}>{block.title} — ссылка недоступна</p>
            );
          }
        }
      })}
    </div>
  );
}
