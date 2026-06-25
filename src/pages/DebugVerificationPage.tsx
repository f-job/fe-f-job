import { useState, useEffect } from 'react';
import { Container, Card, Alert, Button, Badge } from 'react-bootstrap';
import verificationService from '@services/verificationService';

/**
 * Debug page to check verification auth status
 */
export default function DebugVerificationPage() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [statusResponse, setStatusResponse] = useState<any>(null);
  const [statusError, setStatusError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    const userStr = localStorage.getItem('user');
    
    setToken(accessToken);
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        console.error('Failed to parse user from localStorage');
      }
    }
  }, []);

  const checkStatus = async () => {
    setLoading(true);
    setStatusError('');
    setStatusResponse(null);

    try {
      const { data } = await verificationService.getStatus();
      setStatusResponse(data);
    } catch (err: any) {
      setStatusError(err.response?.data?.message || err.message || 'Unknown error');
      console.error('Status check error:', err);
    } finally {
      setLoading(false);
    }
  };

  const parseJWT = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  const tokenPayload = token ? parseJWT(token) : null;
  const isAuthenticated = !!(token && user);

  return (
    <Container className="py-5" style={{ maxWidth: 900 }}>
      <h2 className="mb-4">🐛 Debug Verification Auth</h2>

      {/* Auth Context Status */}
      <Card className="mb-3">
        <Card.Header className="fw-bold">1. LocalStorage User</Card.Header>
        <Card.Body>
          <div className="mb-2">
            <strong>Is Authenticated:</strong>{' '}
            {isAuthenticated ? (
              <Badge bg="success">Yes</Badge>
            ) : (
              <Badge bg="danger">No</Badge>
            )}
          </div>
          {user && (
            <>
              <div className="mb-2">
                <strong>User ID:</strong> <code>{user._id || user.id || 'N/A'}</code>
              </div>
              <div className="mb-2">
                <strong>Email:</strong> {user.email}
              </div>
              <div className="mb-2">
                <strong>Name:</strong> {user.firstName} {user.lastName}
              </div>
              <div className="mb-2">
                <strong>Role:</strong> <Badge bg="primary">{user.role}</Badge>
              </div>
            </>
          )}
          {!user && (
            <Alert variant="warning" className="mb-0 mt-2">
              No user in localStorage
            </Alert>
          )}
        </Card.Body>
      </Card>

      {/* LocalStorage Token */}
      <Card className="mb-3">
        <Card.Header className="fw-bold">2. LocalStorage Token</Card.Header>
        <Card.Body>
          {token ? (
            <>
              <div className="mb-2">
                <strong>Token exists:</strong> <Badge bg="success">Yes</Badge>
              </div>
              <div className="mb-2">
                <strong>Token (first 50 chars):</strong>
                <pre className="bg-light p-2 rounded small mb-0" style={{ wordBreak: 'break-all' }}>
                  {token.substring(0, 50)}...
                </pre>
              </div>
            </>
          ) : (
            <Alert variant="danger" className="mb-0">
              No access token found in localStorage
            </Alert>
          )}
        </Card.Body>
      </Card>

      {/* JWT Payload */}
      {tokenPayload && (
        <Card className="mb-3">
          <Card.Header className="fw-bold">3. JWT Payload</Card.Header>
          <Card.Body>
            <div className="mb-2">
              <strong>User ID (sub):</strong> <code>{tokenPayload.sub || 'N/A'}</code>
            </div>
            <div className="mb-2">
              <strong>Email:</strong> {tokenPayload.email || 'N/A'}
            </div>
            <div className="mb-2">
              <strong>Role:</strong> <Badge bg="info">{tokenPayload.role || 'N/A'}</Badge>
            </div>
            <div className="mb-2">
              <strong>Issued At:</strong>{' '}
              {tokenPayload.iat
                ? new Date(tokenPayload.iat * 1000).toLocaleString()
                : 'N/A'}
            </div>
            <div className="mb-2">
              <strong>Expires At:</strong>{' '}
              {tokenPayload.exp
                ? new Date(tokenPayload.exp * 1000).toLocaleString()
                : 'N/A'}
            </div>
            {tokenPayload.exp && (
              <div className="mb-2">
                <strong>Token Status:</strong>{' '}
                {Date.now() / 1000 > tokenPayload.exp ? (
                  <Badge bg="danger">Expired</Badge>
                ) : (
                  <Badge bg="success">Valid</Badge>
                )}
              </div>
            )}
            <hr />
            <details>
              <summary className="fw-semibold" style={{ cursor: 'pointer' }}>
                Raw JWT Payload
              </summary>
              <pre className="bg-light p-2 rounded small mt-2 mb-0">
                {JSON.stringify(tokenPayload, null, 2)}
              </pre>
            </details>
          </Card.Body>
        </Card>
      )}

      {/* API Status Check */}
      <Card className="mb-3">
        <Card.Header className="fw-bold">
          4. Verification Status API Check
        </Card.Header>
        <Card.Body>
          <Button
            variant="primary"
            onClick={checkStatus}
            disabled={loading || !token}
            className="mb-3"
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Checking...
              </>
            ) : (
              'Check Verification Status'
            )}
          </Button>

          {!token && (
            <Alert variant="warning">
              No token available. Please login first.
            </Alert>
          )}

          {statusError && (
            <Alert variant="danger">
              <strong>Error:</strong> {statusError}
            </Alert>
          )}

          {statusResponse && (
            <div>
              <Alert variant="success">
                <strong>✅ API call successful!</strong>
              </Alert>
              <pre className="bg-light p-3 rounded small mb-0">
                {JSON.stringify(statusResponse, null, 2)}
              </pre>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Troubleshooting */}
      <Card className="bg-light">
        <Card.Header className="fw-bold">💡 Troubleshooting</Card.Header>
        <Card.Body>
          <h6 className="fw-semibold mb-2">"User not found" error usually means:</h6>
          <ul className="mb-3">
            <li>
              <strong>No token:</strong> User not logged in
            </li>
            <li>
              <strong>Expired token:</strong> Token expired, needs refresh
            </li>
            <li>
              <strong>Invalid user ID:</strong> User ID in token doesn't exist in database
            </li>
            <li>
              <strong>Token mismatch:</strong> Token from different environment/database
            </li>
          </ul>

          <h6 className="fw-semibold mb-2">Solutions:</h6>
          <ol className="mb-0">
            <li>Check if user is logged in (Auth Context)</li>
            <li>Check if token exists in localStorage</li>
            <li>Check if token is expired (JWT Payload)</li>
            <li>Try logout and login again</li>
            <li>Check backend logs for the user ID being used</li>
            <li>Verify user exists in database with that ID</li>
          </ol>
        </Card.Body>
      </Card>
    </Container>
  );
}
