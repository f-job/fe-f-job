import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import monitoringService, { HealthStatus } from '@services/monitoringService';
import toast from 'react-hot-toast';

interface StatusState {
  health?: HealthStatus;
  readiness?: HealthStatus;
  liveness?: HealthStatus;
}

function getErrorMessage(error: unknown, fallback: string) {
  const err = error as { response?: { data?: { message?: string } } };
  return err.response?.data?.message || fallback;
}

function StatusCard({ title, data }: { title: string; data?: HealthStatus }) {
  return (
    <Card className="border-0 shadow-sm h-100">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-3">
          <h2 className="h5 fw-bold mb-0">{title}</h2>
          <Badge bg={data?.status === 'ok' ? 'success' : 'secondary'}>{data?.status ?? 'unknown'}</Badge>
        </div>
        {data ? (
          <div className="small text-muted">
            {data.timestamp && <div>Timestamp: {new Date(data.timestamp).toLocaleString('vi-VN')}</div>}
            {typeof data.uptime === 'number' && <div>Uptime: {Math.round(data.uptime)}s</div>}
            {data.memoryUsage && <div>Memory keys: {Object.keys(data.memoryUsage).length}</div>}
          </div>
        ) : (
          <p className="text-muted mb-0">Chưa có dữ liệu.</p>
        )}
      </Card.Body>
    </Card>
  );
}

export default function MonitoringPage() {
  const [statuses, setStatuses] = useState<StatusState>({});
  const [metrics, setMetrics] = useState('');
  const [alertPayload, setAlertPayload] = useState('{"alerts":[]}');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStatuses = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [health, readiness, liveness, metricsResponse] = await Promise.all([
        monitoringService.getHealth(),
        monitoringService.getReadiness(),
        monitoringService.getLiveness(),
        monitoringService.getMetrics(),
      ]);
      setStatuses({
        health: health.data,
        readiness: readiness.data,
        liveness: liveness.data,
      });
      setMetrics(String(metricsResponse.data));
    } catch (err) {
      setError(getErrorMessage(err, 'Không thể tải dữ liệu monitoring'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStatuses();
  }, []);

  const runAction = async (label: string, action: () => Promise<unknown>) => {
    try {
      await action();
      toast.success(`${label} thành công`);
      await loadStatuses();
    } catch (err) {
      toast.error(getErrorMessage(err, `${label} thất bại`));
    }
  };

  const sendAlert = async () => {
    try {
      const parsed = JSON.parse(alertPayload) as { alerts?: Array<Record<string, unknown>> };
      await monitoringService.sendAlert({ alerts: parsed.alerts ?? [] });
      toast.success('Đã gửi alert payload');
    } catch (err) {
      if (err instanceof SyntaxError) {
        toast.error('JSON alert payload không hợp lệ');
        return;
      }
      toast.error(getErrorMessage(err, 'Không thể gửi alert payload'));
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Monitoring</h1>
          <p className="text-muted mb-0">Tích hợp các API `/api/monitoring` hiện có.</p>
        </div>
        <Button variant="outline-primary" onClick={loadStatuses} disabled={isLoading}>
          {isLoading ? <Spinner size="sm" /> : 'Tải lại'}
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="g-3 mb-4">
        <Col md={4}><StatusCard title="Health" data={statuses.health} /></Col>
        <Col md={4}><StatusCard title="Readiness" data={statuses.readiness} /></Col>
        <Col md={4}><StatusCard title="Liveness" data={statuses.liveness} /></Col>
      </Row>

      <Row className="g-3">
        <Col lg={7}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <h2 className="h5 fw-bold mb-3">Metrics</h2>
              {isLoading ? (
                <div className="text-center py-4"><Spinner /></div>
              ) : (
                <pre className="bg-dark text-white rounded p-3 small mb-0" style={{ maxHeight: 420, overflow: 'auto' }}>
                  {metrics || 'Không có metrics.'}
                </pre>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={5}>
          <Card className="border-0 shadow-sm mb-3">
            <Card.Body>
              <h2 className="h5 fw-bold mb-3">System actions</h2>
              <div className="d-grid gap-2">
                <Button variant="outline-danger" onClick={() => runAction('Simulate error', monitoringService.simulateError)}>
                  Simulate error
                </Button>
                <Button variant="outline-secondary" onClick={() => runAction('Trigger GC', monitoringService.triggerGc)}>
                  Trigger GC
                </Button>
                <Button variant="outline-warning" onClick={() => runAction('Simulate memory leak', monitoringService.simulateMemoryLeak)}>
                  Simulate memory leak
                </Button>
              </div>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h2 className="h5 fw-bold mb-3">AlertManager webhook</h2>
              <Form.Group className="mb-3">
                <Form.Label>Payload JSON</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={5}
                  value={alertPayload}
                  onChange={(event) => setAlertPayload(event.target.value)}
                />
              </Form.Group>
              <Button onClick={sendAlert}>Gửi alert</Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
