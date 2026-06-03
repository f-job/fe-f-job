import { useState } from 'react';

interface UserAvatarProps {
  src?: string | null;
  alt: string;
  size?: number;
  className?: string;
}

/**
 * Component hiển thị avatar của người dùng với fallback
 * Nếu không có ảnh, sẽ hiển thị avatar mặc định với chữ cái đầu
 */
export default function UserAvatar({ src, alt, size = 56, className = '' }: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  
  // Lấy chữ cái đầu tiên của tên để tạo avatar
  const getInitials = (name: string): string => {
    if (!name || typeof name !== 'string') return '?';
    const words = name.trim().split(/\s+/);
    if (words.length === 0) return '?';
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    // Lấy chữ cái đầu của từ đầu tiên và từ cuối cùng
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  // Tạo màu background dựa trên tên
  const getBackgroundColor = (name: string): string => {
    const colors = [
      '#FF6B6B', // Đỏ nhạt
      '#4ECDC4', // Xanh ngọc
      '#45B7D1', // Xanh dương
      '#FFA07A', // Cam nhạt
      '#98D8C8', // Xanh lá nhạt
      '#F7DC6F', // Vàng
      '#BB8FCE', // Tím nhạt
      '#85C1E2', // Xanh da trời
      '#F8B739', // Vàng cam
      '#52B788', // Xanh lá
    ];
    
    if (!name || typeof name !== 'string') return colors[0];
    
    // Hash tên để chọn màu nhất quán
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const initials = getInitials(alt);
  const bgColor = getBackgroundColor(alt);

  // Nếu có ảnh và ảnh không bị lỗi, hiển thị ảnh
  if (src && !imageError) {
    return (
      <img
        src={src}
        alt={alt}
        className={`rounded-circle ${className}`}
        width={size}
        height={size}
        style={{ objectFit: 'cover' }}
        onError={() => setImageError(true)}
      />
    );
  }

  // Nếu không có ảnh hoặc ảnh bị lỗi, hiển thị avatar với chữ cái đầu
  return (
    <div
      className={`rounded-circle d-flex align-items-center justify-content-center ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: bgColor,
        color: '#FFFFFF',
        fontSize: size * 0.4,
        fontWeight: 'bold',
        flexShrink: 0,
      }}
      title={alt}
    >
      {initials}
    </div>
  );
}
