import { useEffect, useState } from 'react';
import { Alert, Button, Form, Modal } from 'react-bootstrap';
import toast from 'react-hot-toast';
import reportService from '@services/reportService';
import { useVerificationCheck } from '@hooks/useVerificationCheck';
import { getErrorMessage } from '@utils/format';
import type { ReportReason, ReportTargetType } from '@/types/api';

const DESCRIPTION_MAX = 1000;

/**
 * The 7 backend `ReportReason` values with Vietnamese labels for the dropdown.
 * Kept in declaration order so the <select> presents a stable list.
 */
const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'SCAM', label: 'Lừa đảo' },
  { value: 'FAKE_JOB', label: 'Tin tuyển dụng giả' },
  { value: 'ABUSE', label: 'Lạm dụng/Quấy rối' },
  { value: 'HARASSMENT', label: 'Quấy rối' },
  { value: 'INAPPROPRIATE', label: 'Nội dung không phù hợp' },
  { value: 'SPAM', label: 'Spam' },
  { value: 'OTHER', label: 'Khác' },
];

/**
 * Friendly Vietnamese copy for the report-specific backend error codes.
 * The backend returns errors as `{ errorCode, message }`; we surface a clear
 * message for the codes the report flow can hit and otherwise fall back to the
 * raw server message (via getErrorMessage).
 */
const REPORT_ERROR_COPY: Record<string, string> = {
  ERR_5003: 'Bạn không thể tự báo cáo chính mình.',
  ERR_4002: 'Bạn đã báo cáo đối tượng này và đang chờ xử lý.',
  ERR_4001: 'Không tìm thấy đối tượng báo cáo.',
  ERR_2003: 'Tài khoản của bạn đang bị khóa.',
};

/** Pull the backend errorCode → friendly message, else the raw server message. */
function resolveReportError(error: unknown): string {
  const errorCode = (
    error as { response?: { data?: { errorCode?: string } } }
  ).response?.data?.errorCode;
  if (errorCode && REPORT_ERROR_COPY[errorCode]) {
    return REPORT_ERROR_COPY[errorCode];
  }
  return getErrorMessage(error, 'Không thể gửi báo cáo. Vui lòng thử lại.');
}

interface ReportModalProps {
  show: boolean;
  /** What is being reported — a JOB posting or a USER account. */
  targetType: ReportTargetType;
  /** The id of the target Job (JOB) or target User (USER). */
  targetId: string;
  /** Optional human label for the target, shown in the modal title. */
  targetLabel?: string;
  onClose: () => void;
  /** Called after a report is successfully created. */
  onSubmitted?: () => void;
}

/**
 * Report submission form (Req 10).
 *
 * A required `ReportReason` dropdown plus an optional description (≤1000 chars
 * with a live counter). Posts to POST /reports. The caller is responsible for
 * NEVER rendering a USER-target report control when the target user id equals
 * the current authenticated user's id (Req 10.8 surfaced in the UI); the
 * backend is the authoritative backstop and rejects self-reports with ERR_5003.
 */
export default function ReportModal({
  show,
  targetType,
  targetId,
  targetLabel,
  onClose,
  onSubmitted,
}: ReportModalProps) {
  const { requireVerification } = useVerificationCheck();
  const [reason, setReason] = useState<ReportReason | ''>('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Reset the form each time the modal is (re)opened.
  useEffect(() => {
    if (show) {
      setReason('');
      setDescription('');
      setError('');
      setSubmitting(false);
    }
  }, [show]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;
    
    // Check verification before allowing report submission
    if (!requireVerification('gửi báo cáo')) {
      return;
    }
    
    setSubmitting(true);
    setError('');
    try {
      const trimmed = description.trim();
      await reportService.create({
        targetType,
        targetId,
        reason,
        ...(trimmed ? { description: trimmed } : {}),
      });
      toast.success('Đã gửi báo cáo. Cảm ơn bạn!');
      onSubmitted?.();
      onClose();
    } catch (err) {
      setError(resolveReportError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title className="h6">
            {targetType === 'JOB' ? 'Báo cáo tin tuyển dụng' : 'Báo cáo người dùng'}
            {targetLabel ? `: ${targetLabel}` : ''}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <Form.Group className="mb-3">
            <Form.Label>
              Lý do báo cáo <span className="text-danger">*</span>
            </Form.Label>
            <Form.Select
              value={reason}
              onChange={(e) => setReason(e.target.value as ReportReason)}
              required
              aria-label="Chọn lý do báo cáo"
            >
              <option value="" disabled>
                -- Chọn lý do --
              </option>
              {REPORT_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group>
            <Form.Label>Mô tả chi tiết (không bắt buộc)</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              maxLength={DESCRIPTION_MAX}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả cụ thể vấn đề bạn gặp phải..."
            />
            <Form.Text className="text-muted d-block text-end">
              {description.length}/{DESCRIPTION_MAX}
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Hủy
          </Button>
          <Button type="submit" variant="danger" disabled={submitting || !reason}>
            {submitting ? 'Đang gửi...' : 'Gửi báo cáo'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
