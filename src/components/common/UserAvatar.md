# UserAvatar Component

Component hiển thị avatar người dùng với fallback thông minh.

## Tính năng

- **Hiển thị ảnh avatar**: Nếu có URL ảnh, sẽ hiển thị ảnh đó
- **Fallback với chữ cái đầu**: Nếu không có ảnh hoặc ảnh bị lỗi, sẽ tự động tạo avatar từ chữ cái đầu tiên của tên
- **Màu sắc động**: Mỗi người dùng sẽ có màu background riêng dựa trên tên (nhất quán)
- **Xử lý lỗi tự động**: Khi ảnh không load được, tự động chuyển sang avatar chữ cái

## Cách sử dụng

```tsx
import UserAvatar from '@components/common/UserAvatar';

// Với ảnh avatar
<UserAvatar 
  src="https://example.com/avatar.jpg"
  alt="Nguyễn Văn A"
  size={56}
/>

// Không có ảnh - sẽ hiển thị avatar với chữ "NA" (từ "Nguyễn Văn A")
<UserAvatar 
  src={null}
  alt="Nguyễn Văn A"
  size={56}
/>

// Custom class
<UserAvatar 
  src={user.avatarUrl}
  alt={user.fullName}
  size={80}
  className="border border-2 border-primary"
/>
```

## Props

| Prop | Type | Mặc định | Mô tả |
|------|------|----------|-------|
| `src` | `string \| null` | - | URL ảnh avatar (có thể null) |
| `alt` | `string` | - | **Bắt buộc.** Tên người dùng (dùng cho alt text và tạo chữ cái đầu) |
| `size` | `number` | `56` | Kích thước avatar (px) |
| `className` | `string` | `''` | Class CSS bổ sung |

## Ví dụ trong các trang

### Trang tìm ứng viên
```tsx
<UserAvatar
  src={candidate.avatarUrl}
  alt={candidate.fullName}
  size={56}
/>
```

### Navbar
```tsx
<UserAvatar
  src={user.avatarUrl}
  alt={user.name ?? user.fullName ?? user.email ?? 'User'}
  size={32}
/>
```

### Profile page
```tsx
<UserAvatar
  src={profile?.avatarUrl}
  alt={profile?.fullName || 'Avatar'}
  size={120}
/>
```

### Chat/Messages
```tsx
<UserAvatar
  src={null}
  alt={otherParticipantName}
  size={40}
/>
```

## Màu sắc

Component sử dụng một bảng màu gồm 10 màu pastel:
- Đỏ nhạt (#FF6B6B)
- Xanh ngọc (#4ECDC4)
- Xanh dương (#45B7D1)
- Cam nhạt (#FFA07A)
- Xanh lá nhạt (#98D8C8)
- Vàng (#F7DC6F)
- Tím nhạt (#BB8FCE)
- Xanh da trời (#85C1E2)
- Vàng cam (#F8B739)
- Xanh lá (#52B788)

Màu được chọn dựa trên hash của tên người dùng, đảm bảo mỗi người luôn có cùng một màu.

## Lưu ý

- Chữ cái được lấy từ từ đầu tiên và từ cuối cùng của tên
- Nếu tên chỉ có một từ, chỉ lấy chữ cái đầu tiên
- Font size của chữ cái tự động scale theo kích thước avatar (40% của size)
- Component tự động xử lý lỗi load ảnh bằng state `imageError`
