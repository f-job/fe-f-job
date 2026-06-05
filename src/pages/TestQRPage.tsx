import { useState } from 'react';
import { Container, Card, Form, Button, Alert, Badge } from 'react-bootstrap';
import { parseCCCDQR } from '@utils/cccdParser';

/**
 * Test page for QR code parsing
 * Use this to test QR format without needing actual CCCD images
 */
export default function TestQRPage() {
  const [qrInput, setQrInput] = useState('001234567890|123456789012|Nguyen Van A|15011990|Nam|Ha Noi|01012020');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleTest = () => {
    setError('');
    setResult(null);
    
    try {
      const parsed = parseCCCDQR(qrInput);
      setResult(parsed);
    } catch (err: any) {
      setError(err.message || 'Parse error');
    }
  };

  return (
    <Container className="py-5" style={{ maxWidth: 800 }}>
      <h2 className="mb-4">🧪 Test CCCD QR Parser</h2>

      <Card className="mb-4">
        <Card.Body>
          <h5 className="mb-3">Format QR CCCD chuẩn</h5>
          <code className="d-block bg-light p-3 rounded mb-3" style={{ fontSize: '0.9rem' }}>
            ID|oldID|fullName|DDMMYYYY|gender|address|issueDate
          </code>
          
          <h6 className="mb-2">Ví dụ:</h6>
          <code className="d-block bg-light p-3 rounded" style={{ fontSize: '0.85rem', wordBreak: 'break-all' }}>
            001234567890|123456789012|Nguyen Van A|15011990|Nam|Ha Noi|01012020
          </code>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Body>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Nhập dữ liệu QR để test:</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              placeholder="Paste QR data here..."
              style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
            />
            <Form.Text className="text-muted">
              Format: ID|oldID|name|DDMMYYYY|gender|address|issueDate
            </Form.Text>
          </Form.Group>

          <Button variant="primary" onClick={handleTest} className="btn-primary-gradient">
            <i className="bi bi-play-fill me-2" />
            Test Parse
          </Button>
        </Card.Body>
      </Card>

      {error && (
        <Alert variant="danger">
          <i className="bi bi-exclamation-triangle me-2" />
          <strong>Error:</strong> {error}
        </Alert>
      )}

      {result && (
        <Card className="border-success">
          <Card.Header className="bg-success text-white">
            <i className="bi bi-check-circle me-2" />
            Parse thành công!
          </Card.Header>
          <Card.Body>
            <div className="mb-3">
              <Badge bg="primary" className="me-2">ID Number</Badge>
              <span className="fw-bold">{result.idNumber}</span>
            </div>

            {result.oldIdNumber && (
              <div className="mb-3">
                <Badge bg="secondary" className="me-2">Old ID</Badge>
                <span>{result.oldIdNumber}</span>
              </div>
            )}

            <div className="mb-3">
              <Badge bg="primary" className="me-2">Full Name</Badge>
              <span className="fw-bold">{result.fullName}</span>
            </div>

            <div className="mb-3">
              <Badge bg="primary" className="me-2">Date of Birth</Badge>
              <span>{result.dateOfBirth}</span>
            </div>

            {result.gender && (
              <div className="mb-3">
                <Badge bg="info" className="me-2">Gender</Badge>
                <span>{result.gender}</span>
              </div>
            )}

            {result.address && (
              <div className="mb-3">
                <Badge bg="info" className="me-2">Address</Badge>
                <span>{result.address}</span>
              </div>
            )}

            {result.issueDate && (
              <div className="mb-3">
                <Badge bg="info" className="me-2">Issue Date</Badge>
                <span>{result.issueDate}</span>
              </div>
            )}

            <hr />
            
            <h6 className="mb-2">Raw JSON:</h6>
            <pre className="bg-light p-3 rounded" style={{ fontSize: '0.85rem' }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </Card.Body>
        </Card>
      )}

      <Card className="mt-4 bg-light">
        <Card.Body>
          <h6 className="fw-bold mb-3">
            <i className="bi bi-lightbulb me-2 text-warning" />
            Test samples:
          </h6>
          
          <div className="mb-3">
            <strong>Valid sample 1:</strong>
            <code className="d-block bg-white p-2 rounded mt-1 small" style={{ wordBreak: 'break-all' }}>
              001234567890|123456789012|Nguyen Van A|15011990|Nam|Ha Noi|01012020
            </code>
          </div>

          <div className="mb-3">
            <strong>Valid sample 2 (minimal):</strong>
            <code className="d-block bg-white p-2 rounded mt-1 small" style={{ wordBreak: 'break-all' }}>
              987654321098||Tran Thi B|20052000|Nu||
            </code>
          </div>

          <div className="mb-0">
            <strong>Invalid sample (missing fields):</strong>
            <code className="d-block bg-white p-2 rounded mt-1 small" style={{ wordBreak: 'break-all' }}>
              001234567890|Nguyen Van A
            </code>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}
