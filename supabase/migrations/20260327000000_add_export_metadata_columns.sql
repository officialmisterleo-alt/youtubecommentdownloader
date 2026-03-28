-- Add video metadata columns to exports table so the app's insert matches the schema.
-- The original schema had url/video_id but the app logs video_url/video_title/channel_name.
alter table public.exports
  add column if not exists video_url text,
  add column if not exists video_title text,
  add column if not exists channel_name text;
