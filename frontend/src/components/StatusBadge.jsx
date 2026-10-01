

export default function StatusBadge({ status }) {
  const cls = {
    PENDING:   'badge badge-pending',
    APPROVED:  'badge badge-approved',
    COMPLETED: 'badge badge-completed',
    CANCELLED: 'badge badge-cancelled',
  }[status] || 'badge';

  const dot = { PENDING: '●', APPROVED: '●', COMPLETED: '●', CANCELLED: '●' };

  return <span className={cls}>{dot[status]} {status}</span>;
}
