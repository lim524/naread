-- Additive schema. Run in a new Supabase project or review existing names before applying.
create extension if not exists pgcrypto;
create table if not exists public.user_profiles (id uuid primary key references auth.users on delete cascade, nickname text not null default '나', created_at timestamptz not null default now());
create table if not exists public.analysis_results (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users on delete cascade, guest_id uuid, kind text not null check(kind in ('saju','mbti','dream','comprehensive')), input jsonb not null, result jsonb not null, created_at timestamptz not null default now(), check(user_id is not null or guest_id is not null));
create table if not exists public.comprehensive_profiles (user_id uuid primary key references auth.users on delete cascade, profile jsonb not null, updated_at timestamptz not null default now());
create table if not exists public.daily_fortunes (user_id uuid references auth.users on delete cascade, date date not null, result jsonb not null, created_at timestamptz not null default now(), primary key(user_id,date));
create table if not exists public.daily_usage_limits (owner_key text not null, date date not null, count integer not null default 0 check(count between 0 and 5), primary key(owner_key,date));
create table if not exists public.ai_usage_logs (id uuid primary key default gen_random_uuid(), owner_key text not null, feature text not null, date date not null, status text not null default 'pending' check(status in ('pending','success','failed')), reserved_usd numeric not null, cost_usd numeric not null default 0, model text, input_tokens integer default 0, output_tokens integer default 0, created_at timestamptz not null default now(), finished_at timestamptz);
create index if not exists ai_logs_date on public.ai_usage_logs(created_at);
create table if not exists public.content_articles (slug text primary key, title text not null, description text not null, body text not null, category text not null, published boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.admin_settings (key text primary key, value jsonb not null);
create table if not exists public.request_events (owner_key text not null, created_at timestamptz not null default now());
create index if not exists request_events_owner on public.request_events(owner_key,created_at);

alter table public.user_profiles enable row level security;
alter table public.analysis_results enable row level security;
alter table public.comprehensive_profiles enable row level security;
alter table public.daily_fortunes enable row level security;
alter table public.daily_usage_limits enable row level security;
alter table public.ai_usage_logs enable row level security;
alter table public.content_articles enable row level security;
alter table public.admin_settings enable row level security;
alter table public.request_events enable row level security;
create policy profile_owner_read on public.user_profiles for select to authenticated using(auth.uid()=id);
create policy analysis_owner_read on public.analysis_results for select to authenticated using(auth.uid()=user_id);
create policy comprehensive_owner_read on public.comprehensive_profiles for select to authenticated using(auth.uid()=user_id);
create policy fortune_owner_read on public.daily_fortunes for select to authenticated using(auth.uid()=user_id);
create policy articles_public_read on public.content_articles for select using(published=true);
-- No client INSERT/UPDATE/DELETE policies. All mutations use verified server routes.

create or replace function public.reserve_ai(p_owner text,p_feature text,p_date date,p_reserve numeric,p_budget numeric) returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid; v_count integer; v_total numeric;
begin
 perform pg_advisory_xact_lock(hashtext('nailgi-ai-budget'));
 if p_reserve is null or p_budget is null or p_reserve<=0 or p_budget<=0 then raise exception 'AI 예산 설정을 확인해 주세요.'; end if;
 delete from request_events where created_at<now()-interval '1 day';
 select count(*) into v_count from request_events where created_at>now()-interval '1 minute';
 if v_count>=100 then raise exception '전체 요청이 많습니다. 잠시 후 다시 시도해 주세요.'; end if;
 select count(*) into v_count from request_events where owner_key=p_owner and created_at>now()-interval '1 minute';
 if v_count>=20 then raise exception '요청이 많습니다. 1분 후 다시 시도해 주세요.'; end if;
 insert into request_events(owner_key) values(p_owner);
 -- Expired attempts retain their cost reservation but restore free analysis quota.
 with expired as (update ai_usage_logs set status='failed',finished_at=now() where status='pending' and created_at<now()-interval '4 minutes' returning owner_key,date,feature)
 update daily_usage_limits d set count=greatest(0,d.count-e.n) from (select owner_key,date,count(*)::int n from expired where feature<>'fortune' group by owner_key,date) e where d.owner_key=e.owner_key and d.date=e.date;
 if exists(select 1 from ai_usage_logs where owner_key=p_owner and status='pending' and (p_feature<>'fortune' or (feature='fortune' and date=p_date))) then raise exception '분석이 진행 중입니다. 잠시 후 다시 확인해 주세요.'; end if;
 if p_feature='fortune' and exists(select 1 from daily_fortunes where user_id=replace(p_owner,'user:','')::uuid and date=p_date) then return null; end if;
 select coalesce(sum(reserved_usd),0) into v_total from ai_usage_logs where created_at>=date_trunc('month',now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul';
 if v_total+p_reserve>p_budget then raise exception '이번 달 AI 이용 예산에 도달했습니다. 저장된 결과는 계속 확인할 수 있습니다.'; end if;
 if p_feature<>'fortune' then
 insert into daily_usage_limits(owner_key,date,count) values(p_owner,p_date,0) on conflict do nothing;
 select count into v_count from daily_usage_limits where owner_key=p_owner and date=p_date for update;
 if v_count>=5 then raise exception '오늘의 무료 분석 5회를 모두 이용했어요. 내일 다시 만나요.'; end if;
 update daily_usage_limits set count=count+1 where owner_key=p_owner and date=p_date;
 end if;
 insert into ai_usage_logs(owner_key,feature,date,reserved_usd) values(p_owner,p_feature,p_date,p_reserve) returning id into v_id;
 return v_id;
end $$;

create or replace function public.fail_ai(p_id uuid) returns void language plpgsql security definer set search_path=public as $$
declare v ai_usage_logs;
begin
 update ai_usage_logs set status='failed',finished_at=now() where id=p_id and status='pending' returning * into v;
 if v.id is not null and v.feature<>'fortune' then update daily_usage_limits set count=greatest(0,count-1) where owner_key=v.owner_key and date=v.date; end if;
end $$;

create or replace function public.complete_ai(p_id uuid,p_user uuid,p_guest uuid,p_input jsonb,p_result jsonb,p_profile jsonb,p_model text,p_in integer,p_out integer,p_cost numeric) returns uuid language plpgsql security definer set search_path=public as $$
declare v ai_usage_logs; v_result uuid;
begin
 select * into v from ai_usage_logs where id=p_id for update;
 if v.id is null or v.status<>'pending' then raise exception '요청이 만료되었습니다. 다시 시도해 주세요.'; end if;
 if v.feature='fortune' then
 insert into daily_fortunes(user_id,date,result) values(p_user,v.date,p_result) on conflict do nothing;
 else
 insert into analysis_results(user_id,guest_id,kind,input,result) values(p_user,p_guest,v.feature,p_input,p_result) returning id into v_result;
 if v.feature='comprehensive' and p_user is not null then insert into comprehensive_profiles(user_id,profile) values(p_user,p_profile) on conflict(user_id) do update set profile=excluded.profile,updated_at=now(); end if;
 end if;
 update ai_usage_logs set status='success',model=p_model,input_tokens=p_in,output_tokens=p_out,cost_usd=p_cost,finished_at=now() where id=p_id;
 return v_result;
end $$;

create or replace function public.claim_guest(p_user uuid,p_guest uuid,p_date date) returns void language plpgsql security definer set search_path=public as $$
declare v_profile jsonb; v_guest_count integer;
begin
 perform pg_advisory_xact_lock(hashtext('nailgi-ai-budget'));
 update analysis_results set user_id=p_user,guest_id=null where guest_id=p_guest and user_id is null;
 select jsonb_build_object('input',input,'reading',result) into v_profile from analysis_results where user_id=p_user and kind='comprehensive' order by created_at desc limit 1;
 if v_profile is not null then insert into comprehensive_profiles(user_id,profile) values(p_user,v_profile) on conflict(user_id) do nothing; end if;
 select count into v_guest_count from daily_usage_limits where owner_key='guest:'||p_guest and date=p_date;
 if v_guest_count>0 then
 insert into daily_usage_limits(owner_key,date,count) values('user:'||p_user,p_date,least(5,v_guest_count)) on conflict(owner_key,date) do update set count=least(5,daily_usage_limits.count+excluded.count);
 update daily_usage_limits set count=0 where owner_key='guest:'||p_guest and date=p_date;
 end if;
end $$;

revoke all on function public.reserve_ai(text,text,date,numeric,numeric),public.fail_ai(uuid),public.complete_ai(uuid,uuid,uuid,jsonb,jsonb,jsonb,text,integer,integer,numeric),public.claim_guest(uuid,uuid,date) from public,anon,authenticated;
grant execute on function public.reserve_ai(text,text,date,numeric,numeric),public.fail_ai(uuid),public.complete_ai(uuid,uuid,uuid,jsonb,jsonb,jsonb,text,integer,integer,numeric),public.claim_guest(uuid,uuid,date) to service_role;

-- Auth account deletion and operational identifier cleanup are atomic.
create or replace function public.cleanup_deleted_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
 update ai_usage_logs set owner_key='deleted' where owner_key='user:'||old.id;
 delete from daily_usage_limits where owner_key='user:'||old.id;
 delete from request_events where owner_key='user:'||old.id;
 return old;
end $$;
revoke all on function public.cleanup_deleted_user() from public,anon,authenticated;
create trigger nailgi_account_cleanup before delete on auth.users for each row execute function public.cleanup_deleted_user();

create or replace function public.cleanup_reading_profile() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if old.kind='comprehensive' and old.user_id is not null then
 delete from comprehensive_profiles where user_id=old.user_id;
 end if;
 return old;
end $$;
revoke all on function public.cleanup_reading_profile() from public,anon,authenticated;
create trigger nailgi_reading_cleanup after delete on public.analysis_results for each row execute function public.cleanup_reading_profile();
