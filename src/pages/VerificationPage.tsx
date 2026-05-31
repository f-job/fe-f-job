import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Form,
  Spinner,
} from 'react-bootstrap';
import toast from 'react-hot-toast';
import verificationService from '@services/verificationService';
import type {
  IdentityDocumentPayload,
  SubmitVerificationPayload,
  VerificationStatus,
  VerificationView,
} from '@/types/api';
import { formatDateTime, getErrorMessage } from '@utils/format';

// ─────────────────────────────────────────────────────────────────────────────
// Candidate Identity Verification page (Capability 3 — candidate surface).
//
//   GET  /verification/me      → current status + submitted documents
//   POST /verification/submit  → submit 1–5 identity documents for review
//
// Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.8 (candidate surface).
//
// FILE-UPLOAD APPROACH (important):
//   The backend `POST /verification/submit` endpoint does NOT accept multipart
//   binary — it accepts an array of document METADATA objects
//   ({ fileUrl, fileName, mimeType, fileSize }) that point at ALREADY-UPLOADED
//   files. This project currently has NO general-purpose upload endpoint that
//   returns a persistent URL: `profileService.uploadCv` (POST /profiles/files)
//   only accepts PDF/DOC and returns a `MyProfile` (not a URL), and
//   `profileService.uploadAvatar` overwrites a single avatar image and also
//   returns a `MyProfile`. Neither is reusable for identity documents
//   (JPEG/PNG/PDF, 1–5 files).
//
//   Therefore we collect the REAL metadata (fileName / mimeType / fileSize) from
//   each selected `File` and use a client-side object URL as a placeholder for
//   `fileUrl`. The object URL is only valid in the current browser session, so an
//   admin cannot open it later — that is an infrastructure gap, not part of this
//   task's scope.
//
//   TODO(trust-and-safety): once a real upload endpoint exists (returning a
//   persistent URL), upload each file first and submit the returned URLs here
//   instead of the object-URL placeholder.
// ─────────────────────────────────────────────────────────────────────────────

/** Allowed identity-document MIME types (Req 7.2) — mirrors the backend set. */
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

/** Maximum identity-document size in bytes — 10 MB (Req 7.2). */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Submission count bounds (Req 7.1, 7.2). */
const MIN_DOCS = 1;
const MAX_DOCS = 5;

const STATUS_VARIANT: Record<VerificationStatus, string> = {
  UNVERIFIED: 'secondary',
  PENDING_REVIEW: 'warning',
  VERIFIED: 'success',
  REJECTED: 'danger',
};

const STATUS_LABEL: Record<VerificationStatus, string> = {
  UNVERIFIED: 'Chưa xác minh',
  PENDING_REVIEW: 'Đang chờ duyệt',
  VERIFIED: 'Đã xác minh',
  REJECTED: 'Bị từ chối',
};

/** Human-readable file size (KB / MB) for the selected-file list. */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Validate the selected files against the same rules the backend enforces
 * (Req 7.2/7.3): 1–5 files, each JPEG/PNG/PDF and ≤ 10 MB. Returns a list of
 * ERR-style messages (empty when the selection is valid).
 */
function validateFiles(files: File[]): string[] {
  const errors: string[] = [];

  if (files.length < MIN_DOCS) {
    errors.push('Vui lòng chọn ít nhất 1 tài liệu.');
  }
  if (files.length > MAX_DOCS) {
    errors.push(`Chỉ được tải lên tối đa ${MAX_DOCS} tài liệu mỗi lần.`);
  }

  files.forEach((file) => {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      errors.push(`"${file.name}": định dạng không hợp lệ (chỉ chấp nhận JPEG, PNG, PDF).`);
    }
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`"${file.name}": dung lượng vượt quá 10 MB.`);
    }
    if (file.size <= 0) {
      errors.push(`"${file.name}": tệp rỗng không hợp lệ.`);
    }
  });

  return errors;
}

