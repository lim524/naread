-- Apply after 001 and 002. Existing records are preserved.
-- Points expire daily: 50 at Korean midnight, individual 10, AI synthesis 50.
create table if not exists public.daily_point_balances (
 owner_key text not null, date date not null,
 allowance integer not null default 50 check(allowance in (0,50)),
 spent integer not null default 0 check(spent>=0),
 primary key(owner_key,date)
);
create table if not exists public.point_ledger (
 id uuid primary key default gen_random_uuid(), owner_key text not null, date date not null,
 delta integer not null, reason text not null, reference_id uuid, created_at timestamptz not null default now()
);
create unique index if not exists point_ledger_reference on public.point_ledger(reason,reference_id) where reference_id is not null;
create unique index if not exists point_ledger_daily on public.point_ledger(owner_key,date,reason) where reason in ('daily_grant','legacy_usage');
create table if not exists public.guest_point_claims (
 id uuid primary key default gen_random_uuid(), guest_id uuid not null, user_id uuid not null references auth.users on delete cascade,
 date date not null, unique(guest_id,date)
);
alter table public.daily_point_balances enable row level security;
alter table public.point_ledger enable row level security;
alter table public.guest_point_claims enable row level security;
alter table public.ai_usage_logs add column if not exists points_reserved integer not null default 0 check(points_reserved>=0);
alter table public.ai_usage_logs add column if not exists points_owner_key text;

-- Convert legacy usage at 10 points per former analysis, without granting again.
insert into daily_point_balances(owner_key,date,spent)
 select owner_key,date,count*10 from daily_usage_limits on conflict do nothing;
insert into point_ledger(owner_key,date,delta,reason)
 select owner_key,date,50,'daily_grant' from daily_point_balances where allowance=50 on conflict do nothing;
insert into point_ledger(owner_key,date,delta,reason)
 select owner_key,date,-count*10,'legacy_usage' from daily_usage_limits where count>0 on conflict do nothing;
update ai_usage_logs set points_reserved=10,points_owner_key=owner_key where status='pending' and feature<>'fortune' and points_owner_key is null;

create or replace function public.ensure_daily_points(p_owner text,p_date date) returns void language plpgsql security definer set search_path=public as $$
declare v_allowance integer:=50;
begin
 if p_owner like 'guest:%' and exists(select 1 from guest_point_claims where 'guest:'||guest_id=p_owner and date=p_date) then v_allowance:=0; end if;
 insert into daily_point_balances(owner_key,date,allowance) values(p_owner,p_date,v_allowance) on conflict do nothing;
 insert into point_ledger(owner_key,date,delta,reason) select owner_key,date,50,'daily_grant' from daily_point_balances where owner_key=p_owner and date=p_date and allowance=50 on conflict do nothing;
end $$;

create or replace function public.get_point_balance(p_owner text,p_date date) returns jsonb language plpgsql security definer set search_path=public as $$
declare v daily_point_balances; v_expired uuid;
begin
 perform pg_advisory_xact_lock(hashtext('nailgi-ai-budget'));
 for v_expired in update ai_usage_logs set status='failed',finished_at=now() where status='pending' and (owner_key=p_owner or points_owner_key=p_owner) and created_at<now()-interval '4 minutes' returning id loop perform refund_analysis_points(v_expired); end loop;
 perform ensure_daily_points(p_owner,p_date);
 select * into v from daily_point_balances where owner_key=p_owner and date=p_date;
 return jsonb_build_object('balance',greatest(0,v.allowance-v.spent),'dailyAllowance',50,'individualCost',10,'comprehensiveCost',50);
end $$;

create or replace function public.charge_analysis_points(p_owner text,p_date date,p_cost integer,p_reference uuid) returns void language plpgsql security definer set search_path=public as $$
declare v daily_point_balances;
begin
 if p_cost not in (10,50) or p_reference is null then raise exception '포인트 차감 정보를 확인해 주세요.'; end if;
 perform ensure_daily_points(p_owner,p_date);
 select * into v from daily_point_balances where owner_key=p_owner and date=p_date for update;
 if exists(select 1 from point_ledger where reason='analysis_charge' and reference_id=p_reference) then return; end if;
 if v.allowance-v.spent<p_cost then raise exception '포인트가 부족합니다. 필요한 포인트: %P, 남은 포인트: %P. 매일 한국 시간 자정에 50P로 갱신됩니다.',p_cost,greatest(0,v.allowance-v.spent); end if;
 update daily_point_balances set spent=spent+p_cost where owner_key=p_owner and date=p_date;
 insert into point_ledger(owner_key,date,delta,reason,reference_id) values(p_owner,p_date,-p_cost,'analysis_charge',p_reference);
