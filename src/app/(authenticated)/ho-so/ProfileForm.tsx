'use client';

import { useState, useEffect } from 'react';
import type { WorkerProfile, TrustLevel } from '@/lib/types';
import CreditScoreHistory from './CreditScoreHistory';

const TRUST_LEVEL_LABELS: Record<TrustLevel, string> = {
  new: 'Mới',
  trustworthy: 'Đáng tin cậy',
  reputable: 'Uy tín',
  excellent: 'Xuất sắc',
  top_worker: 'Top Worker',
};

const TRUST_LEVEL_COLORS: Record<TrustLevel, string> = {
  new: 'bg-gray-100 text-gray-700',
  trustworthy: 'bg-blue-100 text-blue-700',
  reputable: 'bg-green-100 text-green-700',
  excellent: 'bg-purple-100 text-purple-700',
  top_worker: 'bg-yellow-100 text-yellow-700',
};

export default function ProfileForm() {
  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newSkill, setNewSkill] = useState('');

  // Editable form state
  const [form, setForm] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: 'other' as 'male' | 'female' | 'other',
    address: '',
    currentLocation: '',
    schoolName: '',
    major: '',
    skills: [] as string[],
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      setLoading(true);
      const res = await fetch('/api/profile');
      const data = await res.json();
      if (res.ok && data.profile) {
        setProfile(data.profile);
        setForm({
          fullName: data.profile.fullName || '',
          dateOfBirth: data.profile.dateOfBirth || '',
          gender: data.profile.gender || 'other',
          address: data.profile.address || '',
          currentLocation: data.profile.currentLocation || '',
          schoolName: data.profile.schoolName || '',
          major: data.profile.major || '',
          skills: data.profile.skills || [],
        });
      } else {
        setError(data.message || 'Không thể tải hồ sơ.');
      }
    } catch {
      setError('Không thể kết nối đến máy chủ.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Cập nhật hồ sơ thành công!');
        setEditing(false);
        await fetchProfile();
      } else {
        setError(data.message || 'Không thể cập nhật hồ sơ.');
      }
    } catch {
      setError('Không thể kết nối đến máy chủ.');
    } finally {
      setSaving(false);
    }
  }

  function addSkill() {
    const trimmed = newSkill.trim();
    if (trimmed && !form.skills.includes(trimmed)) {
      setForm({ ...form, skills: [...form.skills, trimmed] });
      setNewSkill('');
    }
  }

  function removeSkill(skill: string) {
    setForm({ ...form, skills: form.skills.filter((s) => s !== skill) });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500">Đang tải hồ sơ...</div>
      </div>
    );
  }

  if (!profile && error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      {profile && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Điểm uy tín" value={profile.creditScore.toString()} />
          <StatCard
            label="Cấp độ"
            value={TRUST_LEVEL_LABELS[profile.trustLevel]}
            badge
            badgeClass={TRUST_LEVEL_COLORS[profile.trustLevel]}
          />
          <StatCard label="Việc hoàn thành" value={profile.totalCompletedJobs.toString()} />
          <StatCard
            label="Đánh giá TB"
            value={profile.averageRating > 0 ? `${profile.averageRating} ⭐` : 'Chưa có'}
          />
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}
      {success && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-600">{success}</div>
      )}

      {/* Edit toggle */}
      <div className="flex justify-end">
        {!editing ? (
          <button
            onClick={() => { setEditing(true); setSuccess(''); }}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Chỉnh sửa hồ sơ
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditing(false);
                if (profile) {
                  setForm({
                    fullName: profile.fullName || '',
                    dateOfBirth: profile.dateOfBirth || '',
                    gender: profile.gender || 'other',
                    address: profile.address || '',
                    currentLocation: profile.currentLocation || '',
                    schoolName: profile.schoolName || '',
                    major: profile.major || '',
                    skills: profile.skills || [],
                  });
                }
              }}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        )}
      </div>

      {/* Personal Info */}
      <Section title="Thông tin cá nhân">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Họ và tên"
            value={form.fullName}
            editing={editing}
            onChange={(v) => setForm({ ...form, fullName: v })}
          />
          <Field
            label="Ngày sinh"
            value={form.dateOfBirth}
            type="date"
            editing={editing}
            onChange={(v) => setForm({ ...form, dateOfBirth: v })}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Giới tính</label>
            {editing ? (
              <select
                value={form.gender}
                onChange={(e) =>
                  setForm({ ...form, gender: e.target.value as 'male' | 'female' | 'other' })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            ) : (
              <p className="py-2 text-sm text-gray-900">
                {form.gender === 'male' ? 'Nam' : form.gender === 'female' ? 'Nữ' : 'Khác'}
              </p>
            )}
          </div>
          {profile?.avatarUrl && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Ảnh đại diện</label>
              <img
                src={profile.avatarUrl}
                alt="Avatar"
                className="h-16 w-16 rounded-full object-cover"
              />
            </div>
          )}
        </div>
      </Section>

      {/* Contact Info */}
      <Section title="Thông tin liên hệ">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Địa chỉ"
            value={form.address}
            editing={editing}
            onChange={(v) => setForm({ ...form, address: v })}
          />
          <Field
            label="Vị trí hiện tại"
            value={form.currentLocation}
            editing={editing}
            onChange={(v) => setForm({ ...form, currentLocation: v })}
          />
        </div>
      </Section>

      {/* Education */}
      <Section title="Học vấn">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Trường học"
            value={form.schoolName || ''}
            editing={editing}
            onChange={(v) => setForm({ ...form, schoolName: v })}
          />
          <Field
            label="Chuyên ngành"
            value={form.major || ''}
            editing={editing}
            onChange={(v) => setForm({ ...form, major: v })}
          />
        </div>
      </Section>

      {/* Skills */}
      <Section title="Kỹ năng">
        <div className="flex flex-wrap gap-2">
          {form.skills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700"
            >
              {skill}
              {editing && (
                <button
                  onClick={() => removeSkill(skill)}
                  className="ml-1 text-blue-400 hover:text-blue-600"
                  aria-label={`Xóa kỹ năng ${skill}`}
                >
                  ×
                </button>
              )}
            </span>
          ))}
          {form.skills.length === 0 && !editing && (
            <p className="text-sm text-gray-500">Chưa có kỹ năng nào</p>
          )}
        </div>
        {editing && (
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSkill();
                }
              }}
              placeholder="Thêm kỹ năng..."
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={addSkill}
              type="button"
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Thêm
            </button>
          </div>
        )}
      </Section>

      {/* Credit Score History */}
      <CreditScoreHistory />
    </div>
  );
}


/* ---- Helper sub-components ---- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">{title}</h2>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  editing,
  type = 'text',
  onChange,
}: {
  label: string;
  value: string;
  editing: boolean;
  type?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      {editing ? (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      ) : (
        <p className="py-2 text-sm text-gray-900">{value || '—'}</p>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  badge,
  badgeClass,
}: {
  label: string;
  value: string;
  badge?: boolean;
  badgeClass?: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      {badge ? (
        <span className={`mt-1 inline-block rounded-full px-3 py-1 text-sm font-semibold ${badgeClass}`}>
          {value}
        </span>
      ) : (
        <p className="mt-1 text-xl font-bold text-gray-900">{value}</p>
      )}
    </div>
  );
}
