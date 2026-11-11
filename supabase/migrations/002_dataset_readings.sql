-- Additive migration: dataset results share existing ownership, history, and quotas.
create or replace function public.save_dataset_reading(
 p_owner text,p_user uuid,p_guest uuid,p_kind text,p_date date,p_input jsonb,p_result jsonb,p_profile jsonb
) returns uuid language plpgsql security definer set search_path=public as $$
declare v_count integer; v_id uuid;
begin
 if p_kind not in ('saju','mbti','dream','comprehensive') then raise exception '잘못된 분석 종류입니다.'; end if;
 if (p_user is null)=(p_guest is null) then raise exception '결과 소유자를 확인해 주세요.'; end if;
 if p_owner is distinct from (case when p_user is not null then 'user:'||p_user else 'guest:'||p_guest end) then raise exception '결과 소유자가 일치하지 않습니다.'; end if;
 perform pg_advisory_xact_lock(hashtext('nailgi-ai-budget'));
 select count(*) into v_count from request_events where owner_key=p_owner and created_at>now()-interval '1 minute';
 if v_count>=20 then raise exception '요청이 많습니다. 1분 후 다시 시도해 주세요.'; end if;
 insert into daily_usage_limits(owner_key,date,count) values(p_owner,p_date,0) on conflict do nothing;
 select count into v_count from daily_usage_limits where owner_key=p_owner and date=p_date for update;
 if v_count>=5 then raise exception '오늘의 무료 분석 5회를 모두 이용했어요. 내일 다시 만나요.'; end if;
 insert into request_events(owner_key) values(p_owner);
 update daily_usage_limits set count=count+1 where owner_key=p_owner and date=p_date;
 insert into analysis_results(user_id,guest_id,kind,input,result) values(p_user,p_guest,p_kind,p_input,p_result) returning id into v_id;
 if p_kind='comprehensive' and p_user is not null then
  insert into comprehensive_profiles(user_id,profile) values(p_user,p_profile) on conflict(user_id) do update set profile=excluded.profile,updated_at=now();
 end if;
 return v_id;
end $$;
revoke all on function public.save_dataset_reading(text,uuid,uuid,text,date,jsonb,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.save_dataset_reading(text,uuid,uuid,text,date,jsonb,jsonb,jsonb) to service_role;

create or replace function public.save_dataset_fortune(p_user uuid,p_date date,p_result jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_result jsonb; v_count integer;
begin
 perform pg_advisory_xact_lock(hashtext('nailgi-ai-budget'));
 select result into v_result from daily_fortunes where user_id=p_user and date=p_date;
 if v_result is not null then return v_result; end if;
 if not exists(select 1 from comprehensive_profiles where user_id=p_user) then raise exception '종합 분석을 먼저 완료해 주세요.'; end if;
 select count(*) into v_count from request_events where owner_key='user:'||p_user and created_at>now()-interval '1 minute';
 if v_count>=20 then raise exception '요청이 많습니다. 1분 후 다시 시도해 주세요.'; end if;
 insert into request_events(owner_key) values('user:'||p_user);
 insert into daily_fortunes(user_id,date,result) values(p_user,p_date,p_result) on conflict do nothing;
 select result into v_result from daily_fortunes where user_id=p_user and date=p_date;
 return v_result;
end $$;
revoke all on function public.save_dataset_fortune(uuid,date,jsonb) from public,anon,authenticated;
grant execute on function public.save_dataset_fortune(uuid,date,jsonb) to service_role;
