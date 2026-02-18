
-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('senior', 'caregiver');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  role app_role NOT NULL DEFAULT 'senior',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Senior connections (caregiver -> senior)
CREATE TABLE public.senior_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  caregiver_id UUID NOT NULL,
  senior_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (caregiver_id, senior_id)
);

-- Daily check-ins
CREATE TABLE public.daily_check_ins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  senior_id UUID NOT NULL,
  checked_in_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  check_date DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE (senior_id, check_date)
);

-- Reminder settings
CREATE TABLE public.reminder_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  senior_id UUID NOT NULL UNIQUE,
  reminder_time TIME NOT NULL DEFAULT '09:00:00',
  grace_period_hours INTEGER NOT NULL DEFAULT 2,
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.senior_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_settings ENABLE ROW LEVEL SECURITY;

-- Security definer function to check role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to get user role from profiles
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Caregivers can view seniors' profiles they are connected to
CREATE POLICY "Caregivers can view connected senior profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.senior_connections
      WHERE caregiver_id = auth.uid() AND senior_id = profiles.user_id
    )
  );

-- User roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own roles" ON public.user_roles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Senior connections policies
CREATE POLICY "Caregivers can view their connections" ON public.senior_connections
  FOR SELECT USING (auth.uid() = caregiver_id OR auth.uid() = senior_id);

CREATE POLICY "Caregivers can create connections" ON public.senior_connections
  FOR INSERT WITH CHECK (auth.uid() = caregiver_id);

CREATE POLICY "Users can update their connections" ON public.senior_connections
  FOR UPDATE USING (auth.uid() = caregiver_id OR auth.uid() = senior_id);

-- Daily check-ins policies
CREATE POLICY "Seniors can view own check-ins" ON public.daily_check_ins
  FOR SELECT USING (auth.uid() = senior_id);

CREATE POLICY "Seniors can insert own check-ins" ON public.daily_check_ins
  FOR INSERT WITH CHECK (auth.uid() = senior_id);

-- Caregivers can view check-ins of connected seniors
CREATE POLICY "Caregivers can view connected seniors check-ins" ON public.daily_check_ins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.senior_connections
      WHERE caregiver_id = auth.uid() AND senior_id = daily_check_ins.senior_id
    )
  );

-- Reminder settings policies
CREATE POLICY "Seniors can manage own reminder settings" ON public.reminder_settings
  FOR ALL USING (auth.uid() = senior_id)
  WITH CHECK (auth.uid() = senior_id);

CREATE POLICY "Caregivers can view reminder settings of connected seniors" ON public.reminder_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.senior_connections
      WHERE caregiver_id = auth.uid() AND senior_id = reminder_settings.senior_id
    )
  );

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reminder_settings_updated_at
  BEFORE UPDATE ON public.reminder_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
