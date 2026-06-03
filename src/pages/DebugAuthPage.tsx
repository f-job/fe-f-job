import { Container, Alert, Card } from 'react-bootstrap';
import { useAuthStore } from '@stores/authStore';

export default function DebugAuthPage() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <Container className="py-4">
      <h1>Debug Authentication Status</h1>
      
      <Card className="mt-4">
        <Card.Header>
          <strong>Authentication Status</strong>
        </Card.Header>
        <Card.Body>
          <div className="mb-3">
            <strong>Is Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}
          </div>
          
          {user ? (
            <>
              <div className="mb-2">
                <strong>User ID:</strong> {user.id}
              </div>
              <div className="mb-2">
                <strong>Email:</strong> {user.email}
              </div>
              <div className="mb-2">
                <strong>Name:</strong> {user.name || user.fullName || 'N/A'}
              </div>
              <div className="mb-2">
                <strong>Role:</strong> <span className="badge bg-primary">{user.role}</span>
              </div>
              <div className="mb-2">
                <strong>Avatar URL:</strong> {user.avatarUrl || 'N/A'}
              </div>
            </>
          ) : (
            <Alert variant="warning">No user data available</Alert>
          )}
        </Card.Body>
      </Card>
      
      <Card className="mt-4">
        <Card.Header>
          <strong>Access Rights for /tim-ung-vien</strong>
        </Card.Header>
        <Card.Body>
          {!isAuthenticated && (
            <Alert variant="danger">
              ❌ You need to login to access /tim-ung-vien
            </Alert>
          )}
          
          {isAuthenticated && user && !['EMPLOYER', 'ADMIN'].includes(user.role) && (
            <Alert variant="danger">
              ❌ Your role "{user.role}" cannot access /tim-ung-vien
              <br />
              Required roles: EMPLOYER or ADMIN
            </Alert>
          )}
          
          {isAuthenticated && user && ['EMPLOYER', 'ADMIN'].includes(user.role) && (
            <Alert variant="success">
              ✅ You can access /tim-ung-vien
              <br />
              <a href="/tim-ung-vien" className="btn btn-primary mt-2">
                Go to Candidate Search
              </a>
            </Alert>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}
