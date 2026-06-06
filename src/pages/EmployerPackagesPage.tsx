import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Row,
  Spinner,
  Table,
} from 'react-bootstrap';
import toast from 'react-hot-toast';
import packageService from '@services/packageService';
import type {
  CreditTransaction,
  PurchasedPackage,
  ServicePackage,
} from '@/types/api';
import { formatDateTime, formatVnd, getEntityId, getErrorMessage } from '@utils/format';

const TX_TYPE_LABEL: Record<string, string> = {
  PURCHASE: 'Mua gói',
  JOB_BOOST: 'Đẩy tin',
  PROFILE_UNLOCK: 'Mở khóa hồ sơ',
  REFUND: 'Hoàn credit',
  ADMIN_ADJUST: 'Điều chỉnh',
};

export default function EmployerPackagesPage() {
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [mine, setMine] = useState<PurchasedPackage[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [pkgs, bal, purchased, tx] = await Promise.all([
        packageService.listActive(),
        packageService.creditBalance(),
        packageService.myPurchased(),
        packageService.creditTransactions({ page: 1, limit: 20 }),
      ]);
      setPackages(pkgs.data);
      setBalance(bal.data?.balance ?? 0);
      setMine(purchased.data ?? []);
      setTransactions(tx.data?.data ?? []);
    } catch (err) {
      setError(getErrorMessage(err, 'Không thể tải dữ liệu gói dịch vụ'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const purchase = async (pkg: ServicePackage) => {
    const id = getEntityId(pkg);
    if (!window.confirm(`Mua gói "${pkg.name}" với giá ${formatVnd(pkg.price)}?`)) return;
    setPurchasingId(id);
    try {
      await packageService.purchase(id);
      toast.success('Mua gói thành công');
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Mua gói thất bại'));
    } finally {
      setPurchasingId(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner />
        <p className="text-muted mt-3 mb-0">Đang tải...</p>
      </div>
    );
  }

  return (
    <Container className="py-2">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="h3 fw-bold mb-1">Gói dịch vụ &amp; Credit</h1>
          <p className="text-muted mb-0">Mua credit để đẩy tin và mở khóa hồ sơ ứng viên.</p>
        </div>
        <Card className="border-0 shadow-sm">
          <Card.Body className="py-2 px-4 text-center">
            <div className="small text-muted">Số dư credit</div>
            <div className="h4 fw-bold text-primary mb-0">{balance ?? 0}</div>
          </Card.Body>
        </Card>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Active packages */}
      <h2 className="h5 fw-bold mb-3">Gói khả dụng</h2>
      {packages.length === 0 ? (
        <Alert variant="info">Hiện chưa có gói nào.</Alert>
      ) : (
        <Row className="g-3 mb-4">
          {packages.map((pkg) => {
            const id = getEntityId(pkg);
            return (
              <Col md={6} lg={4} key={id}>
                <Card className="h-100 border-0 shadow-sm card-hover">
                  <Card.Body className="d-flex flex-column">
                    <h5 className="fw-bold">{pkg.name}</h5>
                    {pkg.description && (
                      <p className="text-muted small flex-grow-1">{pkg.description}</p>
                    )}
                    <div className="mb-2">
                      <Badge bg="primary" className="me-2">{pkg.credits} credit</Badge>
                    </div>
                    <div className="h4 fw-bold text-success mb-3">{formatVnd(pkg.price)}</div>
                    <Button
                      className="btn-primary-gradient mt-auto"
                      disabled={purchasingId === id}
                      onClick={() => purchase(pkg)}
                    >
                      {purchasingId === id ? <Spinner size="sm" /> : (
                        <>
                          <i className="bi bi-cart-plus me-1" />Mua gói
                        </>
                      )}
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* Active subscriptions */}
      {mine.length > 0 && (
        <>
          <h2 className="h5 fw-bold mb-3">Gói đang sử dụng</h2>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <Table responsive className="align-middle mb-0">
                <thead>
                  <tr>
                    <th>Gói</th>
                    <th>Ngày mua</th>
                    <th>Hết hạn</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {mine.map((p, i) => (
                    <tr key={`${p.packageId}-${i}`}>
                      <td className="fw-500">{p.name}</td>
                      <td className="small text-muted">{formatDateTime(p.purchasedAt)}</td>
                      <td className="small text-muted">{formatDateTime(p.expiresAt)}</td>
                      <td>
                        <Badge bg={p.isActive ? 'success' : 'secondary'}>
                          {p.isActive ? 'Đang hoạt động' : 'Hết hạn'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </>
      )}

      {/* Transaction history */}
      <h2 className="h5 fw-bold mb-3">Lịch sử giao dịch credit</h2>
      <Card className="border-0 shadow-sm">
        <Card.Body>
          {transactions.length === 0 ? (
            <Alert variant="info" className="mb-0">Chưa có giao dịch nào.</Alert>
          ) : (
            <Table responsive hover className="align-middle mb-0">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Loại</th>
                  <th>Mô tả</th>
                  <th className="text-end">Credit</th>
                  <th className="text-end">Số dư sau</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={getEntityId(t)}>
                    <td className="small text-muted">{formatDateTime(t.createdAt)}</td>
                    <td><Badge bg="light" text="dark">{TX_TYPE_LABEL[t.type] ?? t.type}</Badge></td>
                    <td className="small">{t.description}</td>
                    <td className={`text-end fw-500 ${t.amount >= 0 ? 'text-success' : 'text-danger'}`}>
                      {t.amount >= 0 ? `+${t.amount}` : t.amount}
                    </td>
                    <td className="text-end">{t.balanceAfter}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}