export default function VerificationPage() {
  const [view, setView] = useState<VerificationView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [files, setFiles] = useState<File[]>([]);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await verificationService.getMine();
      setView(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Không thể tải trạng thái xác minh'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const status = view?.verificationStatus;

  // Submission is allowed only from UNVERIFIED or REJECTED (Req 7.1, 7.4, 7.5, 7.8).
  const canSubmit = status === 'UNVERIFIED' || status === 'REJECTED';

  const lockedMessage = useMemo(() => {
    if (status === 'PENDING_REVIEW') {
      return 'Hồ sơ của bạn đang chờ quản trị viên duyệt. Bạn không thể nộp thêm tài liệu cho đến khi có kết quả.';
    }
    if (status === 'VERIFIED') {
      return 'Tài khoản của bạn đã được xác minh. Không cần nộp thêm tài liệu.';
    }
    return '';
  }, [status]);

  const handleSelectFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    setFiles(picked);
    setFileErrors(picked.length > 0 ? validateFiles(picked) : []);
  };

  const handleClearFiles = () => {
    setFiles([]);
    setFileErrors([]);
    if (fileInput.current) fileInput.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateFiles(files);
    if (errors.length > 0) {
      setFileErrors(errors);
      return;
    }

    // Build the metadata payload from the selected files. `fileUrl` is a
    // client-side object URL placeholder — see the file-upload note at the top.
    const payload: SubmitVerificationPayload = {
      documents: files.map<IdentityDocumentPayload>((file) => ({
        fileUrl: URL.createObjectURL(file),
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
      })),
    };

    setSubmitting(true);
    try {
      const { data } = await verificationService.submit(payload);
      setView(data);
      handleClearFiles();
      toast.success('Đã nộp tài liệu xác minh. Vui lòng chờ quản trị viên duyệt.');
      // Reload to reflect the authoritative server state (Req 7.1).
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Nộp tài liệu xác minh thất bại'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner />
        <p className="text-muted mt-3">Đang tải trạng thái xác minh...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  const documents = view?.identityDocuments ?? [];

  return (
    <Container className="py-4" style={{ maxWidth: 760 }}>
      <h4 className="fw-bold mb-1">Xác minh danh tính</h4>
      <p className="text-muted">
        Tải lên CCCD hoặc thẻ sinh viên để nhận huy hiệu đã xác minh và mở khóa nhiều cơ hội tốt hơn.
      </p>

      {/* ─── Current status ─── */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="fw-bold mb-0">Trạng thái hiện tại</h6>
            {status && (
              <Badge bg={STATUS_VARIANT[status]} className="px-3 py-2">
                {STATUS_LABEL[status]}
              </Badge>
            )}
          </div>

          <div className="text-muted small">
            {view?.verificationSubmittedAt && (
              <div>Đã nộp lúc: {formatDateTime(view.verificationSubmittedAt)}</div>
            )}
            {view?.verifiedAt && (
              <div>Được xác minh lúc: {formatDateTime(view.verifiedAt)}</div>
            )}
          </div>

          {/* Rejection reason (Req — show when REJECTED). */}
          {status === 'REJECTED' && view?.verificationRejectedReason && (
            <Alert variant="danger" className="mt-3 mb-0">
              <strong>Lý do từ chối:</strong> {view.verificationRejectedReason}
            </Alert>
          )}

          {/* Locked states: PENDING_REVIEW / VERIFIED. */}
          {lockedMessage && (
            <Alert
              variant={status === 'VERIFIED' ? 'success' : 'info'}
              className="mt-3 mb-0"
            >
              {lockedMessage}
            </Alert>
          )}
        </Card.Body>
      </Card>

      {/* ─── Submitted documents ─── */}
      {documents.length > 0 && (
        <Card className="border-0 shadow-sm mb-4">
          <Card.Body>
            <h6 className="fw-bold mb-3">Tài liệu đã nộp</h6>
            {documents.map((doc, idx) => (
              <div
                key={doc.id ?? doc._id ?? `${doc.fileName}-${idx}`}
                className="d-flex align-items-center justify-content-between border rounded p-2 mb-2"
              >
                <div className="text-truncate">
                  <i className="bi bi-file-earmark-text me-2 text-primary"></i>
                  <span className="small">{doc.fileName}</span>
                </div>
                <span className="text-muted small">{formatFileSize(doc.fileSize)}</span>
              </div>
            ))}
          </Card.Body>
        </Card>
      )}

      {/* ─── Upload form ─── */}
      <Card className="border-0 shadow-sm">
        <Card.Body>
          <h6 className="fw-bold mb-3">Nộp tài liệu xác minh</h6>

          {!canSubmit ? (
            <p className="text-muted small mb-0">
              {lockedMessage || 'Hiện không thể nộp tài liệu xác minh.'}
            </p>
          ) : (
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Chọn tài liệu (1–5 tệp)</Form.Label>
                <Form.Control
                  ref={fileInput}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf"
                  onChange={handleSelectFiles}
                  disabled={submitting}
                />
                <Form.Text className="text-muted">
                  Chấp nhận JPEG, PNG hoặc PDF, mỗi tệp tối đa 10 MB. Tối đa {MAX_DOCS} tệp.
                </Form.Text>
              </Form.Group>

              {/* Selected files preview */}
              {files.length > 0 && (
                <div className="mb-3">
                  {files.map((file, idx) => (
                    <div
                      key={`${file.name}-${idx}`}
                      className="d-flex align-items-center justify-content-between border rounded p-2 mb-2"
                    >
                      <div className="text-truncate">
                        <i className="bi bi-paperclip me-2 text-secondary"></i>
                        <span className="small">{file.name}</span>
                      </div>
                      <span className="text-muted small">{formatFileSize(file.size)}</span>
                    </div>
                  ))}
                  <Button
                    size="sm"
                    variant="link"
                    className="p-0 text-danger"
                    onClick={handleClearFiles}
                    disabled={submitting}
                  >
                    Xóa lựa chọn
                  </Button>
                </div>
              )}

              {/* Client-side validation errors (ERR-style messages). */}
              {fileErrors.length > 0 && (
                <Alert variant="danger" className="py-2">
                  <ul className="mb-0 ps-3">
                    {fileErrors.map((msg, idx) => (
                      <li key={idx} className="small">{msg}</li>
                    ))}
                  </ul>
                </Alert>
              )}

              <div className="text-end">
                <Button
                  type="submit"
                  className="btn-primary-gradient"
                  disabled={submitting || files.length === 0 || fileErrors.length > 0}
                >
                  {submitting ? 'Đang nộp...' : 'Nộp để xác minh'}
                </Button>
              </div>
            </Form>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}
