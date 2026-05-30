import { Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { quickTags } from '@/data/mockData';

export function QuickTags() {
  return (
    <section className="py-3">
      <Container>
        <div className="d-flex flex-wrap gap-2 justify-content-center">
          {quickTags.map((tag) => (
            <Link
              key={tag}
              to={`/viec-lam?keyword=${encodeURIComponent(tag)}`}
              className="quick-tag"
            >
              <i className="bi bi-tag me-1" />
              {tag}
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
