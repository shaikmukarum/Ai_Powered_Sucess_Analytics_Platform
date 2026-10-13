-- Creates the principal and faculty logins (already email-confirmed) and their access profiles.
-- Safe to run again: existing users are kept, their role/department are refreshed.
create extension if not exists pgcrypto;

do $$
declare
  r record;
  uid uuid;
begin
  for r in select * from (values
    ('principal@campus.edu', 'Principal', 'All departments', 'Principal@123'),
    ('cse.faculty1@campus.edu', 'Faculty', 'CSE', 'Faculty@123'),
    ('cse.faculty2@campus.edu', 'Faculty', 'CSE', 'Faculty@123'),
    ('cse.faculty3@campus.edu', 'Faculty', 'CSE', 'Faculty@123'),
    ('ece.faculty1@campus.edu', 'Faculty', 'ECE', 'Faculty@123'),
    ('ece.faculty2@campus.edu', 'Faculty', 'ECE', 'Faculty@123'),
    ('ece.faculty3@campus.edu', 'Faculty', 'ECE', 'Faculty@123'),
    ('mech.faculty1@campus.edu', 'Faculty', 'MECH', 'Faculty@123'),
    ('mech.faculty2@campus.edu', 'Faculty', 'MECH', 'Faculty@123'),
    ('mech.faculty3@campus.edu', 'Faculty', 'MECH', 'Faculty@123'),
    ('civil.faculty1@campus.edu', 'Faculty', 'CIVIL', 'Faculty@123'),
    ('civil.faculty2@campus.edu', 'Faculty', 'CIVIL', 'Faculty@123'),
    ('civil.faculty3@campus.edu', 'Faculty', 'CIVIL', 'Faculty@123'),
    ('it.faculty1@campus.edu', 'Faculty', 'IT', 'Faculty@123'),
    ('it.faculty2@campus.edu', 'Faculty', 'IT', 'Faculty@123'),
    ('it.faculty3@campus.edu', 'Faculty', 'IT', 'Faculty@123')
  ) as t(email, role, dept, pw)
  loop
    select id into uid from auth.users where email = r.email;
    if uid is null then
      uid := gen_random_uuid();
      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new, email_change,
        email_change_token_current, phone_change, phone_change_token, reauthentication_token
      ) values (
        '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', r.email,
        crypt(r.pw, gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(),
        '', '', '', '', '', '', '', ''
      );
      insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
      values (gen_random_uuid(), uid, uid::text,
              jsonb_build_object('sub', uid::text, 'email', r.email, 'email_verified', true),
              'email', now(), now(), now());
    end if;

    insert into public.user_profiles (id, user_id, email, role, department)
    values (gen_random_uuid()::text, uid::text, r.email, r.role, r.dept)
    on conflict (user_id) do update set role = excluded.role, department = excluded.department, email = excluded.email;
  end loop;
end $$;

select email, role, department from public.user_profiles order by role, department, email;
