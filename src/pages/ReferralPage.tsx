import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  InputGroup,
  Modal,
  Row,
  Spinner,
  Table,
} from 'react-bootstrap';
import toast from 'react-hot-toast';
import referralService from '@services/referralService';
import payoutService, { MIN_PAYOUT_AMOUNT } from '@services/payoutService';
import { useAuthStore } from '@stores/authStore';
import type {
  Payout,
  PayoutEligibility,
  PayoutSettings,
  ReferralHistoryItem,
  ReferralInfo,
} from '@/types/api';
import {
  formatDateTime,
  formatVnd,
  getEntityId,
  getErrorMessage,
  payoutStatusLabel,
  payoutStatusVariant,
} from '@utils/format';

function refereeName(item: ReferralHistoryItem): string {
  if (typeof item.refereeId === 'object' && item.refereeId) {
    return item.refereeId.fullName || item.refereeId.email || 'Người dùng';
  }
  return 'Người dùng';
}

export default function ReferralPage() {
  const { user } = useAuthStore();
  const isCandidate = user?.role === 'CANDIDATE';

  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<ReferralHistoryItem[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [settings, setSettings] = useState<PayoutSettings | null>(null);
  const [eligibility, setEligibility] = useState<PayoutEligibility | null>(null);
  const [loading, setLoading] = useState(true);

  // apply code form
  const [code, setCode] = useState('');
  const [applying, setApplying] = useState(false);

  // bank settings modal
  const [showSettings, setShowSettings] = useState(false);
  const [bankForm, setBankForm] = useState<Omit<PayoutSettings, '_id' | 'id' | 'userId' | 'updatedAt'>>({
    bankName: '',
    accountNumber: '',
    accountHolderName: '',
  });

  // payout request modal
  const [showPayout, setShowPayout] = useState(false);
  const [amount, setAmount] = useState(MIN_PAYOUT_AMOUNT);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [infoRes, balRes, histRes, payRes, setRes] = await Promise.allSettled([
        referralService.getMine(),
        referralService.balance(),
        referralService.history(1, 10),
        payoutService.list(1, 10),
        payoutService.getSettings(),
      ]);
      if (infoRes.status === 'fulfilled') setInfo(infoRes.value.data);
      if (balRes.status === 'fulfilled') setBalance(balRes.value.data.referralBalance);
      if (histRes.status === 'fulfilled') setHistory(histRes.value.data.data);
      if (payRes.status === 'fulfilled') setPayouts(payRes.value.data.data);
      if (setRes.status === 'fulfilled' && setRes.value.data) {
        setSettings(setRes.value.data);
        setBankForm({
          bankName: setRes.value.data.bankName,
          accountNumber: setRes.value.data.accountNumber,
          accountHolderName: setRes.value.data.accountHolderName,
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleCopy = () => {
    if (!info) return;
    navigator.clipboard.writeText(info.inviteUrl);
    toast.success('Đã sao chép link mời');
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setApplying(true);
    try {
      const { data } = await referralService.apply(code.trim().toUpperCase());
      toast.success(`${data.message} (+${formatVnd(data.rewardAmount)})`);
      setCode('');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể áp dụng mã'));
    } finally {
      setApplying(false);
    }
  };

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await payoutService.updateSettings(bankForm);
      setSettings(data);
      setShowSettings(false);
      toast.success('Đã lưu tài khoản ngân hàng');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Lưu thất bại'));
    }
  };

  const openPayoutModal = async () => {
    try {
      const { data } = await payoutService.validate();
      setEligibility(data);
    } catch {
      setEligibility(null);
    }
    setAmount(Math.max(MIN_PAYOUT_AMOUNT, Math.min(balance, MIN_PAYOUT_AMOUNT)));
    setShowPayout(true);
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await payoutService.request(amount);
      toast.success('Đã gửi yêu cầu rút tiền');
      setShowPayout(false);
      await loadAll();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Yêu cầu rút tiền thất bại'));
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner />
        <p className="text-muted mt-3">Đang tải...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h1 className="h3 fw-bold mb-1">Giới thiệu &amp; Thưởng</h1>
      <p className="text-muted">Mời bạn bè tham gia F-Job và nhận thưởng vào ví của bạn.</p>

      <Row className="g-4 mb-4">
        {/* Balance + invite */}
        <Col md={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="text-muted small">Số dư ví thưởng</div>
              <div className="display-6 fw-bold text-success">{formatVnd(balance)}</div>
              <div className="d-flex gap-2 mt-3">
                <Button variant="outline-secondary" size="sm" onClick={() => setShowSettings(true)}>
                  <i className="bi bi-bank me-1"></i>
                  {settings ? 'Sửa tài khoản NH' : 'Thêm tài khoản NH'}
                </Button>
                <Button
                  className="btn-primary-gradient"
                  size="sm"
                  onClick={openPayoutModal}
                  disabled={balance < MIN_PAYOUT_AMOUNT}
                >
                  <i className="bi bi-cash-coin me-1"></i>Rút tiền
                </Button>
              </div>
              {balance < MIN_PAYOUT_AMOUNT && (
                <div className="text-muted small mt-2">
                  Cần tối thiểu {formatVnd(MIN_PAYOUT_AMOUNT)} để rút.
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Referral code */}
        <Col md={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="text-muted small">Mã giới thiệu của bạn</div>
              <div className="h4 fw-bold">{info?.referralCode ?? '—'}</div>
              <InputGroup size="sm" className="mt-2">
                <Form.Control readOnly value={info?.inviteUrl ?? ''} />
                <Button variant="outline-primary" onClick={handleCopy}>
                  <i className="bi bi-clipboard"></i>
                </Button>
              </InputGroup>
              <div className="d-flex gap-4 mt-3 small text-muted">
                <span>Lượt mời: <strong>{info?.totalReferrals ?? 0}</strong></span>
                <span>Đã nhận: <strong>{formatVnd(info?.totalEarned ?? 0)}</strong></span>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Apply a code (Candidate only) */}
      {isCandidate && (
        <Card className="border-0 shadow-sm mb-4">
          <Card.Body>
            <h6 className="fw-bold mb-3">Nhập mã giới thiệu</h6>
            <Form onSubmit={handleApply} className="d-flex gap-2 flex-wrap">
              <Form.Control
                style={{ maxWidth: 280 }}
                placeholder="VD: FJOB-A1B2C3D4"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
              />
              <Button type="submit" variant="primary" disabled={applying}>
                {applying ? 'Đang áp dụng...' : 'Áp dụng'}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      )}

      <Row className="g-4">
        {/* Referral history */}
        <Col lg={6}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white fw-bold">Lịch sử giới thiệu</Card.Header>
            <Card.Body className="p-0">
              {history.length === 0 ? (
                <Alert variant="info" className="m-3 mb-0">Chưa có lượt giới thiệu nào.</Alert>
              ) : (
                <Table responsive hover className="mb-0 align-middle">
                  <thead>
                    <tr>
                      <th>Người được mời</th>
                      <th>Thưởng</th>
                      <th>Trạng thái</th>
                      <th>Ngày</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h) => (
                      <tr key={getEntityId(h)}>
                        <td>{refereeName(h)}</td>
                        <td className="text-success fw-500">{formatVnd(h.rewardAmount)}</td>
                        <td><Badge bg="secondary">{h.status}</Badge></td>
                        <td className="small text-muted">{formatDateTime(h.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Payout history */}
        <Col lg={6}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white fw-bold">Lịch sử rút tiền</Card.Header>
            <Card.Body className="p-0">
              {payouts.length === 0 ? (
                <Alert variant="info" className="m-3 mb-0">Chưa có yêu cầu rút tiền nào.</Alert>
              ) : (
                <Table responsive hover className="mb-0 align-middle">
                  <thead>
                    <tr>
                      <th>Số tiền</th>
                      <th>Ngân hàng</th>
                      <th>Trạng thái</th>
                      <th>Ngày</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts.map((p) => (
                      <tr key={getEntityId(p)}>
                        <td className="fw-500">{formatVnd(p.amount)}</td>
                        <td className="small">{p.bankInfo?.bankName}</td>
                        <td>
                          <Badge bg={payoutStatusVariant(p.status)}>
                            {payoutStatusLabel(p.status)}
                          </Badge>
                        </td>
                        <td className="small text-muted">{formatDateTime(p.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Bank settings modal */}
      <Modal show={showSettings} onHide={() => setShowSettings(false)} centered>
        <Form onSubmit={handleSaveBank}>
          <Modal.Header closeButton>
            <Modal.Title className="h6">Tài khoản ngân hàng</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Ngân hàng *</Form.Label>
              <Form.Control
                required
                placeholder="Vd: Vietcombank"
                value={bankForm.bankName}
                onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Số tài khoản *</Form.Label>
              <Form.Control
                required
                value={bankForm.accountNumber}
                onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Chủ tài khoản *</Form.Label>
              <Form.Control
                required
                placeholder="NGUYEN VAN A"
                value={bankForm.accountHolderName}
                onChange={(e) => setBankForm({ ...bankForm, accountHolderName: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowSettings(false)}>Hủy</Button>
            <Button type="submit" variant="primary">Lưu</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Payout request modal */}
      <Modal show={showPayout} onHide={() => setShowPayout(false)} centered>
        <Form onSubmit={handleRequestPayout}>
          <Modal.Header closeButton>
            <Modal.Title className="h6">Yêu cầu rút tiền</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {eligibility && !eligibility.eligible && (
              <Alert variant="warning">
                {eligibility.reason ||
                  (!eligibility.hasSettings
                    ? 'Bạn cần thêm tài khoản ngân hàng trước khi rút tiền.'
                    : 'Số dư chưa đủ điều kiện rút tiền.')}
              </Alert>
            )}
            <p className="small text-muted">
              Số dư khả dụng: <strong>{formatVnd(balance)}</strong>. Tối thiểu {formatVnd(MIN_PAYOUT_AMOUNT)}.
            </p>
            <Form.Group>
              <Form.Label>Số tiền muốn rút (VND)</Form.Label>
              <Form.Control
                type="number"
                min={MIN_PAYOUT_AMOUNT}
                max={balance}
                step={1000}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowPayout(false)}>Hủy</Button>
            <Button
              type="submit"
              variant="primary"
              disabled={amount < MIN_PAYOUT_AMOUNT || amount > balance || (eligibility ? !eligibility.eligible : false)}
            >
              Gửi yêu cầu
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}
