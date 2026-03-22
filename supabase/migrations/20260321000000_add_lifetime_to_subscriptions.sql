-- Add lifetime column to subscriptions table for one-time lifetime deal purchases
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS lifetime boolean DEFAULT false;
