import api from './api';
import { API_BASE_URL } from '@/config/env';
import type {
  AddSkillPayload,
  CreateEducationPayload,
  CreateExperiencePayload,
  CvFileItem,
  MyProfile,
  UpdateProfilePayload,
} from '@/types/api';

/**
 * Candidate self-service profile API — backend prefix `/profiles`.
 * All endpoints require a CANDIDATE token unless noted otherwise.
 */
const profileService = {
  /** GET /profiles/my — own candidate profile. */
  getMine() {
    return api.get<MyProfile>('/profiles/my');
  },

  /** PUT /profiles/my — update general profile summary. */
  update(payload: UpdateProfilePayload) {
    return api.put<MyProfile>('/profiles/my', payload);
  },

  /** PUT /profiles/status — toggle open-to-work. */
  setOpenToWork(openToWork: boolean) {
    return api.put<MyProfile>('/profiles/status', { openToWork });
  },

  // ─── Experience ──────────────────────────────────────────────────────────
  addExperience(payload: CreateExperiencePayload) {
    return api.post<MyProfile>('/profiles/experience', payload);
  },
  updateExperience(id: string, payload: Partial<CreateExperiencePayload>) {
    return api.put<MyProfile>(`/profiles/experience/${id}`, payload);
  },
  deleteExperience(id: string) {
    return api.delete<MyProfile>(`/profiles/experience/${id}`);
  },

  // ─── Education ───────────────────────────────────────────────────────────
  addEducation(payload: CreateEducationPayload) {
    return api.post<MyProfile>('/profiles/education', payload);
  },
  updateEducation(id: string, payload: Partial<CreateEducationPayload>) {
    return api.put<MyProfile>(`/profiles/education/${id}`, payload);
  },
  deleteEducation(id: string) {
    return api.delete<MyProfile>(`/profiles/education/${id}`);
  },

  // ─── Skills ──────────────────────────────────────────────────────────────
  addSkill(payload: AddSkillPayload) {
    return api.post<MyProfile>('/profiles/skills', payload);
  },
  deleteSkill(skillId: string) {
    return api.delete<MyProfile>(`/profiles/skills/${skillId}`);
  },

  // ─── CV files ────────────────────────────────────────────────────────────
  listFiles() {
    return api.get<CvFileItem[]>('/profiles/files');
  },
  uploadCv(file: File) {
    const form = new FormData();
    form.append('file', file);
    return api.post<MyProfile>('/profiles/files', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteCv(id: string) {
    return api.delete<MyProfile>(`/profiles/files/${id}`);
  },
  setPrimaryCv(id: string) {
    return api.put<MyProfile>(`/profiles/files/${id}/primary`);
  },
  /** Convenience: absolute download URL for a CV file (auth header sent by interceptor on fetch). */
  cvDownloadUrl(id: string) {
    return `${API_BASE_URL}/profiles/files/${id}/download`;
  },

  // ─── Avatar ──────────────────────────────────────────────────────────────
  uploadAvatar(file: File) {
    const form = new FormData();
    form.append('file', file);
    return api.put<MyProfile>('/profiles/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /** GET /profiles/preview/:candidateId — Employer/Admin profile preview. */
  preview(candidateId: string) {
    return api.get<MyProfile>(`/profiles/preview/${candidateId}`);
  },
};

export default profileService;
