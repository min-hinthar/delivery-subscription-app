-- =====================================================
-- Migration: 20260106000002_fix_driver_profiles_nullable
-- Description: Make driver_profiles full_name and phone nullable for invite flow
-- Issue: Admin cannot invite driver - fields are NOT NULL but not provided during invite
-- Created: 2026-01-06
-- =====================================================

-- Make full_name and phone nullable to allow pending invites
-- The constraint driver_profiles_active_requires_contact ensures these are filled when status = 'active'
alter table public.driver_profiles
  alter column full_name drop not null,
  alter column phone drop not null;

-- Update comment to reflect the nullable fields
comment on column public.driver_profiles.full_name is 'Driver full name - required when status is active';
comment on column public.driver_profiles.phone is 'Driver phone number - required when status is active';
