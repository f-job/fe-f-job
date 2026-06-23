import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './AboutPage.css';

const stats = [
  { number: '90%', label: 'Giảm thời gian tuyển dụng nhờ AI Matching' },
  { number: '18-25', label: 'Độ tuổi lực lượng lao động trẻ chủ lực' },
  { number: '2 chiều', label: 'Cơ chế xác thực uy tín minh bạch' },
  { number: 'Đà Nẵng', label: 'Thị trường thí điểm giai đoạn đầu' },
];

const strengths = [
  {
    icon: 'bi-bullseye',
    title: 'Nền tảng chuyên biệt cho job sự kiện',
    desc: 'Tập trung vào nhân sự thời vụ sự kiện như hậu cần, lễ tân, hỗ trợ sân khấu, activation — giúp thông tin rõ ràng, đúng nhu cầu và giảm nhiễu so với các nền tảng đại trà.',
  },
  {
    icon: 'bi-lightning-charge',
    title: 'Match nhanh, đúng người, đúng ca',
    desc: 'Kết nối nhân sự và nhà tuyển dụng tức thì dựa trên kỹ năng, kinh nghiệm, thời gian rảnh và vị trí địa lý — tương tự mô hình app gọi xe công nghệ.',
  },
  {
    icon: 'bi-patch-check',
    title: 'Hồ sơ nhân sự chuẩn hoá & minh bạch',
    desc: 'Hồ sơ năng lực tập trung, lịch sử công việc và đánh giá từ các job trước giúp nhà tuyển dụng giảm rủi ro bom job và nâng cao chất lượng nhân sự.',
  },
  {
    icon: 'bi-shield-check',
    title: 'Giảm rủi ro lừa đảo & bỏ ca',
    desc: 'Xác thực thông tin người dùng, cơ chế đánh giá - xếp hạng và lưu vết lịch sử làm việc tạo nên môi trường tuyển dụng an toàn, đáng tin cậy.',
  },
  {
    icon: 'bi-mortarboard',
    title: 'Tối ưu trải nghiệm cho sinh viên',
    desc: 'Giúp sinh viên dễ tìm job phù hợp lịch học, xây dựng hồ sơ nghề nghiệp sớm và tăng cơ hội được chọn cho các công việc tốt hơn trong tương lai.',
  },
  {
    icon: 'bi-graph-up-arrow',
    title: 'Dễ mở rộng & tiềm năng scale',
    desc: 'Từ job sự kiện, F-Job có thể mở rộng sang hội chợ, lễ hội, concert, activation thương hiệu và nhiều loại job thời vụ theo ca khác.',
  },
];

const problems = [
  'Bài đăng tuyển dụng dễ bị trôi hoặc bỏ sót trên các hội nhóm Facebook, Zalo.',
  'Thông tin tuyển dụng thiếu xác thực, khó kiểm soát chất lượng ứng viên.',
  'Tiềm ẩn rủi ro lừa đảo hoặc nhân sự bỏ ca vào phút chót.',
  'Sinh viên khó chứng minh năng lực vì không có hồ sơ tập trung, đáng tin cậy.',
];

const solutions = [
  'Hệ thống hồ sơ nhân sự chuẩn hoá, minh bạch và dễ kiểm chứng.',
  'AI Matching đề xuất đúng người - đúng việc - đúng vị trí tức thì.',
  'Xác thực hai chiều (Double Trust) giữa nhà tuyển dụng và ứng viên.',
  'Hệ thống Credit Score chống tình trạng "bùng ca" (ghosting).',
];