end $$;

create or replace function public.refund_analysis_points(p_request uuid) returns void language plpgsql security definer set search_path=public as $$
declare v ai_usage_logs; v_refund uuid;
begin
 select * into v from ai_usage_logs where id=p_request for update;
 if v.id is null or v.points_reserved<=0 or v.points_owner_key is null then return; end if;
 insert into point_ledger(owner_key,date,delta,reason,reference_id) values(v.points_owner_key,v.date,v.points_reserved,'analysis_refund',v.id) on conflict do nothing returning id into v_refund;
 if v_refund is not null then update daily_point_balances set spent=greatest(0,spent-v.points_reserved) where owner_key=v.points_owner_key and date=v.date; end if;
end $$;

create or replace function public.reserve_ai(p_owner text,p_feature text,p_date date,p_reserve numeric,p_budget numeric) returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid; v_count integer; v_total numeric; v_expired uuid; v_cost integer;
begin
 perform pg_advisory_xact_lock(hashtext('nailgi-ai-budget'));
 if p_feature not in ('saju','mbti','dream','comprehensive','fortune') then raise exception '잘못된 분석 종류입니다.'; end if;
 if p_reserve is null or p_budget is null or p_reserve<=0 or p_budget<=0 then raise exception 'AI 예산 설정을 확인해 주세요.'; end if;
 delete from request_events where created_at<now()-interval '1 day';
 select count(*) into v_count from request_events where created_at>now()-interval '1 minute';
 if v_count>=100 then raise exception '전체 요청이 많습니다. 잠시 후 다시 시도해 주세요.'; end if;
 select count(*) into v_count from request_events where owner_key=p_owner and created_at>now()-interval '1 minute';
 if v_count>=20 then raise exception '요청이 많습니다. 1분 후 다시 시도해 주세요.'; end if;
 insert into request_events(owner_key) values(p_owner);
 for v_expired in update ai_usage_logs set status='failed',finished_at=now() where status='pending' and created_at<now()-interval '4 minutes' returning id loop perform refund_analysis_points(v_expired); end loop;
 if exists(select 1 from ai_usage_logs where (owner_key=p_owner or points_owner_key=p_owner) and status='pending' and (p_feature<>'fortune' or (feature='fortune' and date=p_date))) then raise exception '분석이 진행 중입니다. 잠시 후 다시 확인해 주세요.'; end if;
 if p_feature='fortune' and exists(select 1 from daily_fortunes where user_id=replace(p_owner,'user:','')::uuid and date=p_date) then return null; end if;
 select coalesce(sum(reserved_usd),0) into v_total from ai_usage_logs where created_at>=date_trunc('month',now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul';
 if v_total+p_reserve>p_budget then raise exception '이번 달 AI 이용 예산에 도달했습니다. 저장된 결과는 계속 확인할 수 있습니다.'; end if;
 v_cost:=case when p_feature='fortune' then 0 when p_feature='comprehensive' then 50 else 10 end;
 insert into ai_usage_logs(owner_key,feature,date,reserved_usd,points_reserved,points_owner_key) values(p_owner,p_feature,p_date,p_reserve,v_cost,p_owner) returning id into v_id;
 if v_cost>0 then perform charge_analysis_points(p_owner,p_date,v_cost,v_id); end if;
 return v_id;
end $$;

create or replace function public.fail_ai(p_id uuid) returns void language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
 perform pg_advisory_xact_lock(hashtext('nailgi-ai-budget'));
 update ai_usage_logs set status='failed',finished_at=now() where id=p_id and status='pending' returning id into v_id;
 if v_id is not null then perform refund_analysis_points(v_id); end if;
end $$;

create or replace function public.save_dataset_reading(p_owner text,p_user uuid,p_guest uuid,p_kind text,p_date date,p_input jsonb,p_result jsonb,p_profile jsonb) returns uuid language plpgsql security definer set search_path=public as $$
declare v_count integer; v_id uuid;
begin
 if p_kind not in ('saju','mbti','dream','comprehensive') then raise exception '잘못된 분석 종류입니다.'; end if;
 if (p_user is null)=(p_guest is null) then raise exception '결과 소유자를 확인해 주세요.'; end if;
 if p_owner is distinct from (case when p_user is not null then 'user:'||p_user else 'guest:'||p_guest end) then raise exception '결과 소유자가 일치하지 않습니다.'; end if;
 perform pg_advisory_xact_lock(hashtext('nailgi-ai-budget'));
 select count(*) into v_count from request_events where owner_key=p_owner and created_at>now()-interval '1 minute';
 if v_count>=20 then raise exception '요청이 많습니다. 1분 후 다시 시도해 주세요.'; end if;
 insert into request_events(owner_key) values(p_owner);
 insert into analysis_results(user_id,guest_id,kind,input,result) values(p_user,p_guest,p_kind,p_input,p_result) returning id into v_id;
 -- A single available component in the comprehensive wizard is a 10P partial result.
 perform charge_analysis_points(p_owner,p_date,10,v_id);
 if p_kind='comprehensive' and p_user is not null then insert into comprehensive_profiles(user_id,profile) values(p_user,p_profile) on conflict(user_id) do update set profile=excluded.profile,updated_at=now(); end if;
 return v_id;
end $$;

create or replace function public.claim_guest(p_user uuid,p_guest uuid,p_date date) returns void language plpgsql security definer set search_path=public as $$
declare v_profile jsonb; v_claim uuid; v_guest daily_point_balances;
begin
 perform pg_advisory_xact_lock(hashtext('nailgi-ai-budget'));
 update analysis_results set user_id=p_user,guest_id=null where guest_id=p_guest and user_id is null;
 select jsonb_build_object('input',input,'reading',result) into v_profile from analysis_results where user_id=p_user and kind='comprehensive' order by created_at desc limit 1;
 if v_profile is not null then insert into comprehensive_profiles(user_id,profile) values(p_user,v_profile) on conflict(user_id) do nothing; end if;
 insert into guest_point_claims(guest_id,user_id,date) values(p_guest,p_user,p_date) on conflict do nothing returning id into v_claim;
 if v_claim is not null then
  perform ensure_daily_points('user:'||p_user,p_date);
  select * into v_guest from daily_point_balances where owner_key='guest:'||p_guest and date=p_date for update;
  if v_guest.owner_key is not null then
   update daily_point_balances set spent=spent+v_guest.spent where owner_key='user:'||p_user and date=p_date;
   insert into point_ledger(owner_key,date,delta,reason,reference_id) values('user:'||p_user,p_date,-v_guest.spent,'guest_transfer_in',v_claim),('guest:'||p_guest,p_date,v_guest.spent-v_guest.allowance,'guest_transfer_out',v_claim);
   update daily_point_balances set allowance=0,spent=0 where owner_key='guest:'||p_guest and date=p_date;
  else
   insert into daily_point_balances(owner_key,date,allowance) values('guest:'||p_guest,p_date,0) on conflict do nothing;
  end if;
  update ai_usage_logs set points_owner_key='user:'||p_user where points_owner_key='guest:'||p_guest and date=p_date;
 end if;
end $$;

create or replace function public.cleanup_deleted_user_points() returns trigger language plpgsql security definer set search_path=public as $$
begin
 delete from daily_point_balances where owner_key='user:'||old.id;
 delete from point_ledger where owner_key='user:'||old.id;
 update ai_usage_logs set points_owner_key='deleted' where points_owner_key='user:'||old.id;
 return old;
end $$;
create trigger nailgi_points_account_cleanup before delete on auth.users for each row execute function public.cleanup_deleted_user_points();

revoke all on function public.ensure_daily_points(text,date),public.get_point_balance(text,date),public.charge_analysis_points(text,date,integer,uuid),public.refund_analysis_points(uuid),public.cleanup_deleted_user_points() from public,anon,authenticated;
grant execute on function public.ensure_daily_points(text,date),public.get_point_balance(text,date),public.charge_analysis_points(text,date,integer,uuid),public.refund_analysis_points(uuid) to service_role;
-- Existing replaced functions retain their service-role-only grants.
