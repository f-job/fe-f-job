import { useState } from 'react';
import { Container, Card, Alert, Button, Spinner } from 'react-bootstrap';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CCCDScanner } from '@components/common/CCCDScanner';
import { CCCDData } from '@utils/cccdParser';
import api from '@services/api';
import toast from 'react-hot-toast';

type Step = 'consent' | 'scan' | 'confirm' | 'success';

/**
 * Post-Registration Identity Verification Page
 * 
 * This page is shown immediately after user registration.
 * User MUST complete identity verification before they can login.
 * 
 * Requirements:
 * - User just registered (email in query params)
 * - Scan CCCD to verify identity
 * - 1 CCCD = 1 account (backend validates)
 * - After success, redirect to login
 */
export default function PostRegisterVerificationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');

  const [step, setStep] = useState<Step>('consent');
  const [scannedData, setScannedData] = useState<CCCDData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // If no email, redirect to register
  if (!email) {
    setTimeout(() => {
      window.location.href = '/dang-ky';
    }, 0);
    return <div>Redirecting...</div>;
  }

  const handleScanSuccess = (data: CCCDData) => {
    console.log('Scan successful:', data);
    setScannedData(data);
    setStep('confirm');
  };

  const handleSubmit = async () => {
    if (!scannedData) return;

    setSubmitting(true);
    setError('');

    try {
      // Call public verification endpoint
      await api.post('/verification/public/verify-with-email', {
        email,
        fullName: scannedData.fullName,
        idNumber: scannedData.idNumber,
        dateOfBirth: scannedData.dateOfBirth,
        verificationMethod: 'cccd_qr',
        consentGiven: true,
      });

      setStep('success');
      toast.success('Xác thực thành công! Bạn có thể đăng nhập ngay.');
    } catch (err: any) {
      console.error('Verification error:', err);
      
      let errorMsg = 'Xác thực thất bại';
      
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      // Check for specific error types
      if (errorMsg.includes('đã được sử dụng')) {
        errorMsg = 'Số CCCD này đã được đăng ký cho tài khoản khác. Mỗi CCCD chỉ có thể đăng ký 1 tài khoản duy nhất.';
      } else if (errorMsg.includes('không tồn tại') || errorMsg.includes('not found')) {
        errorMsg = `Không tìm thấy tài khoản với email: ${email}. Vui lòng đăng ký lại hoặc kiểm tra email đã nhập.`;
        // Add button to go back to registration
        setTimeout(() => {
          if (window.confirm('Bạn có muốn quay lại trang đăng ký không?')) {
            navigate('/dang-ky');
          }
        }, 2000);
      } else if (errorMsg.includes('đã được xác thực')) {
        errorMsg = 'Tài khoản này đã được xác thực. Bạn có thể đăng nhập ngay.';
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/dang-nhap');
        }, 2000);
      }
      
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-light min-vh-100 d-flex align-items-center py-5">
      <Container style={{ maxWidth: 700 }}>
        {/* Header */}
        <div className="text-center mb-4">
          <h2 className="fw-bold mb-2">
            <i className="bi bi-shield-check text-primary me-2" />
            Xác thực danh tính
          </h2>
          <p className="text-muted">
            Vui lòng xác thực danh tính để hoàn tất đăng ký
          </p>
        </div>

        {/* Email Info */}
        <Alert variant="info" className="mb-4">
          <div className="d-flex align-items-center">
            <i className="bi bi-envelope-check fs-4 me-3" />
            <div>
              <strong>Tài khoản:</strong> {email}
              <div className="small text-muted mt-1">
                Bạn cần xác thực CCCD trước khi có thể đăng nhập
              </div>
            </div>
          </div>
        </Alert>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')} className="mb-4">
            <i className="bi bi-exclamation-triangle me-2" />
            {error}
            {error.includes('Không tìm thấy tài khoản') && (
              <div className="mt-2">
                <Button 
                  variant="outline-danger" 
                  size="sm"
                  onClick={() => navigate('/dang-ky')}
                >
                  <i className="bi bi-arrow-left me-2" />
                  Quay lại đăng ký
                </Button>
              </div>
            )}
          </Alert>
        )}

        <Card className="border-0 shadow-sm">
          <Card.Body className="p-4">
            {/* Step 1: Consent */}
            {step === 'consent' && (
              <div>
                <h5 className="fw-bold mb-3">Tại sao cần xác thực CCCD?</h5>
                
                <div className="mb-4">
                  <p className="mb-3">
                    Để đảm bảo an toàn cho cộng đồng F-Job, chúng tôi yêu cầu xác thực 
                    danh tính bằng CCCD/CMND ngay khi đăng ký.
                  </p>

                  <div className="p-3 bg-light rounded mb-3">
                    <h6 className="fw-semibold mb-2">
                      <i className="bi bi-check-circle-fill text-success me-2" />
                      Lợi ích:
                    </h6>
                    <ul className="mb-0 small">
                      <li>Bảo vệ bạn khỏi các tài khoản giả mạo</li>
                      <li>Tăng độ tin cậy với nhà tuyển dụng</li>
                      <li>Đảm bảo 1 người chỉ có 1 tài khoản</li>
                      <li>Ngăn chặn lạm dụng hệ thống</li>
                    </ul>
                  </div>

                  <div className="p-3 border border-primary rounded mb-3">
                    <h6 className="fw-semibold mb-2 text-primary">
                      <i className="bi bi-shield-lock me-2" />
                      Cam kết bảo mật:
                    </h6>
                    <ul className="mb-0 small">
                      <li><strong>KHÔNG</strong> lưu trữ ảnh CCCD của bạn</li>
                      <li>Mã hóa số CCCD trước khi lưu (AES-256)</li>
                      <li>Chỉ lưu thông tin tối thiểu để xác thực</li>
                      <li>Tuân thủ Nghị định 13/2023/NĐ-CP</li>
                    </ul>
                  </div>

                  <Alert variant="warning" className="mb-3">
                    <i className="bi bi-info-circle me-2" />
                    <strong>Lưu ý:</strong> Mỗi CCCD chỉ có thể đăng ký 1 tài khoản duy nhất.
                  </Alert>
                </div>

                <div className="d-flex justify-content-between gap-2">
                  <Button
                    variant="outline-secondary"
                    onClick={() => navigate('/dang-ky')}
                  >
                    <i className="bi bi-arrow-left me-2" />
                    Quay lại
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => setStep('scan')}
                    className="btn-primary-gradient"
                  >
                    Bắt đầu xác thực
                    <i className="bi bi-arrow-right ms-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Scan */}
            {step === 'scan' && (
              <CCCDScanner
                onScanSuccess={handleScanSuccess}
                onCancel={() => setStep('consent')}
              />
            )}

            {/* Step 3: Confirm */}
            {step === 'confirm' && scannedData && (
              <div>
                <Alert variant="success" className="mb-4">
                  <i className="bi bi-check-circle-fill me-2" />
                  Quét mã QR thành công! Vui lòng xác nhận thông tin.
                </Alert>

                <div className="p-3 border rounded mb-3">
                  <h6 className="fw-bold mb-3">Thông tin từ CCCD:</h6>
                  
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label small text-muted mb-1">Họ và tên</label>
                      <div className="fw-semibold">{scannedData.fullName}</div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small text-muted mb-1">Số CCCD/CMND</label>
                      <div className="fw-semibold">{scannedData.idNumber}</div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small text-muted mb-1">Ngày sinh</label>
                      <div className="fw-semibold">
                        {new Date(scannedData.dateOfBirth).toLocaleDateString('vi-VN')}
                      </div>
                    </div>

                    {scannedData.gender && (
                      <div className="col-md-6">
                        <label className="form-label small text-muted mb-1">Giới tính</label>
                        <div className="fw-semibold">{scannedData.gender}</div>
                      </div>
                    )}
                  </div>
                </div>

                <Alert variant="info" className="mb-4">
                  <small>
                    <i className="bi bi-shield-lock me-1" />
                    Thông tin sẽ được mã hóa trước khi lưu trữ. Ảnh CCCD không được lưu lại.
                  </small>
                </Alert>

                <div className="d-flex justify-content-between gap-2">
                  <Button
                    variant="outline-secondary"
                    onClick={() => setStep('scan')}
                    disabled={submitting}
                  >
                    Quét lại
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="btn-primary-gradient"
                  >
                    {submitting ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Đang xác thực...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-2" />
                        Xác nhận và hoàn tất
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Success */}
            {step === 'success' && (
              <div className="text-center py-4">
                <div className="mb-4">
                  <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '4rem' }} />
                </div>
                
                <h4 className="fw-bold mb-2">Xác thực thành công!</h4>
                <p className="text-muted mb-4">
                  Tài khoản của bạn đã được xác thực. Bạn có thể đăng nhập ngay bây giờ.
                </p>

                <div className="d-grid gap-2">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => navigate('/dang-nhap')}
                    className="btn-primary-gradient"
                  >
                    <i className="bi bi-box-arrow-in-right me-2" />
                    Đăng nhập ngay
                  </Button>
                </div>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Help Section */}
        {step !== 'success' && (
          <div className="text-center mt-4">
            <small className="text-muted">
              Cần hỗ trợ?{' '}
              <a href="mailto:support@f-job.vn" className="text-decoration-none">
                Liên hệ support@f-job.vn
              </a>
            </small>
          </div>
        )}
      </Container>
    </div>
  );
}
