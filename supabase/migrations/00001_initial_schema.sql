-- ============================================================
-- F-Job Initial Database Schema Migration
-- Creates all tables, enum types, constraints, indexes, and
-- foreign key relationships for the F-Job platform.
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. Enum Types
-- ============================================================

CREATE TYPE user_type AS ENUM ('job_seeker', 'employer');

CREATE TYPE user_status AS ENUM ('pending', 'verified', 'suspended');

CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');

CREATE TYPE verification_status AS ENUM ('not_started', 'pending', 'verified', 'rejected');

CREATE TYPE job_status AS ENUM ('open', 'filled', 'completed', 'cancelled');

CREATE TYPE recurrence_pattern AS ENUM ('weekly');

CREATE TYPE application_status AS ENUM ('pending', 'accepted', 'rejected', 'completed');

CREATE TYPE review_type AS ENUM ('employer_to_seeker', 'seeker_to_employer');

-- ============================================================
-- 2. Tables
-- ============================================================

-- 2.1 users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_type user_type NOT NULL,
    status user_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT users_phone_unique UNIQUE (phone),
    CONSTRAINT users_email_unique UNIQUE (email)
);

-- 2.2 job_seeker_profiles
CREATE TABLE job_seeker_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    gender gender_type,
    avatar_url TEXT,
    address TEXT,
    current_location TEXT,
    school_name VARCHAR(255),
    major VARCHAR(255),
    skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    id_card_front_url TEXT,
    id_card_back_url TEXT,
    selfie_url TEXT,
    verification_status verification_status NOT NULL DEFAULT 'not_started',
    credit_score DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_job_seeker_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT job_seeker_profiles_user_id_unique UNIQUE (user_id)
);

-- 2.3 employer_profiles
CREATE TABLE employer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    business_email VARCHAR(255),
    business_type VARCHAR(255),
    address TEXT,
    business_license_url TEXT,
    business_photo_url TEXT,
    verification_status verification_status NOT NULL DEFAULT 'not_started',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_employer_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT employer_profiles_user_id_unique UNIQUE (user_id)
);

-- 2.4 jobs
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employer_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    job_category VARCHAR(100) NOT NULL,
    number_of_positions INTEGER NOT NULL,
    work_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    hourly_wage INTEGER NOT NULL,
    location VARCHAR(255) NOT NULL,
    requirements TEXT,
    slug VARCHAR(500) NOT NULL,
    status job_status NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_jobs_employer FOREIGN KEY (employer_id) REFERENCES employer_profiles(id) ON DELETE CASCADE,
    CONSTRAINT jobs_slug_unique UNIQUE (slug),
    CONSTRAINT jobs_number_of_positions_positive CHECK (number_of_positions > 0),
    CONSTRAINT jobs_hourly_wage_positive CHECK (hourly_wage > 0)
);

-- 2.5 availabilities
CREATE TABLE availabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_seeker_id UUID NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    recurrence_pattern recurrence_pattern,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_availabilities_job_seeker FOREIGN KEY (job_seeker_id) REFERENCES job_seeker_profiles(id) ON DELETE CASCADE
);

-- 2.6 applications
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL,
    job_seeker_id UUID NOT NULL,
    status application_status NOT NULL DEFAULT 'pending',
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_applications_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    CONSTRAINT fk_applications_job_seeker FOREIGN KEY (job_seeker_id) REFERENCES job_seeker_profiles(id) ON DELETE CASCADE,
    CONSTRAINT applications_job_seeker_unique UNIQUE (job_id, job_seeker_id)
);

-- 2.7 reviews
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL,
    reviewer_id UUID NOT NULL,
    reviewee_id UUID NOT NULL,
    punctuality_rating INTEGER NOT NULL,
    attitude_rating INTEGER NOT NULL,
    skills_rating INTEGER NOT NULL,
    overall_rating INTEGER NOT NULL,
    comment VARCHAR(500),
    review_type review_type NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_reviews_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_reviewee FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT reviews_punctuality_rating_range CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
    CONSTRAINT reviews_attitude_rating_range CHECK (attitude_rating >= 1 AND attitude_rating <= 5),
    CONSTRAINT reviews_skills_rating_range CHECK (skills_rating >= 1 AND skills_rating <= 5),
    CONSTRAINT reviews_overall_rating_range CHECK (overall_rating >= 1 AND overall_rating <= 5)
);

-- 2.8 credit_score_history
CREATE TABLE credit_score_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    score_change DECIMAL(10, 2) NOT NULL,
    reason TEXT NOT NULL,
    application_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_credit_score_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_credit_score_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE SET NULL,
    CONSTRAINT credit_score_change_values CHECK (
        score_change IN (1.0, 0.5, -2.0, -0.5)
    )
);

-- 2.9 favorite_workers
CREATE TABLE favorite_workers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employer_id UUID NOT NULL,
    job_seeker_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_favorites_employer FOREIGN KEY (employer_id) REFERENCES employer_profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_favorites_job_seeker FOREIGN KEY (job_seeker_id) REFERENCES job_seeker_profiles(id) ON DELETE CASCADE,
    CONSTRAINT favorite_workers_unique UNIQUE (employer_id, job_seeker_id)
);

-- ============================================================
-- 3. Indexes
-- ============================================================

-- Users lookup by phone/email for auth
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);

-- Job seeker profiles lookup by user_id
CREATE INDEX idx_job_seeker_profiles_user_id ON job_seeker_profiles(user_id);

-- Employer profiles lookup by user_id
CREATE INDEX idx_employer_profiles_user_id ON employer_profiles(user_id);

-- Jobs: common query patterns
CREATE INDEX idx_jobs_employer_id ON jobs(employer_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_work_date ON jobs(work_date);
CREATE INDEX idx_jobs_slug ON jobs(slug);
CREATE INDEX idx_jobs_job_category ON jobs(job_category);

-- Availabilities: lookup by job seeker and date
CREATE INDEX idx_availabilities_job_seeker_id ON availabilities(job_seeker_id);
CREATE INDEX idx_availabilities_date ON availabilities(date);

-- Applications: lookup by job and job seeker
CREATE INDEX idx_applications_job_id ON applications(job_id);
CREATE INDEX idx_applications_job_seeker_id ON applications(job_seeker_id);
CREATE INDEX idx_applications_status ON applications(status);

-- Reviews: lookup by application, reviewer, reviewee
CREATE INDEX idx_reviews_application_id ON reviews(application_id);
CREATE INDEX idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX idx_reviews_reviewee_id ON reviews(reviewee_id);

-- Credit score history: lookup by user
CREATE INDEX idx_credit_score_history_user_id ON credit_score_history(user_id);

-- Favorite workers: lookup by employer
CREATE INDEX idx_favorite_workers_employer_id ON favorite_workers(employer_id);
CREATE INDEX idx_favorite_workers_job_seeker_id ON favorite_workers(job_seeker_id);

-- ============================================================
-- 4. Updated_at trigger function
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
