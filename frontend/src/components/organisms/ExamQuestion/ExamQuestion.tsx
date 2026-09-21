import styles from './ExamQuestion.module.css';
type Question = {
  id: string;
  title: string;
  type: 'single' | 'multiple' | 'short' | 'free';
  options: { id: string; text: string }[];
};
export function ExamQuestion({
  question,
  value,
  disabled,
  onChange,
}: {
  question: Question;
  value: string | string[] | undefined;
  disabled: boolean;
  onChange: (value: string | string[]) => void;
}) {
  const labels = {
    single: 'Один вариант',
    multiple: 'Несколько вариантов',
    short: 'Короткий ответ',
    free: 'Развёрнутый ответ',
  };
  return (
    <fieldset className={styles.question} disabled={disabled}>
      <legend>
        <small>{labels[question.type]}</small>
        <span>{question.title}</span>
      </legend>
      {question.type === 'single' || question.type === 'multiple' ? (
        question.options.map((option) => (
          <label key={option.id} className={styles.option}>
            <input
              type={question.type === 'single' ? 'radio' : 'checkbox'}
              name={question.id}
              value={option.id}
              checked={
                question.type === 'single'
                  ? value === option.id
                  : Array.isArray(value) && value.includes(option.id)
              }
              onChange={(e) =>
                onChange(
                  question.type === 'single'
                    ? option.id
                    : e.target.checked
                      ? [...(Array.isArray(value) ? value : []), option.id]
                      : (Array.isArray(value) ? value : []).filter((v) => v !== option.id),
                )
              }
            />
            <span>{option.text}</span>
          </label>
        ))
      ) : (
        <label>
          Ваш ответ
          {question.type === 'free' ? (
            <textarea
              rows={7}
              value={typeof value === 'string' ? value : ''}
              maxLength={12000}
              onChange={(e) => onChange(e.target.value)}
            />
          ) : (
            <input
              type="text"
              value={typeof value === 'string' ? value : ''}
              maxLength={12000}
              onChange={(e) => onChange(e.target.value)}
            />
          )}
        </label>
      )}
    </fieldset>
  );
}
