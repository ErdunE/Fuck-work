"""
SQLAlchemy ORM models for FuckWork.
Phase 7.0 - Clean Profile Models matching frontend exactly.
"""

from datetime import datetime

from sqlalchemy import (
    ARRAY,
    TIMESTAMP,
    Boolean,
    Column,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()


# =============================================================================
# User & Profile Models
# =============================================================================


class User(Base):
    """用户账户 - 认证信息"""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255))
    cognito_sub = Column(String(255), unique=True, index=True)
    token_version = Column(Integer, nullable=False, default=1, index=True)
    last_login_at = Column(TIMESTAMP)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    profile = relationship(
        "UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    resumes = relationship("UserResume", back_populates="user", cascade="all, delete-orphan")
    experience = relationship("UserExperience", back_populates="user", cascade="all, delete-orphan")
    education = relationship("UserEducation", back_populates="user", cascade="all, delete-orphan")
    skills = relationship("UserSkill", back_populates="user", cascade="all, delete-orphan")
    languages = relationship("UserLanguage", back_populates="user", cascade="all, delete-orphan")
    projects = relationship("UserProject", back_populates="user", cascade="all, delete-orphan")
    certifications = relationship(
        "UserCertification", back_populates="user", cascade="all, delete-orphan"
    )
    awards = relationship("UserAward", back_populates="user", cascade="all, delete-orphan")
    publications = relationship(
        "UserPublication", back_populates="user", cascade="all, delete-orphan"
    )
    volunteering = relationship(
        "UserVolunteering", back_populates="user", cascade="all, delete-orphan"
    )
    job_preferences = relationship(
        "UserJobPreferences", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}')>"


class UserProfile(Base):
    """用户档案 - Personal Info 页面"""

    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True, index=True)

    # Basic Information
    first_name = Column(String(255))
    last_name = Column(String(255))
    preferred_name = Column(String(255))
    email = Column(String(255))

    # Contact
    phone_country_code = Column(String(10))
    phone_number = Column(String(30))

    # Location
    country = Column(String(100))
    state = Column(String(100))
    city = Column(String(255))
    street_address = Column(String(255))
    apartment = Column(String(100))
    postal_code = Column(String(20))

    # Online Presence
    linkedin_url = Column(String(512))
    github_url = Column(String(512))
    website_url = Column(String(512))
    other_urls = Column(JSONB)  # [{"label": "Twitter", "url": "..."}]

    # About
    professional_summary = Column(Text)

    # Relationship
    user = relationship("User", back_populates="profile")

    def __repr__(self):
        return f"<UserProfile(user_id={self.user_id})>"


class UserResume(Base):
    """简历和 Cover Letter - Resume 页面"""

    __tablename__ = "user_resumes"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    file_name = Column(String(255), nullable=False)
    file_url = Column(String(1024), nullable=False)
    file_type = Column(String(50))
    file_size = Column(Integer)
    is_default = Column(Boolean, default=False)
    is_cover_letter = Column(Boolean, default=False)
    uploaded_at = Column(TIMESTAMP, default=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="resumes")

    def __repr__(self):
        return f"<UserResume(id={self.id}, file='{self.file_name}')>"


class UserExperience(Base):
    """工作经历 - Experience 页面"""

    __tablename__ = "user_experience"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    job_title = Column(String(255), nullable=False)
    company_name = Column(String(255), nullable=False)
    employment_type = Column(String(50))
    location_type = Column(String(50))
    location = Column(String(255))

    start_month = Column(String(20))
    start_year = Column(Integer)
    end_month = Column(String(20))
    end_year = Column(Integer)
    is_current = Column(Boolean, default=False)

    description = Column(Text)
    skills_used = Column(ARRAY(Text))

    # Relationship
    user = relationship("User", back_populates="experience")

    def __repr__(self):
        return f"<UserExperience(id={self.id}, company='{self.company_name}')>"


class UserEducation(Base):
    """教育经历 - Education 页面"""

    __tablename__ = "user_education"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    school_name = Column(String(255), nullable=False)
    degree = Column(String(100))
    field_of_study = Column(String(255))
    location = Column(String(255))

    start_month = Column(String(20))
    start_year = Column(Integer)
    end_month = Column(String(20))
    end_year = Column(Integer)
    is_current = Column(Boolean, default=False)

    gpa = Column(String(20))
    honors = Column(String(255))
    coursework = Column(Text)
    activities = Column(Text)

    # Relationship
    user = relationship("User", back_populates="education")

    def __repr__(self):
        return f"<UserEducation(id={self.id}, school='{self.school_name}')>"


class UserSkill(Base):
    """技能 - Skills 页面"""

    __tablename__ = "user_skills"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    skill_name = Column(String(100), nullable=False)

    # Relationship
    user = relationship("User", back_populates="skills")

    def __repr__(self):
        return f"<UserSkill(id={self.id}, skill='{self.skill_name}')>"


class UserLanguage(Base):
    """语言 - Skills 页面"""

    __tablename__ = "user_languages"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    language_name = Column(String(100), nullable=False)
    proficiency = Column(String(50))

    # Relationship
    user = relationship("User", back_populates="languages")

    def __repr__(self):
        return f"<UserLanguage(id={self.id}, language='{self.language_name}')>"


