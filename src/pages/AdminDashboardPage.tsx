import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import './AdminDashboardPage.css';

// Mock data adjusted to ~200 users and ~10 employers
const userGrowthData = [
  { name: 'T2', users: 150, employers: 5 },
  { name: 'T3', users: 165, employers: 6 },
  { name: 'T4', users: 172, employers: 8 },
  { name: 'T5', users: 185, employers: 9 },
  { name: 'T6', users: 198, employers: 10 },
  { name: 'T7', users: 215, employers: 12 },
];

const jobsData = [
  { name: 'F&B', active: 18, pending: 5 },
  { name: 'Sự kiện', active: 12, pending: 3 },
  { name: 'Bán lẻ', active: 8, pending: 2 },
  { name: 'Giao hàng', active: 5, pending: 1 },
  { name: 'Khác', active: 2, pending: 0 },
];

const recentActivities = [
  { id: 1, action: 'Người dùng mới đăng ký', target: 'tranvanb@gmail.com', time: '15 phút trước', type: 'user' },
  { id: 2, action: 'Tin tuyển dụng mới', target: 'Nhân viên phục vụ part-time', time: '1 giờ trước', type: 'job' },
  { id: 3, action: 'Yêu cầu xác minh', target: 'Công ty TNHH XYZ', time: '2 giờ trước', type: 'verification' },
  { id: 4, action: 'Nhà tuyển dụng mới', target: 'Cửa hàng tiện lợi ABC', time: '4 giờ trước', type: 'user' },
  { id: 5, action: 'Tin tuyển dụng mới', target: 'PG Sự kiện ra mắt sản phẩm', time: '5 giờ trước', type: 'job' },
];

