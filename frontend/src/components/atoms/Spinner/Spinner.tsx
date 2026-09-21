import { Icon } from '@/components/quarks/Icon';
export function Spinner({ label = 'Загрузка', size = 72 }: { label?: string; size?: number }) {
  return (
    <span role="status">
      <Icon name="spinner" size={size} spin />
      <span className="visually-hidden">{label}</span>
    </span>
  );
}
