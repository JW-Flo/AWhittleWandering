-- Tessie Canonical Tables Migration

-- Create canonical users table
CREATE TABLE IF NOT EXISTS canonical_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create canonical organizations table
CREATE TABLE IF NOT EXISTS canonical_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create canonical user_organizations junction table
CREATE TABLE IF NOT EXISTS canonical_user_organizations (
    user_id UUID REFERENCES canonical_users(id),
    organization_id UUID REFERENCES canonical_organizations(id),
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, organization_id)
);

-- TODO: Add indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_canonical_users_email ON canonical_users(email);
CREATE INDEX IF NOT EXISTS idx_canonical_organizations_slug ON canonical_organizations(slug);
