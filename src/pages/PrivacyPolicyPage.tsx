import { Container, Card, Badge } from 'react-bootstrap';
import './PrivacyPolicyPage.css';

export default function PrivacyPolicyPage() {
  return (
    <div className="privacy-policy-page">
      <div className="privacy-header bg-primary text-white py-5">
        <Container>
          <h1 className="fw-bold mb-2">Chính sách bảo mật</h1>
          <p className="mb-0 opacity-75">
            Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </Container>
      </div>

      <Container className="py-5">
        <Card className="border-0 shadow-sm mb-4">
          <Card.Body className="p-4">
            <div className="alert alert-info mb-4">
              <i className="bi bi-info-circle me-2"></i>
              <strong>Lưu ý:</strong> Chính sách này tuân thủ{' '}
              <strong>Nghị định 13/2023/NĐ-CP</strong> về Bảo vệ dữ liệu cá nhân của Việt Nam.
            </div>

            <section className="mb-5">
              <h2 className="h4 fw-bold mb-3">
                <i className="bi bi-1-circle-fill text-primary me-2"></i>
                Giới thiệu
              </h2>
              <p>
                F-Job ("chúng tôi", "của chúng tôi") cam kết bảo vệ quyền riêng tư và 
                dữ liệu cá nhân của bạn. Chính sách bảo mật này giải thích cách chúng tôi 
                thu thập, sử dụng, lưu trữ và bảo vệ thông tin cá nhân của bạn khi bạn 
                sử dụng dịch vụ của chúng tôi.
              </p>
              <p className="mb-0">
                Bằng việc sử dụng F-Job, bạn đồng ý với các điều khoản trong chính sách này.
              </p>
            </section>

            <section className="mb-5">
              <h2 className="h4 fw-bold mb-3">
                <i className="bi bi-2-circle-fill text-primary me-2"></i>
                Thông tin chúng tôi thu thập
              </h2>
              
              <h3 className="h6 fw-semibold mt-4 mb-3">2.1. Thông tin tài khoản</h3>
              <ul className="mb-3">
                <li>Họ và tên</li>
                <li>Địa chỉ email</li>
                <li>Số điện thoại</li>
                <li>Mật khẩu (được mã hóa)</li>
                <li>Địa chỉ (tỉnh/thành, quận/huyện)</li>
              </ul>

              <h3 className="h6 fw-semibold mt-4 mb-3">2.2. Thông tin hồ sơ (Candidate)</h3>
              <ul className="mb-3">
                <li>Ảnh đại diện</li>
                <li>CV/Hồ sơ xin việc (PDF/DOC)</li>
                <li>Kinh nghiệm làm việc</li>
                <li>Học vấn</li>
                <li>Kỹ năng và đánh giá</li>
                <li>Giới thiệu bản thân</li>
              </ul>

              <h3 className="h6 fw-semibold mt-4 mb-3">
                2.3. Thông tin xác thực danh tính (Tùy chọn)
                <Badge bg="warning" className="ms-2">Đặc biệt quan trọng</Badge>
              </h3>
              <p className="text-muted small mb-2">
                Khi bạn chọn xác thực danh tính, chúng tôi thu thập:
              </p>
              <ul className="mb-3">
                <li><strong>Từ CCCD/CMND:</strong> Họ tên, số CCCD/CMND, ngày sinh</li>
                <li className="text-danger">
                  <strong>KHÔNG lưu:</strong> Ảnh CCCD/CMND, địa chỉ chi tiết, dữ liệu QR gốc
                </li>
              </ul>
              <div className="alert alert-success mb-3">
                <i className="bi bi-shield-check me-2"></i>
                <strong>Bảo mật:</strong>
                <ul className="mb-0 mt-2">
                  <li>Số CCCD/CMND được mã hóa bằng AES-256-CBC</li>
                  <li>Ảnh CCCD được xử lý và xóa ngay lập tức</li>
                  <li>Chỉ hiển thị dạng ẩn một phần (001******890)</li>
                </ul>
              </div>

              <h3 className="h6 fw-semibold mt-4 mb-3">2.4. Thông tin doanh nghiệp (Employer)</h3>
              <ul className="mb-3">
                <li>Tên công ty</li>
                <li>Mô tả công ty</li>
                <li>Địa chỉ</li>
                <li>Website</li>
                <li>Logo công ty</li>
              </ul>

              <h3 className="h6 fw-semibold mt-4 mb-3">2.5. Thông tin tự động</h3>
              <ul className="mb-0">
                <li>Địa chỉ IP</li>
                <li>Loại trình duyệt</li>
                <li>Thiết bị sử dụng</li>
                <li>Thời gian truy cập</li>
                <li>Cookies và công nghệ tương tự</li>
              </ul>
            </section>

            <section className="mb-5">
              <h2 className="h4 fw-bold mb-3">
                <i className="bi bi-3-circle-fill text-primary me-2"></i>
                Mục đích sử dụng dữ liệu
              </h2>
              <p>Chúng tôi sử dụng thông tin của bạn để:</p>
              <ul>
                <li>Cung cấp và quản lý tài khoản của bạn</li>
                <li>Kết nối ứng viên với nhà tuyển dụng</li>
                <li>Xử lý ứng tuyển và tuyển dụng</li>
                <li>Gửi thông báo về việc làm phù hợp</li>
                <li>Xác thực danh tính (nếu bạn chọn)</li>
                <li>Ngăn chặn gian lận và lạm dụng</li>
                <li>Cải thiện dịch vụ của chúng tôi</li>
                <li>Tuân thủ nghĩa vụ pháp lý</li>
              </ul>
            </section>

            <section className="mb-5">
              <h2 className="h4 fw-bold mb-3">
                <i className="bi bi-4-circle-fill text-primary me-2"></i>
                Chia sẻ thông tin
              </h2>
              <p>Chúng tôi có thể chia sẻ thông tin của bạn với:</p>
              
              <h3 className="h6 fw-semibold mt-4 mb-3">4.1. Nhà tuyển dụng</h3>
              <p className="text-muted small mb-3">
                Khi bạn ứng tuyển, hồ sơ và CV của bạn sẽ được chia sẻ với nhà tuyển dụng đó.
              </p>

              <h3 className="h6 fw-semibold mt-4 mb-3">4.2. Đối tác dịch vụ</h3>
              <ul className="mb-3">
                <li>Dịch vụ lưu trữ đám mây (MongoDB Atlas, AWS S3)</li>
                <li>Dịch vụ email (SMTP)</li>
                <li>Dịch vụ phân tích (nếu có)</li>
              </ul>

              <h3 className="h6 fw-semibold mt-4 mb-3">4.3. Yêu cầu pháp lý</h3>
              <p className="text-muted small mb-0">
                Chúng tôi có thể tiết lộ thông tin khi được yêu cầu bởi cơ quan chức năng 
                hoặc để tuân thủ pháp luật.
              </p>

              <div className="alert alert-warning mt-3">
                <i className="bi bi-exclamation-triangle me-2"></i>
                <strong>Chúng tôi KHÔNG:</strong>
                <ul className="mb-0 mt-2">
                  <li>Bán thông tin cá nhân của bạn</li>
                  <li>Chia sẻ cho mục đích marketing bên thứ ba</li>
                  <li>Sử dụng dữ liệu CCCD/CMND cho mục đích khác</li>
                </ul>
              </div>
            </section>

            <section className="mb-5">
              <h2 className="h4 fw-bold mb-3">
                <i className="bi bi-5-circle-fill text-primary me-2"></i>
                Bảo mật dữ liệu
              </h2>
              <p>Chúng tôi áp dụng các biện pháp bảo mật nghiêm ngặt:</p>
              <ul>
                <li>
                  <strong>Mã hóa:</strong> SSL/TLS cho truyền tải, AES-256 cho lưu trữ
                </li>
                <li>
                  <strong>Xác thực:</strong> JWT tokens, OAuth 2.0
                </li>
                <li>
                  <strong>Bảo vệ mật khẩu:</strong> Bcrypt hashing với salt
                </li>
                <li>
                  <strong>Firewall:</strong> Bảo vệ máy chủ khỏi tấn công
                </li>
                <li>
                  <strong>Backup:</strong> Sao lưu dữ liệu định kỳ
                </li>
                <li>
                  <strong>Monitoring:</strong> Giám sát hoạt động bất thường
                </li>
              </ul>
            </section>

            <section className="mb-5">
              <h2 className="h4 fw-bold mb-3">
                <i className="bi bi-6-circle-fill text-primary me-2"></i>
                Quyền của bạn
              </h2>
              <p>Theo Nghị định 13/2023/NĐ-CP, bạn có các quyền sau:</p>
              
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="border rounded p-3 h-100">
                    <h6 className="fw-semibold">
                      <i className="bi bi-eye text-primary me-2"></i>
                      Quyền truy cập
                    </h6>
                    <p className="small text-muted mb-0">
                      Xem thông tin cá nhân chúng tôi đang lưu trữ về bạn
                    </p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="border rounded p-3 h-100">
                    <h6 className="fw-semibold">
                      <i className="bi bi-pencil text-primary me-2"></i>
                      Quyền chỉnh sửa
                    </h6>
                    <p className="small text-muted mb-0">
                      Cập nhật hoặc sửa đổi thông tin không chính xác
                    </p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="border rounded p-3 h-100">
                    <h6 className="fw-semibold">
                      <i className="bi bi-trash text-primary me-2"></i>
                      Quyền xóa
                    </h6>
                    <p className="small text-muted mb-0">
                      Yêu cầu xóa dữ liệu cá nhân (trừ khi pháp luật yêu cầu giữ lại)
                    </p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="border rounded p-3 h-100">
                    <h6 className="fw-semibold">
                      <i className="bi bi-download text-primary me-2"></i>
                      Quyền xuất dữ liệu
                    </h6>
                    <p className="small text-muted mb-0">
                      Nhận bản sao dữ liệu của bạn ở định dạng có thể đọc được
                    </p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="border rounded p-3 h-100">
                    <h6 className="fw-semibold">
                      <i className="bi bi-ban text-primary me-2"></i>
                      Quyền rút lại đồng ý
                    </h6>
                    <p className="small text-muted mb-0">
                      Thu hồi sự đồng ý xử lý dữ liệu bất kỳ lúc nào
                    </p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="border rounded p-3 h-100">
                    <h6 className="fw-semibold">
                      <i className="bi bi-file-text text-primary me-2"></i>
                      Quyền khiếu nại
                    </h6>
                    <p className="small text-muted mb-0">
                      Khiếu nại với cơ quan có thẩm quyền
                    </p>
                  </div>
                </div>
              </div>

              <div className="alert alert-info mt-4">
                <i className="bi bi-envelope me-2"></i>
                Để thực hiện các quyền trên, vui lòng liên hệ:{' '}
                <a href="mailto:privacy@f-job.vn">privacy@f-job.vn</a>
              </div>
            </section>

            <section className="mb-5">
              <h2 className="h4 fw-bold mb-3">
                <i className="bi bi-7-circle-fill text-primary me-2"></i>
                Lưu trữ và xóa dữ liệu
              </h2>
              
              <h3 className="h6 fw-semibold mt-4 mb-3">7.1. Thời gian lưu trữ</h3>
              <ul className="mb-3">
                <li><strong>Tài khoản hoạt động:</strong> Cho đến khi bạn xóa tài khoản</li>
                <li><strong>CV/Hồ sơ:</strong> 2 năm kể từ lần truy cập cuối</li>
                <li><strong>Thông tin xác thực:</strong> Cho đến khi bạn yêu cầu xóa</li>
                <li><strong>Ứng tuyển:</strong> 6 tháng sau khi hoàn tất</li>
                <li><strong>Logs hệ thống:</strong> 90 ngày</li>
              </ul>

              <h3 className="h6 fw-semibold mt-4 mb-3">7.2. Xóa tài khoản</h3>
              <p className="text-muted small mb-0">
                Khi bạn xóa tài khoản, chúng tôi sẽ:
              </p>
              <ul className="mb-0">
                <li>Xóa thông tin cá nhân trong vòng 30 ngày</li>
                <li>Ẩn danh hóa dữ liệu cần giữ lại vì lý do pháp lý</li>
                <li>Gửi email xác nhận khi hoàn tất</li>
              </ul>
            </section>

            <section className="mb-5">
              <h2 className="h4 fw-bold mb-3">
                <i className="bi bi-8-circle-fill text-primary me-2"></i>
                Cookies
              </h2>
              <p>Chúng tôi sử dụng cookies để:</p>
              <ul>
                <li>Duy trì phiên đăng nhập của bạn</li>
                <li>Ghi nhớ tùy chọn của bạn (theme, ngôn ngữ)</li>
                <li>Phân tích cách sử dụng dịch vụ</li>
              </ul>
              <p className="text-muted small mb-0">
                Bạn có thể quản lý cookies trong cài đặt trình duyệt.
              </p>
            </section>

            <section className="mb-5">
              <h2 className="h4 fw-bold mb-3">
                <i className="bi bi-9-circle-fill text-primary me-2"></i>
                Trẻ em
              </h2>
              <p className="mb-0">
                Dịch vụ của chúng tôi không dành cho người dưới 16 tuổi. 
                Chúng tôi không cố ý thu thập thông tin từ trẻ em. 
                Nếu bạn phát hiện chúng tôi đã thu thập thông tin từ trẻ em, 
                vui lòng liên hệ ngay để chúng tôi xóa.
              </p>
            </section>

            <section className="mb-5">
              <h2 className="h4 fw-bold mb-3">
                <i className="bi bi-arrow-repeat text-primary me-2"></i>
                Thay đổi chính sách
              </h2>
              <p className="mb-0">
                Chúng tôi có thể cập nhật chính sách này. Các thay đổi quan trọng 
                sẽ được thông báo qua email hoặc thông báo trên nền tảng. 
                Việc bạn tiếp tục sử dụng sau các thay đổi có nghĩa là bạn chấp nhận 
                chính sách mới.
              </p>
            </section>

            <section className="mb-0">
              <h2 className="h4 fw-bold mb-3">
                <i className="bi bi-telephone text-primary me-2"></i>
                Liên hệ
              </h2>
              <p className="mb-3">
                Nếu bạn có câu hỏi về chính sách này hoặc muốn thực hiện quyền của mình:
              </p>
              
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="border rounded p-3">
                    <h6 className="fw-semibold mb-2">
                      <i className="bi bi-envelope me-2 text-primary"></i>
                      Email
                    </h6>
                    <a href="mailto:privacy@f-job.vn" className="text-decoration-none">
                      privacy@f-job.vn
                    </a>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="border rounded p-3">
                    <h6 className="fw-semibold mb-2">
                      <i className="bi bi-chat-dots me-2 text-primary"></i>
                      Hỗ trợ
                    </h6>
                    <a href="mailto:support@f-job.vn" className="text-decoration-none">
                      support@f-job.vn
                    </a>
                  </div>
                </div>
              </div>

              <div className="alert alert-light border mt-4 mb-0">
                <h6 className="fw-semibold mb-2">Thông tin công ty</h6>
                <p className="small mb-1"><strong>F-Job Platform</strong></p>
                <p className="small mb-1">Địa chỉ: Đà Nẵng, Việt Nam</p>
                <p className="small mb-1">MST: [Số đăng ký kinh doanh]</p>
                <p className="small mb-0">
                  Đại diện: [Tên người đại diện pháp luật]
                </p>
              </div>
            </section>
          </Card.Body>
        </Card>

        <div className="text-center text-muted small">
          <p className="mb-2">
            <i className="bi bi-shield-check me-1"></i>
            Tuân thủ Nghị định 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân
          </p>
          <p className="mb-0">
            © {new Date().getFullYear()} F-Job. Bảo lưu mọi quyền.
          </p>
        </div>
      </Container>
    </div>
  );
}
