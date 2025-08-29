-- Additional policies for roles/permissions and bootstrap admin flow

-- Read access
create policy if not exists "All can read roles" on public.roles for select using (true);
create policy if not exists "All can read permissions" on public.permissions for select using (true);
create policy if not exists "Authenticated can read user_roles" on public.user_roles for select using (auth.uid() is not null);
create policy if not exists "Authenticated can read role_permissions" on public.role_permissions for select using (auth.uid() is not null);

-- Allow admins to manage role assignments
create policy if not exists "Admins manage user_roles" on public.user_roles
  for all using (auth.uid() is not null and public.is_admin(auth.uid()))
  with check (auth.uid() is not null and public.is_admin(auth.uid()));

-- Bootstrap: if there is no admin yet, allow first authenticated user to become admin
create or replace function public.no_admin_exists()
returns boolean
language sql
stable
as $$
  select not exists (
    select 1 from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where r.name = 'admin'
  );
$$;

create policy if not exists "Bootstrap first admin" on public.user_roles
  for insert
  with check (
    auth.uid() is not null
    and public.no_admin_exists()
  );

-- Convenience: RPC to set current user as admin (client can call this once)
create or replace function public.grant_self_admin()
returns void
language plpgsql
security definer
as $$
declare
  admin_role_id uuid;
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;
  select id into admin_role_id from public.roles where name = 'admin';
  insert into public.user_roles (user_id, role_id)
  values (uid, admin_role_id)
  on conflict (user_id, role_id) do nothing;
end;
$$;

-- Helper to promote user by email as admin
create or replace function public.promote_admin_by_email(admin_email text)
returns void
language plpgsql
security definer
as $$
declare
  admin_role_id uuid;
  target_user_id uuid;
begin
  select id into admin_role_id from public.roles where name = 'admin';
  select id into target_user_id from auth.users where email = admin_email limit 1;
  if target_user_id is null then
    raise notice 'User with email % not found in auth.users', admin_email;
    return;
  end if;
  insert into public.user_roles (user_id, role_id)
  values (target_user_id, admin_role_id)
  on conflict (user_id, role_id) do nothing;
end;
$$;

-- Predicate for current user
create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
as $$
  select public.is_admin(auth.uid());
$$;

