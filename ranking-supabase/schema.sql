-- SUMMER SONIC 2026 見たいアーティストランキング
-- Supabase Dashboard > SQL Editor で、このファイル全体を一度だけ実行します。

create schema if not exists private;
create extension if not exists pgcrypto with schema extensions;

create table if not exists private.ranking_artists (
  artist_id text primary key,
  name text not null,
  stage text not null,
  start_time text not null,
  end_time text not null
);

create table if not exists private.ranking_votes (
  device_hash text not null,
  artist_id text not null references private.ranking_artists(artist_id) on delete cascade,
  level smallint not null check (level between 1 and 3),
  updated_at timestamptz not null default now(),
  primary key (device_hash, artist_id)
);

create index if not exists ranking_votes_artist_id_idx
  on private.ranking_votes (artist_id);

alter table private.ranking_artists enable row level security;
alter table private.ranking_votes enable row level security;

revoke all on schema private from public, anon, authenticated;
revoke all on all tables in schema private from public, anon, authenticated;

insert into private.ranking_artists (artist_id,name,stage,start_time,end_time) values
  ('0-11:05-HANA','HANA','MARINE STAGE','11:05','11:45'),
  ('0-12:25-DESTIN CONRAD','DESTIN CONRAD','MARINE STAGE','12:25','13:05'),
  ('0-13:50-BE:FIRST','BE:FIRST','MARINE STAGE','13:50','14:40'),
  ('0-15:25-mgk','mgk','MARINE STAGE','15:25','16:25'),
  ('0-17:25-ALEX WARREN','ALEX WARREN','MARINE STAGE','17:25','18:25'),
  ('0-19:25-Ado','Ado','MARINE STAGE','19:25','20:55'),
  ('1-12:30-紫 今','紫 今','BEACH STAGE','12:30','13:00'),
  ('1-13:30-のん & the tears of knight','のん & the tears of knight','BEACH STAGE','13:30','14:00'),
  ('1-14:30-阿部真央','阿部真央','BEACH STAGE','14:30','15:00'),
  ('1-15:30-Kvi Baba','Kvi Baba','BEACH STAGE','15:30','16:10'),
  ('1-16:40-SIRUP','SIRUP','BEACH STAGE','16:40','17:20'),
  ('1-17:50-PALOMA MORPHY','PALOMA MORPHY','BEACH STAGE','17:50','18:30'),
  ('1-19:00-LATIN MAFIA','LATIN MAFIA','BEACH STAGE','19:00','19:50'),
  ('1-20:30-CARÍN LEÓN','CARÍN LEÓN','BEACH STAGE','20:30','21:30'),
  ('2-11:40-GOOD NEIGHBOURS','GOOD NEIGHBOURS','MOUNTAIN STAGE','11:40','12:10'),
  ('2-12:40-VIAGRA BOYS','VIAGRA BOYS','MOUNTAIN STAGE','12:40','13:30'),
  ('2-14:00-JON SPENCER','JON SPENCER','MOUNTAIN STAGE','14:00','14:50'),
  ('2-15:20-羊文学','羊文学','MOUNTAIN STAGE','15:20','16:10'),
  ('2-16:50-SUEDE','SUEDE','MOUNTAIN STAGE','16:50','17:40'),
  ('2-18:30-サカナクション','サカナクション','MOUNTAIN STAGE','18:30','19:40'),
  ('2-20:40-DAVID BYRNE','DAVID BYRNE','MOUNTAIN STAGE','20:40','22:00'),
  ('3-10:30-WOOS','WOOS','SONIC STAGE','10:30','10:50'),
  ('3-11:20-THE GUEST LIST','THE GUEST LIST','SONIC STAGE','11:20','11:50'),
  ('3-12:20-FATHER OF PEACE','FATHER OF PEACE','SONIC STAGE','12:20','13:00'),
  ('3-13:30-PRETTY BLEAK','PRETTY BLEAK','SONIC STAGE','13:30','14:10'),
  ('3-14:40-Saucy Dog','Saucy Dog','SONIC STAGE','14:40','15:20'),
  ('3-15:50-ELMIENE','ELMIENE','SONIC STAGE','15:50','16:35'),
  ('3-17:10-Cornelius','Cornelius','SONIC STAGE','17:10','18:00'),
  ('3-18:40-電気グルーヴ','電気グルーヴ','SONIC STAGE','18:40','19:30'),
  ('3-20:10-STEVE LACY','STEVE LACY','SONIC STAGE','20:10','21:10'),
  ('4-10:15-Iga Nana','Iga Nana','Spotify Stage','10:15','10:35'),
  ('4-10:55-Liza','Liza','Spotify Stage','10:55','11:20'),
  ('4-11:45-Litty','Litty','Spotify Stage','11:45','12:15'),
  ('4-12:45-さらさ (Band Set)','さらさ (Band Set)','Spotify Stage','12:45','13:15'),
  ('4-13:45-OddRe:','OddRe:','Spotify Stage','13:45','14:15'),
  ('4-14:50-luv','luv','Spotify Stage','14:50','15:20'),
  ('4-15:40-7','7','Spotify Stage','15:40','16:05'),
  ('4-16:05-MIKADO','MIKADO','Spotify Stage','16:05','16:30'),
  ('4-16:30-Kohjiya','Kohjiya','Spotify Stage','16:30','17:01'),
  ('4-17:10-FULLHOUSE','FULLHOUSE','Spotify Stage','17:10','17:50'),
  ('4-18:30-Dungeoneering','Dungeoneering','Spotify Stage','18:30','19:10'),
  ('4-19:55-パソコン音楽クラブ','パソコン音楽クラブ','Spotify Stage','19:55','20:35'),
  ('4-21:25-Verses GT','Verses GT','Spotify Stage','21:25','22:15'),
  ('5-10:35-KOMOREBI','KOMOREBI','PACIFIC STAGE','10:35','10:55'),
  ('5-11:20-板歯目','板歯目','PACIFIC STAGE','11:20','11:45'),
  ('5-12:15-花冷え。','花冷え。','PACIFIC STAGE','12:15','12:45'),
  ('5-13:15-Paledusk','Paledusk','PACIFIC STAGE','13:15','13:45'),
  ('5-14:10-中島健人','中島健人','PACIFIC STAGE','14:10','14:50'),
  ('5-15:20-MIDNIGHT TIL MORNING','MIDNIGHT TIL MORNING','PACIFIC STAGE','15:20','16:00'),
  ('5-16:30-HOMBE','HOMBE','PACIFIC STAGE','16:30','17:10'),
  ('5-17:50-SB19','SB19','PACIFIC STAGE','17:50','18:30'),
  ('5-19:10-GENERATIONS','GENERATIONS','PACIFIC STAGE','19:10','19:55'),
  ('5-20:45-MAZZEL','MAZZEL','PACIFIC STAGE','20:45','21:35')
