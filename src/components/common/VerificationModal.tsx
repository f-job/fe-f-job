import { useState } from 'react';
import { Alert, Badge, Button, Form, Modal } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { CCCDScanner } from './CCCDScanner';
import verificationService from '@services/verificationService';
import { CCCDData } from '@utils/cccdParser';

interface VerificationModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess?: () => void;
}

type Step = 'consent' | 'scan' | 'confirm' | 'success';

export function VerificationModal({ show, onHide, onSuccess }: VerificationModalProps) {
  const [step, setStep] = useState<Step>('consent');
  const [consentGiven, setConsentGiven] = useState(false);
  const [scannedData, setScannedData] = useState<CCCDData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    setStep('consent');
    setConsentGiven(false);
    setScannedData(null);
    setError('');
    onHide();
  };

  const handleScanSuccess = (data: CCCDData) => {
    console.log('Scan successful:', data);
    setScannedData(data);
    setStep('confirm');
  };

  const handleConfirmAndSubmit = async () => {
    if (!scannedData) return;

    setSubmitting(true);
    setError('');

    try {
      await verificationService.verifyIdentity({
        fullName: scannedData.fullName,
        idNumber: scannedData.idNumber,
        dateOfBirth: scannedData.dateOfBirth,
        verificationMethod: 'cccd_qr',
        consentGiven: true,
      });

      setStep('success');
      toast.success('Xác thực danh tính thành công!');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      
      let errorMsg = 'Xác thực thất bại';
      
      // Handle specific error cases
      if (err.response?.status === 401) {
        errorMsg = 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
        // Optionally redirect to login
        setTimeout(() => {
          window.location.href = '/dang-nhap';
        }, 2000);
      } else if (err.response?.status === 404 || err.response?.data?.message?.includes('User not found')) {
        errorMsg = 'Không tìm thấy tài khoản. Vui lòng đăng nhập lại.';
        // Show debug info
        console.error('User not found error. Token:', localStorage.getItem('accessToken')?.substring(0, 20));
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-shield-check me-2 text-primary" />
          Xác thực danh tính
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            <div className="d-flex align-items-start justify-content-between">
              <div className="flex-grow-1">
                <strong>Lỗi:</strong> {error}
                {error.includes('User not found') || error.includes('Không tìm thấy tài khoản') && (
                  <div className="mt-2 small">
                    <a 
                      href="/debug-verification" 
                      target="_blank" 
                      className="text-decoration-none"
                    >
                      <i className="bi bi-bug me-1" />
                      Debug auth info →
                    </a>
                  </div>
                )}
              </div>
            </div>
          </Alert>
        )}

        {/* Step 1: Consent */}
        {step === 'consent' && (
          <div>
            <h5 className="fw-bold mb-3">Điều khoản xác thực danh tính</h5>
            
            <div className="mb-4">
              <p className="mb-3">
                Để tăng độ tin cậy và bảo vệ cộng đồng F-Job, chúng tôi cần xác thực 
                danh tính của bạn thông qua CCCD/CMND.
              </p>

              <div className="p-3 bg-light rounded mb-3">
                <h6 className="fw-semibold mb-2">
                  <i className="bi bi-check-circle-fill text-success me-2" />
                  F-Job cam kết:
                </h6>
                <ul className="mb-0 small">
                  <li>Chỉ sử dụng thông tin để xác thực danh tính</li>
                  <li>Không lưu trữ ảnh CCCD/CMND của bạn</li>
                  <li>Mã hóa thông tin nhạy cảm trước khi lưu</li>
                  <li>Không chia sẻ thông tin cho bên thứ ba</li>
                  <li>Tuân thủ Nghị định 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân</li>
                </ul>
              </div>

              <div className="p-3 border rounded mb-3">
                <h6 className="fw-semibold mb-2">
                  <i className="bi bi-info-circle text-primary me-2" />
                  Quy trình xác thực:
                </h6>
                <ol className="mb-0 small">
                  <li>Quét mã QR trên CCCD (mặt sau)</li>
                  <li>Xác nhận thông tin được trích xuất</li>
                  <li>Hệ thống xử lý và xóa ảnh ngay lập tức</li>
                  <li>Tài khoản của bạn được đánh dấu "Đã xác thực"</li>
                </ol>
              </div>
            </div>

            <Form.Check
              type="checkbox"
              id="consent-checkbox"
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              label={
                <span>
                  Tôi đã đọc và đồng ý với{' '}
                  <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">
                    Chính sách bảo mật
                  </a>{' '}
                  và cho phép F-Job xử lý thông tin CCCD của tôi
                </span>
              }
              className="mb-3"
            />

            <div className="d-flex justify-content-end gap-2">
              <Button variant="outline-secondary" onClick={handleClose}>
                Hủy
              </Button>
              <Button
                variant="primary"
                disabled={!consentGiven}
                onClick={() => setStep('scan')}
                className="btn-primary-gradient"
              >
                Tiếp tục
                <i className="bi bi-arrow-right ms-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Scan QR */}
        {step === 'scan' && (
          <CCCDScanner
            onScanSuccess={handleScanSuccess}
            onCancel={() => setStep('consent')}
          />
        )}

        {/* Step 3: Confirm Data */}
        {step === 'confirm' && scannedData && (
          <div>
            <Alert variant="success">
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

                {scannedData.oldIdNumber && (
                  <div className="col-md-6">
                    <label className="form-label small text-muted mb-1">Số CMND cũ</label>
                    <div className="fw-semibold">{scannedData.oldIdNumber}</div>
                  </div>
                )}
              </div>
            </div>

            <Alert variant="info" className="mb-3">
              <small>
                <i className="bi bi-shield-lock me-1" />
                Thông tin sẽ được mã hóa trước khi lưu trữ. Ảnh CCCD không được lưu lại.
              </small>
            </Alert>

            <div className="d-flex justify-content-end gap-2">
              <Button
                variant="outline-secondary"
                onClick={() => setStep('scan')}
                disabled={submitting}
              >
                Quét lại
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmAndSubmit}
                disabled={submitting}
                className="btn-primary-gradient"
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Đang xác thực...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-2" />
                    Xác nhận
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
              Tài khoản của bạn đã được xác thực danh tính.
            </p>

            <Badge bg="success" className="mb-4 p-2">
              <i className="bi bi-shield-check me-1" />
              Danh tính đã xác thực
            </Badge>

            <div className="d-grid">
              <Button
                variant="primary"
                onClick={handleClose}
                className="btn-primary-gradient"
              >
                Hoàn tất
              </Button>
            </div>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
}
