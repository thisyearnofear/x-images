-- Create the gallery_images table
create table if not exists gallery_images (
  id uuid default uuid_generate_v4() primary key,
  image_url text not null,
  attribution text,
  timestamp timestamptz default now(),
  dimensions jsonb
);

-- Enable RLS on the table
alter table gallery_images enable row level security;

-- Create policies for gallery_images
create policy "Public Access"
on gallery_images for select
to public
using (true);

create policy "Public Insert"
on gallery_images for insert
to public
with check (true);

-- Create storage bucket
insert into storage.buckets (id, name, public)
values ('tweet-images', 'tweet-images', true)
on conflict (id) do nothing;

-- Drop existing policies if they exist
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Allow uploads" on storage.objects;

-- Create new storage policies
create policy "Public Access"
on storage.objects for select
to public
using (bucket_id = 'tweet-images');

create policy "Allow uploads"
on storage.objects for insert
to public
with check (bucket_id = 'tweet-images');

-- Update bucket settings
update storage.buckets
set public = true,
    file_size_limit = 5242880, -- 5MB
    allowed_mime_types = array['image/png', 'image/jpeg', 'image/gif']
where id = 'tweet-images'; 