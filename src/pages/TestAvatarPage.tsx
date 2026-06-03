import { Container } from 'react-bootstrap';
import UserAvatar from '@components/common/UserAvatar';

export default function TestAvatarPage() {
  return (
    <Container className="py-5">
      <h1>Test UserAvatar Component</h1>
      
      <div className="d-flex gap-3 my-4">
        <div>
          <p>Không có ảnh (chữ NVA):</p>
          <UserAvatar src={null} alt="Nguyễn Văn A" size={80} />
        </div>
        
        <div>
          <p>Không có ảnh (chữ KL):</p>
          <UserAvatar src={null} alt="Kiệt Lương" size={80} />
        </div>
        
        <div>
          <p>Có ảnh hợp lệ:</p>
          <UserAvatar 
            src="https://i.pravatar.cc/150?img=1" 
            alt="Test User" 
            size={80} 
          />
        </div>
        
        <div>
          <p>Ảnh lỗi (fallback):</p>
          <UserAvatar 
            src="https://invalid-url.com/image.jpg" 
            alt="Error Image" 
            size={80} 
          />
        </div>
      </div>
      
      <div className="alert alert-info">
        Nếu bạn thấy trang này, component đã hoạt động!
      </div>
    </Container>
  );
}