export default function AdminDashboardPage() {
  const stats = {
    totalUsers: 215,
    totalEmployers: 12,
    totalJobs: 68,
    activeJobs: 45,
    pendingVerifications: 3,
    totalRevenue: 4850000 // 4.85M VND
  };

  return (
    <div className="admin-dashboard fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Tổng quan hệ thống</h2>
          <p className="text-muted mb-0">Theo dõi các chỉ số quan trọng của F-Job</p>
        </div>
        <button className="btn btn-primary-gradient d-none d-sm-block">
          <i className="bi bi-download me-2"></i> Xuất báo cáo
        </button>
      </div>

      {/* Stat Cards Row */}
      <Row className="g-4 mb-4">
        <Col xs={12} sm={6} xl={3}>
          <Card className="stat-card h-100 border-0 shadow-sm overflow-hidden">
            <Card.Body className="p-4 position-relative">
              <div className="stat-icon-bg bg-primary-soft text-primary">
                <i className="bi bi-people-fill"></i>
              </div>
              <p className="text-muted fw-semibold mb-1">Tổng Người Dùng</p>
              <h3 className="fw-bold mb-2">{stats.totalUsers.toLocaleString()}</h3>
              <p className="mb-0 text-success small fw-500">
                <i className="bi bi-arrow-up-right me-1"></i> +8.5% so với tháng trước
              </p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col xs={12} sm={6} xl={3}>
          <Card className="stat-card h-100 border-0 shadow-sm overflow-hidden">
            <Card.Body className="p-4 position-relative">
              <div className="stat-icon-bg bg-accent-soft text-accent">
                <i className="bi bi-briefcase-fill"></i>
              </div>
              <p className="text-muted fw-semibold mb-1">Tin Tuyển Dụng</p>
              <h3 className="fw-bold mb-2">{stats.totalJobs.toLocaleString()}</h3>
              <p className="mb-0 text-success small fw-500">
                <i className="bi bi-arrow-up-right me-1"></i> {stats.activeJobs.toLocaleString()} đang hiển thị
              </p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col xs={12} sm={6} xl={3}>
          <Card className="stat-card h-100 border-0 shadow-sm overflow-hidden">
            <Card.Body className="p-4 position-relative">
              <div className="stat-icon-bg bg-success-soft text-success">
                <i className="bi bi-cash-stack"></i>
              </div>
              <p className="text-muted fw-semibold mb-1">Tổng Doanh Thu</p>
              <h3 className="fw-bold mb-2">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.totalRevenue)}</h3>
              <p className="mb-0 text-success small fw-500">
                <i className="bi bi-arrow-up-right me-1"></i> +15.2% so với tháng trước
              </p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col xs={12} sm={6} xl={3}>
          <Card className="stat-card h-100 border-0 shadow-sm overflow-hidden">
            <Card.Body className="p-4 position-relative">
              <div className="stat-icon-bg bg-warning-soft text-warning">
                <i className="bi bi-shield-check"></i>
              </div>
              <p className="text-muted fw-semibold mb-1">Chờ Xác Minh</p>
              <h3 className="fw-bold mb-2">{stats.pendingVerifications.toLocaleString()}</h3>
              <p className="mb-0 text-danger small fw-500">
                <i className="bi bi-arrow-up-right me-1"></i> Cần xử lý gấp
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Charts Row */}
      <Row className="g-4 mb-4">
        <Col xs={12} lg={8}>
          <Card className="chart-card h-100 border-0 shadow-sm">
            <Card.Header className="bg-transparent border-0 pt-4 pb-0 px-4">
              <h5 className="fw-bold mb-0">Tăng trưởng người dùng (6 tháng qua)</h5>
            </Card.Header>
            <Card.Body className="px-4 pb-4 pt-3">
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={userGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorEmployers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)'}} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                    <Area type="monotone" name="Ứng viên" dataKey="users" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                    <Area type="monotone" name="Nhà tuyển dụng" dataKey="employers" stroke="var(--accent)" strokeWidth={3} fillOpacity={1} fill="url(#colorEmployers)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} lg={4}>
          <Card className="chart-card h-100 border-0 shadow-sm">
            <Card.Header className="bg-transparent border-0 pt-4 pb-0 px-4">
              <h5 className="fw-bold mb-0">Tin đăng theo ngành</h5>
            </Card.Header>
            <Card.Body className="px-4 pb-4 pt-3">
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={jobsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)'}} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)'}} width={80} />
                    <RechartsTooltip 
                      cursor={{fill: 'var(--bg-secondary)'}}
                      contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)' }}
                    />
                    <Legend iconType="circle" />
                    <Bar dataKey="active" name="Đang hiển thị" stackId="a" fill="var(--primary)" radius={[0, 4, 4, 0]} barSize={15} />
                    <Bar dataKey="pending" name="Chờ duyệt" stackId="a" fill="var(--bg-tertiary)" radius={[0, 4, 4, 0]} barSize={15} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Activity Table */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <Card.Header className="bg-transparent border-bottom pt-4 pb-3 px-4 d-flex justify-content-between align-items-center">
          <h5 className="fw-bold mb-0">Hoạt động gần đây</h5>
          <a href="#" className="text-decoration-none text-primary fw-500">Xem tất cả</a>
        </Card.Header>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 custom-table">
            <thead className="table-light text-muted">
              <tr>
                <th className="px-4 py-3 fw-semibold border-0">Hoạt động</th>
                <th className="px-4 py-3 fw-semibold border-0">Đối tượng</th>
                <th className="px-4 py-3 fw-semibold border-0">Thời gian</th>
                <th className="px-4 py-3 fw-semibold border-0 text-end">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {recentActivities.map((activity) => (
                <tr key={activity.id}>
                  <td className="px-4 py-3 border-bottom-0">
                    <div className="d-flex align-items-center gap-3">
                      <div className={`activity-icon activity-${activity.type}`}>
                        {activity.type === 'user' && <i className="bi bi-person-plus"></i>}
                        {activity.type === 'job' && <i className="bi bi-file-earmark-plus"></i>}
                        {activity.type === 'verification' && <i className="bi bi-shield-exclamation"></i>}
                        {activity.type === 'payment' && <i className="bi bi-credit-card"></i>}
                        {activity.type === 'report' && <i className="bi bi-flag"></i>}
                      </div>
                      <span className="fw-500 text-dark">{activity.action}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted border-bottom-0">{activity.target}</td>
                  <td className="px-4 py-3 text-muted border-bottom-0 small">{activity.time}</td>
                  <td className="px-4 py-3 border-bottom-0 text-end">
                    <button className="btn btn-sm btn-light rounded-pill px-3">Chi tiết</button>
                  </td>
                </tr>
              ))}
              {recentActivities.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-4 text-muted">
                    Chưa có hoạt động nào gần đây.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