const steps = [
  {
    title: 'Tạo hồ sơ',
    desc: 'Sinh viên tạo hồ sơ năng lực, cập nhật kỹ năng và thời gian rảnh.',
  },
  {
    title: 'Match nhanh',
    desc: 'Hệ thống đề xuất công việc phù hợp theo vị trí và lịch rảnh thực tế.',
  },
  {
    title: 'Nhận việc',
    desc: 'Ứng tuyển và nhận ca làm chỉ trong vài bước, không nhắn tin rời rạc.',
  },
  {
    title: 'Tích uy tín',
    desc: 'Hoàn thành job, nhận đánh giá và tích luỹ điểm uy tín cho cơ hội tốt hơn.',
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="about-hero">
        <Container className="about-hero-content text-center">
          <span className="about-badge">Nền tảng việc làm thời vụ</span>
          <h1 className="display-5 fw-bold mb-3">
            Về <span style={{ color: '#fff' }}>F-Job</span>
          </h1>
          <p className="lead mb-0 mx-auto opacity-90" style={{ maxWidth: 720 }}>
            Nền tảng kết nối nhanh giữa nhân sự thời vụ và nhà tổ chức sự kiện —
            minh bạch, linh hoạt và hiệu quả cho thị trường lao động trẻ Việt
            Nam.
          </p>
        </Container>
      </section>

      {/* Stats */}
      <Container className="about-stats">
        <Row className="g-3">
          {stats.map((s) => (
            <Col xs={6} lg={3} key={s.label}>
              <div className="stat-card">
                <div className="about-stat-number">{s.number}</div>
                <div className="about-stat-label">{s.label}</div>
              </div>
            </Col>
          ))}
        </Row>
      </Container>

      {/* Story / mission */}
      <section className="section">
        <Container>
          <Row className="align-items-center g-5">
            <Col lg={6}>
              <h2 className="section-title mb-3">Chúng tôi là ai?</h2>
              <p className="text-muted">
                F-Job là một nền tảng web thông minh dành riêng cho thị trường
                việc làm phổ thông và ngắn hạn (casual jobs), tập trung vào các
                công việc sự kiện như hậu cần, lễ tân, hỗ trợ check-in, phụ việc
                sân khấu và activation.
              </p>
              <p className="text-muted mb-0">
                Khác với hình thức tuyển dụng truyền thống qua hội nhóm mạng xã
                hội, F-Job cung cấp hệ thống hồ sơ nhân sự chuẩn hoá cùng cơ chế
                match nhanh theo thời gian và vị trí, giúp quá trình tuyển dụng
                diễn ra tức thì như mô hình đặt dịch vụ của các ứng dụng công
                nghệ hiện nay.
              </p>
            </Col>
            <Col lg={6}>
              <Row className="g-3">
                <Col sm={6}>
                  <div className="value-card">
                    <div className="value-icon">
                      <i className="bi bi-cpu" />
                    </div>
                    <h6 className="fw-bold">Match nhanh</h6>
                    <p className="text-muted small mb-0">
                      Đề xuất việc làm theo vị trí địa lý và lịch rảnh thời gian
                      thực.
                    </p>
                  </div>
                </Col>
                <Col sm={6}>
                  <div className="value-card">
                    <div className="value-icon">
                      <i className="bi bi-people" />
                    </div>
                    <h6 className="fw-bold">Double Trust</h6>
                    <p className="text-muted small mb-0">
                      Xác thực hai chiều giữa nhà tuyển dụng có thật và ứng viên
                      thật.
                    </p>
                  </div>
                </Col>
                <Col sm={6}>
                  <div className="value-card">
                    <div className="value-icon">
                      <i className="bi bi-award" />
                    </div>
                    <h6 className="fw-bold">Credit Score</h6>
                    <p className="text-muted small mb-0">
                      Điểm uy tín chống "bùng ca", thưởng cho nhân sự làm việc
                      nghiêm túc.
                    </p>
                  </div>
                </Col>
                <Col sm={6}>
                  <div className="value-card">
                    <div className="value-icon">
                      <i className="bi bi-clock-history" />
                    </div>
                    <h6 className="fw-bold">Real-time</h6>
                    <p className="text-muted small mb-0">
                      Thông báo thời gian thực và quản lý lịch trình làm việc
                      khoa học.
                    </p>
                  </div>
                </Col>
              </Row>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Problem vs Solution */}
      <section
        className="section"
        style={{ backgroundColor: 'var(--secondary-bg)' }}
      >
        <Container>
          <div className="text-center mb-5">
            <h2 className="section-title mb-2">Vấn đề & Giải pháp</h2>
            <p className="text-muted mb-0">
              F-Job giải quyết tận gốc những bất cập của tuyển dụng nhân sự sự
              kiện hiện nay.
            </p>
          </div>
          <Row className="g-4">
            <Col md={6}>
              <div className="compare-card problem">
                <h5 className="fw-bold mb-3 text-danger">
                  <i className="bi bi-exclamation-triangle me-2" />
                  Cách làm truyền thống
                </h5>
                <ul className="compare-list">
                  {problems.map((p) => (
                    <li key={p}>
                      <i className="bi bi-x-circle-fill text-danger" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Col>
            <Col md={6}>
              <div className="compare-card solution">
                <h5 className="fw-bold mb-3" style={{ color: '#166534' }}>
                  <i className="bi bi-check2-circle me-2" />
                  Với F-Job
                </h5>
                <ul className="compare-list">
                  {solutions.map((s) => (
                    <li key={s}>
                      <i
                        className="bi bi-check-circle-fill"
                        style={{ color: '#16a34a' }}
                      />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Strengths */}
      <section className="section">
        <Container>
          <div className="text-center mb-5">
            <h2 className="section-title mb-2">Điểm mạnh của F-Job</h2>
            <p className="text-muted mb-0">
              Sáu giá trị cốt lõi tạo nên sự khác biệt của nền tảng.
            </p>
          </div>
          <Row className="g-4">
            {strengths.map((item) => (
              <Col md={6} lg={4} key={item.title}>
                <div className="value-card">
                  <div className="value-icon">
                    <i className={`bi ${item.icon}`} />
                  </div>
                  <h6 className="fw-bold mb-2">{item.title}</h6>
                  <p className="text-muted small mb-0">{item.desc}</p>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* How it works */}
      <section
        className="section"
        style={{ backgroundColor: 'var(--secondary-bg)' }}
      >
        <Container>
          <div className="text-center mb-5">
            <h2 className="section-title mb-2">F-Job hoạt động như thế nào?</h2>
            <p className="text-muted mb-0">
              Bốn bước đơn giản để kết nối nhân sự và công việc.
            </p>
          </div>
          <Row className="g-4">
            {steps.map((step, idx) => (
              <Col xs={6} lg={3} key={step.title} className="text-center">
                <div className="step-number">{idx + 1}</div>
                <h6 className="fw-bold mb-2">{step.title}</h6>
                <p className="text-muted small mb-0">{step.desc}</p>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Vision */}
      <section className="section">
        <Container>
          <Row className="justify-content-center">
            <Col lg={9} className="text-center">
              <span
                className="about-badge"
                style={{
                  background: 'var(--secondary-bg)',
                  color: 'var(--primary)',
                  border: 'none',
                }}
              >
                <i className="bi bi-eye me-2" />
                Tầm nhìn
              </span>
              <h2 className="section-title mt-3 mb-3">
                Xây dựng hệ sinh thái việc làm linh hoạt & đáng tin cậy
              </h2>
              <p className="text-muted">
                F-Job hướng tới việc giúp sinh viên và nhà tuyển dụng kết nối,
                quản lý công việc ngắn hạn một cách dễ dàng hơn, chính xác hơn
                và hiệu quả hơn. Đây không chỉ là một trang web tuyển dụng — mà
                là giải pháp toàn diện cho thị trường việc làm tự do (Gig
                Economy), từ tự động hoá tìm kiếm nhân sự bằng AI, xác thực uy
                tín hai chiều cho đến quản lý lịch trình làm việc khoa học.
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* CTA */}
      <section className="section pt-0">
        <Container>
          <div className="about-cta">
            <h2 className="fw-bold mb-3">Sẵn sàng bắt đầu cùng F-Job?</h2>
            <p className="opacity-90 mb-4">
              Tham gia ngay để tìm việc sự kiện phù hợp hoặc tuyển nhân sự thời
              vụ nhanh chóng.
            </p>
            <div className="d-flex gap-3 justify-content-center flex-wrap">
              <Button as={Link as any} to="/viec-lam" variant="light" size="lg">
                <i className="bi bi-search me-2" />
                Tìm việc ngay
              </Button>
              <Button
                as={Link as any}
                to="/dang-ky"
                size="lg"
                variant="outline-light"
              >
                <i className="bi bi-person-plus me-2" />
                Đăng ký tài khoản
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