on conflict (artist_id) do update set
  name=excluded.name,
  stage=excluded.stage,
  start_time=excluded.start_time,
  end_time=excluded.end_time;

create or replace function public.sync_ranking_selections(
  p_device_id text,
  p_selections jsonb
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_device_hash text;
  v_now timestamptz := statement_timestamp();
  v_changed integer := 0;
begin
  if p_device_id is null or p_device_id !~ '^[A-Za-z0-9-]{16,128}$' then
    raise exception using errcode='22023', message='Invalid device identifier.';
  end if;
  if p_selections is null or jsonb_typeof(p_selections) <> 'array' then
    raise exception using errcode='22023', message='Invalid selections.';
  end if;
  if jsonb_array_length(p_selections) > 53 or octet_length(p_selections::text) > 30000 then
    raise exception using errcode='22023', message='Too many selections.';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(p_selections) as e(value)
    left join private.ranking_artists a on a.artist_id=e.value->>'artistId'
    where jsonb_typeof(e.value) is distinct from 'object'
       or jsonb_typeof(e.value->'artistId') is distinct from 'string'
       or not coalesce((e.value->>'level') ~ '^[1-3]$',false)
       or a.artist_id is null
  ) then
    raise exception using errcode='22023', message='Unknown artist or invalid level.';
  end if;
  if (
    select count(*) <> count(distinct e.value->>'artistId')
    from jsonb_array_elements(p_selections) as e(value)
  ) then
    raise exception using errcode='22023', message='Duplicate artist.';
  end if;

  v_device_hash := encode(
    extensions.digest('summersonic2026-ranking-v1:'||p_device_id,'sha256'),
    'hex'
  );

  select count(*) into v_changed
  from (
    (
      select artist_id,level from private.ranking_votes where device_hash=v_device_hash
      except
      select e.value->>'artistId',(e.value->>'level')::smallint
      from jsonb_array_elements(p_selections) as e(value)
    )
    union all
    (
      select e.value->>'artistId',(e.value->>'level')::smallint
      from jsonb_array_elements(p_selections) as e(value)
      except
      select artist_id,level from private.ranking_votes where device_hash=v_device_hash
    )
  ) differences;

  delete from private.ranking_votes where device_hash=v_device_hash;
  insert into private.ranking_votes (device_hash,artist_id,level,updated_at)
  select v_device_hash,e.value->>'artistId',(e.value->>'level')::smallint,v_now
  from jsonb_array_elements(p_selections) as e(value);

  return jsonb_build_object('ok',true,'changed',v_changed,'syncedAt',v_now);
end;
$$;

create or replace function public.get_ranking()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with totals as (
    select
      a.artist_id,
      a.name,
      a.stage,
      a.start_time,
      a.end_time,
      sum(case v.level when 1 then 10 when 2 then 11 when 3 then 12 end)::bigint as points10,
      count(*)::bigint as voters,
      count(*) filter (where v.level=1)::bigint as normal,
      count(*) filter (where v.level=2)::bigint as gold,
      count(*) filter (where v.level=3)::bigint as rainbow,
      max(v.updated_at) as updated_at
    from private.ranking_votes v
    join private.ranking_artists a on a.artist_id=v.artist_id
    group by a.artist_id,a.name,a.stage,a.start_time,a.end_time
  )
  select jsonb_build_object(
    'rankings',coalesce(
      jsonb_agg(
        jsonb_build_object(
          'artistId',artist_id,
          'name',name,
          'stage',stage,
          'start',start_time,
          'end',end_time,
          'score',points10/10.0,
          'voters',voters,
          'normal',normal,
          'gold',gold,
          'rainbow',rainbow
        ) order by points10 desc,voters desc,artist_id asc
      ),
      '[]'::jsonb
    ),
    'updatedAt',max(updated_at),
    'weights',jsonb_build_object('normal',1,'gold',1.1,'rainbow',1.2)
  )
  from totals;
$$;

revoke all on function public.sync_ranking_selections(text,jsonb) from public;
revoke all on function public.get_ranking() from public;
grant execute on function public.sync_ranking_selections(text,jsonb) to anon,authenticated;
grant execute on function public.get_ranking() to anon,authenticated;