class UserProject(Base):
    """项目 - Achievements 页面"""

    __tablename__ = "user_projects"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    project_name = Column(String(255), nullable=False)
    role = Column(String(100))
    start_month = Column(String(20))
    start_year = Column(Integer)
    end_month = Column(String(20))
    end_year = Column(Integer)
    is_ongoing = Column(Boolean, default=False)
    project_url = Column(String(512))
    repo_url = Column(String(512))
    description = Column(Text)
    technologies = Column(ARRAY(Text))

    # Relationship
    user = relationship("User", back_populates="projects")

    def __repr__(self):
        return f"<UserProject(id={self.id}, name='{self.project_name}')>"


class UserCertification(Base):
    """证书 - Achievements 页面"""

    __tablename__ = "user_certifications"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    name = Column(String(255), nullable=False)
    issuing_organization = Column(String(255))
    issue_month = Column(String(20))
    issue_year = Column(Integer)
    expiration_month = Column(String(20))
    expiration_year = Column(Integer)
    no_expiration = Column(Boolean, default=False)
    credential_id = Column(String(255))
    credential_url = Column(String(512))

    # Relationship
    user = relationship("User", back_populates="certifications")

    def __repr__(self):
        return f"<UserCertification(id={self.id}, name='{self.name}')>"


class UserAward(Base):
    """奖项 - Achievements 页面"""

    __tablename__ = "user_awards"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    title = Column(String(255), nullable=False)
    issuer = Column(String(255))
    received_month = Column(String(20))
    received_year = Column(Integer)
    description = Column(Text)

    # Relationship
    user = relationship("User", back_populates="awards")

    def __repr__(self):
        return f"<UserAward(id={self.id}, title='{self.title}')>"


class UserPublication(Base):
    """发表 - Achievements 页面"""

    __tablename__ = "user_publications"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    title = Column(String(255), nullable=False)
    publisher = Column(String(255))
    publication_month = Column(String(20))
    publication_year = Column(Integer)
    url = Column(String(512))
    authors = Column(Text)
    description = Column(Text)

    # Relationship
    user = relationship("User", back_populates="publications")

    def __repr__(self):
        return f"<UserPublication(id={self.id}, title='{self.title}')>"


class UserVolunteering(Base):
    """志愿者经历 - Achievements 页面"""

    __tablename__ = "user_volunteering"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    organization = Column(String(255), nullable=False)
    role = Column(String(255))
    cause = Column(String(255))
    start_month = Column(String(20))
    start_year = Column(Integer)
    end_month = Column(String(20))
    end_year = Column(Integer)
    is_current = Column(Boolean, default=False)
    description = Column(Text)

    # Relationship
    user = relationship("User", back_populates="volunteering")

    def __repr__(self):
        return f"<UserVolunteering(id={self.id}, org='{self.organization}')>"


class UserJobPreferences(Base):
    """求职偏好 - Preferences 页面"""

    __tablename__ = "user_job_preferences"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True, index=True)

    # Job Preferences
    desired_titles = Column(ARRAY(Text))
    desired_industries = Column(ARRAY(Text))
    desired_company_sizes = Column(ARRAY(Text))

    # Compensation
    min_salary = Column(Integer)
    max_salary = Column(Integer)
    salary_currency = Column(String(10), default="USD")
    salary_period = Column(String(20), default="yearly")
    salary_negotiable = Column(Boolean, default=True)

    # Location & Work Mode
    preferred_locations = Column(ARRAY(Text))
    work_modes = Column(ARRAY(Text))
    willing_to_relocate = Column(String(50))  # "yes", "no", "for_the_right_opportunity"
    relocation_locations = Column(ARRAY(Text))

    # Employment Details
    employment_types = Column(ARRAY(Text))
    available_start_date = Column(String(50))  # "immediately", "2_weeks", etc.
    travel_percentage = Column(String(50))  # "no_travel", "up_to_25", etc.

    # Work Authorization
    work_auth_countries = Column(ARRAY(Text))
    requires_sponsorship = Column(String(50))  # "yes", "no", "not_applicable"

    # Application Questions
    age_over_18 = Column(Boolean)
    has_drivers_license = Column(Boolean)
    has_reliable_transportation = Column(Boolean)
    background_check_consent = Column(Boolean)
    drug_test_consent = Column(Boolean)

    # EEO
    eeo_gender = Column(String(50))
    eeo_sexual_orientation = Column(String(50))
    eeo_veteran_status = Column(String(50))
    eeo_disability_status = Column(String(50))
    eeo_race_ethnicity = Column(ARRAY(Text))

    # Relationship
    user = relationship("User", back_populates="job_preferences")

    def __repr__(self):
        return f"<UserJobPreferences(user_id={self.user_id})>"


# =============================================================================
# Jobs Model (保留)
# =============================================================================


class Job(Base):
    """Job posting model."""

    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True)
    job_id = Column(String(255), unique=True, nullable=False, index=True)

    title = Column(String(500), nullable=False)
    company_name = Column(String(255), nullable=False, index=True)
    location = Column(String(255))
    url = Column(Text, unique=True, nullable=False)
    platform = Column(String(50), nullable=False, index=True)
    jd_text = Column(Text, nullable=False)
    posted_date = Column(TIMESTAMP, index=True)

    authenticity_score = Column(Float, index=True)
    authenticity_level = Column(String(20))
    confidence = Column(String(20))
    red_flags = Column(JSONB)
    positive_signals = Column(JSONB)

    collection_metadata = Column(JSONB)
    poster_info = Column(JSONB)
    company_info = Column(JSONB)
    platform_metadata = Column(JSONB)
    derived_signals = Column(JSONB)

    created_at = Column(TIMESTAMP, default=datetime.utcnow, index=True)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    expires_at = Column(TIMESTAMP)

    def __repr__(self):
        return f"<Job(id={self.id}, job_id='{self.job_id}')>"
