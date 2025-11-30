-- Financial Dashboard Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    partner_id UUID REFERENCES public.profiles(id),
    gmail_connected BOOLEAN DEFAULT FALSE,
    gmail_refresh_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#6366f1',
    icon TEXT,
    user_id UUID REFERENCES public.profiles(id),  -- NULL = shared/default category
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO public.categories (name, color, icon) VALUES
    ('Food & Dining', '#ef4444', 'utensils'),
    ('Transportation', '#f97316', 'car'),
    ('Shopping', '#eab308', 'shopping-bag'),
    ('Entertainment', '#22c55e', 'film'),
    ('Bills & Utilities', '#3b82f6', 'file-text'),
    ('Healthcare', '#ec4899', 'heart'),
    ('Travel', '#8b5cf6', 'plane'),
    ('Groceries', '#14b8a6', 'shopping-cart'),
    ('Subscriptions', '#6366f1', 'repeat'),
    ('Other', '#64748b', 'more-horizontal')
ON CONFLICT DO NOTHING;

-- Expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    description TEXT NOT NULL,
    category_id UUID REFERENCES public.categories(id),
    merchant TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    source TEXT DEFAULT 'manual' CHECK (source IN ('gmail', 'manual')),
    email_id TEXT,  -- Gmail message ID if from email
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partner invites table
CREATE TABLE IF NOT EXISTS public.partner_invites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    inviter_id UUID REFERENCES public.profiles(id) NOT NULL,
    invitee_email TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_invites ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own profile and their partner's
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR auth.uid() = partner_id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Expenses: users can manage their own, view partner's
CREATE POLICY "Users can view own expenses" ON public.expenses
    FOR SELECT USING (
        auth.uid() = user_id OR
        auth.uid() IN (SELECT partner_id FROM public.profiles WHERE id = user_id)
    );

CREATE POLICY "Users can insert own expenses" ON public.expenses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses" ON public.expenses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses" ON public.expenses
    FOR DELETE USING (auth.uid() = user_id);

-- Categories: anyone can read default categories, users manage their own
CREATE POLICY "Anyone can view default categories" ON public.categories
    FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can manage own categories" ON public.categories
    FOR ALL USING (auth.uid() = user_id);

-- Partner invites
CREATE POLICY "Users can view their invites" ON public.partner_invites
    FOR SELECT USING (auth.uid() = inviter_id OR invitee_email = (SELECT email FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create invites" ON public.partner_invites
    FOR INSERT WITH CHECK (auth.uid() = inviter_id);

-- Functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category_id);
