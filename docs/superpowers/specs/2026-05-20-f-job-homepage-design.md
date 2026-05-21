# F-Job Homepage Design Spec

## Overview

F-Job là nền tảng tìm việc thời vụ/sự kiện, kết nối nhanh giữa ứng viên (sinh viên) và nhà tổ chức sự kiện. Thay vì đăng bài lên Facebook/Zalo, nhà tuyển dụng đăng tin trên F-Job và ứng viên tìm việc phù hợp nhanh chóng.

## Target Users

- **Ứng viên**: Sinh viên, người tìm việc thời vụ
- **Nhà tuyển dụng**: Tổ chức sự kiện, công ty cần nhân sự thời vụ

## Tech Stack

- React 18 + TypeScript + Vite
- React Bootstrap + Custom CSS
- Zustand (state management)
- React Query (data fetching)
- React Router v6

## Color Scheme

- Primary: Gradient tím (#7C3AED → #A855F7)
- Secondary/Background: Tím nhạt (#F5F3FF)
- Text: Dark gray (#1F2937)
- Accent tags: Cam (#F59E0B) cho "Gấp", Xanh lá (#10B981) cho "Mới", Đỏ (#EF4444) cho "Hot"
- White cards, subtle shadows

## Typography

- Font: Inter (Google Fonts) hoặc system font stack
- Headings: Bold (600-700)
- Body: Regular (400)

## Page Structure

### 1. Header/Navbar

- **Position**: Sticky top, nền trắng, box-shadow nhẹ
- **Left**: Logo "F-Job" với gradient tím
- **Center**: Navigation links — Việc làm, Sự kiện, Về chúng tôi
- **Right**: Đăng ký, Đăng nhập (text links), nút "Đăng tin tuyển dụng" (primary button, dành cho nhà tuyển dụng)
- **Responsive**: Hamburger menu trên mobile

### 2. Hero Section

- **Background**: Ảnh nền full-width (sự kiện/sinh viên đang làm việc), overlay gradient tím tối (rgba purple → transparent)
- **Content**:
  - Headline: "Tìm việc thời vụ nhanh — Kết nối ngay với sự kiện"
  - Sub-headline: "Hàng nghìn cơ hội việc làm sự kiện đang chờ bạn"
- **Search Bar**: Nằm phía dưới hero, hơi chồng lên section tiếp theo (negative margin hoặc translate-y)
  - 4 filters inline:
    1. Vai trò (dropdown/input): "Nhập vai trò công việc..."
    2. Địa điểm (dropdown): "Tất cả địa điểm"
    3. Ngày làm việc (date picker): "Chọn ngày"
    4. Mức lương (dropdown): "Mức lương"
  - Nút "Tìm việc" (primary, gradient tím)
- **Height**: ~350-400px

### 3. Quick Tags

- Dãy tag ngang, scrollable trên mobile
- Các tag phổ biến: "PG/PB", "Phục vụ", "Sự kiện HCM", "Concert", "Hội chợ", "Lễ tân"
- Style: Chip/badge với border, hover effect tím

### 4. Danh mục việc làm (Categories Grid)

- **Layout**: Grid responsive — 4 cột desktop, 3 tablet, 2 mobile
- **Mỗi item**: Icon + Số lượng việc (màu tím, bold) + Tên danh mục
- **Danh mục theo sự kiện**: Hội chợ, Concert, Triển lãm, Hội nghị, Tiệc/Wedding, Thể thao
- **Danh mục theo vai trò**: PG/PB, Phục vụ, Lễ tân, MC, Kỹ thuật âm thanh, Bảo vệ
- **Item cuối**: "Tất cả danh mục" (link)
- **Background**: White card với shadow nhẹ, padding rộng

### 5. Việc làm tuyển gấp (Urgent Jobs)

- **Header**: Icon fire + "Việc làm tuyển gấp" (h2) | "Xem thêm >" (link, bên phải)
- **Layout**: Grid 3 cột desktop, 2 tablet, 1 mobile
- **Mỗi Job Card**:
  - Tên việc (bold, 1-2 dòng, truncate)
  - Logo công ty (40x40) + Tên công ty/tổ chức + Verified badge (icon check xanh)
  - Mức lương (icon tiền + text, color tím)
  - Địa điểm (icon pin + text)
  - Ngày diễn ra (icon calendar + text)
  - Số lượng cần tuyển (icon people + text)
  - Loại sự kiện (badge nhỏ)
  - Ca làm: Sáng/Chiều/Tối (badge)
  - Tags: "Gấp" (cam), "Hot" (đỏ), "Mới" (xanh lá) — góc trên phải
  - Footer: "Còn X ngày" (icon clock + text muted)
- **Card style**: White, border-radius 12px, shadow-sm, hover: shadow-md + translateY(-2px)

### 6. Footer

- **Background**: Dark (#1F2937)
- **Layout**: 4 cột
  - Cột 1: Logo F-Job + mô tả ngắn
  - Cột 2: Dành cho ứng viên — Tìm việc, Tạo hồ sơ, Lịch sử ứng tuyển
  - Cột 3: Dành cho nhà tuyển dụng — Đăng tin, Quản lý tin, Tìm ứng viên
  - Cột 4: Liên hệ — Email, Hotline, Địa chỉ
- **Bottom**: Social links (Facebook, Zalo, LinkedIn) + Copyright "© 2026 F-Job"

## Responsive Breakpoints

- Desktop: >= 992px (full layout)
- Tablet: 768px - 991px (2-3 cột grid)
- Mobile: < 768px (1 cột, hamburger menu, stacked search filters)

## Data (Mock/Static cho UI phase)

Sử dụng mock data hardcoded cho giai đoạn build UI. Các entity:
- Categories: { id, name, icon, jobCount, type: 'event' | 'role' }
- Jobs: { id, title, company, logo, salary, location, date, slots, eventType, shift, tags, deadline }

## Out of Scope (Phase 1 - UI Only)

- Authentication flow
- Job detail page
- Employer dashboard
- API integration
- Search functionality (chỉ UI, chưa có logic)
