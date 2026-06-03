import { Container } from 'react-bootstrap';
import UserAvatar from '@components/common/UserAvatar';

/**
 * Phiên bản đơn giản để test xem component có bị lỗi không
 */
export default function CandidateSearchPageSimple() {
  return (
    <Container className="py-4">
      <h1 className="h3 fw-bold mb-1">Tìm ứng viên (Test Version)</h1>
      <p className="text-muted">Trang test để kiểm tra component UserAvatar</p>
      
      <div className="my-4">
        <h5>Test Avatar Components:</h5>
        <div className="d-flex gap-3 mt-3">
          <div>
            <UserAvatar src={null} alt="Nguyễn Văn A" size={56} />
            <small className="d-block mt-1">Nguyễn Văn A</small>
          </div>
          <div>
            <UserAvatar src={null} alt="Kiệt Lương" size={56} />
            <small className="d-block mt-1">Kiệt Lương</small>
          </div>
          <div>
            <UserAvatar src={null} alt="Nguyễn Khoa" size={56} />
            <small className="d-block mt-1">Nguyễn Khoa</small>
          </div>
        </div>
      </div>
      
      <div className="alert alert-success">
        ✅ Nếu bạn thấy trang này và các avatar hiển thị, nghĩa là component hoạt động!
      </div>
      
      <div className="alert alert-info">
        Vấn đề có thể do:
        <ul>
          <li>Browser cache - Hãy hard refresh (Cmd+Shift+R hoặc Ctrl+Shift+F5)</li>
          <li>API endpoint /search/candidates không hoạt động</li>
          <li>Lỗi authentication - cần đăng nhập với role EMPLOYER hoặc ADMIN</li>
        </ul>
      </div>
    </Container>
  );
}
