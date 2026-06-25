import { Badge } from 'react-bootstrap';

interface VerificationBadgeProps {
  isVerified: boolean;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function VerificationBadge({ 
  isVerified, 
  size = 'md',
  showText = true 
}: VerificationBadgeProps) {
  if (!isVerified) return null;

  const sizeClass = size === 'sm' ? 'small' : size === 'lg' ? 'fs-6' : '';

  return (
    <Badge 
      bg="success" 
      className={`${sizeClass} d-inline-flex align-items-center gap-1`}
      title="Danh tính đã xác thực"
    >
      <i className="bi bi-shield-check" />
      {showText && <span>Đã xác thực</span>}
    </Badge>
  );
}
