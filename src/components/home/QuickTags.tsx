import { Container } from 'react-bootstrap';
import { quickTags } from '@/data/mockData';

export function QuickTags() {
  return (
    <section className="py-3">
      <Container>
        <div className="d-flex flex-wrap gap-2 justify-content-center">
          {quickTags.map((tag) => (
            <a
              key={tag}
              href="#"
              className="quick-tag"
              onClick={(e) => e.preventDefault()}
            >
              <i className="bi bi-tag me-1" />
              {tag}
            </a>
          ))}
        </div>
      </Container>
    </section>
  );
}
