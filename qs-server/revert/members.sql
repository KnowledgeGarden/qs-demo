-- Revert sensecraft:members from pg

BEGIN;

-- delete to delete users
DELETE FROM members;

DROP POLICY IF EXISTS members_update_policy ON public.members;
DROP POLICY IF EXISTS members_delete_policy ON public.members;
DROP POLICY IF EXISTS members_select_policy ON public.members;
DROP POLICY IF EXISTS members_insert_policy ON public.members;
DROP TRIGGER IF EXISTS before_update_member ON public.members;
DROP FUNCTION IF EXISTS  public.before_update_member();
DROP TRIGGER IF EXISTS after_delete_member ON public.members;
DROP FUNCTION IF EXISTS  public.after_delete_member();
DROP TRIGGER IF EXISTS before_create_member ON public.members;
DROP FUNCTION IF EXISTS  public.before_create_member();

DROP FUNCTION IF EXISTS  public.get_token(mail character varying, pass character varying);
DROP FUNCTION IF EXISTS  public.renew_token(token character varying);
DROP FUNCTION IF EXISTS  public.scmember_handle();
DROP FUNCTION IF EXISTS  public.role_to_handle(role character varying);
DROP FUNCTION IF EXISTS  public.has_permission(permission character varying);
DROP FUNCTION IF EXISTS  public.current_member_id();

ALTER TABLE IF EXISTS ONLY public.members DROP CONSTRAINT IF EXISTS members_pkey;
ALTER TABLE IF EXISTS ONLY public.members DROP CONSTRAINT IF EXISTS members_handle_key;
ALTER TABLE IF EXISTS ONLY public.members DROP CONSTRAINT IF EXISTS members_email_key;
ALTER TABLE IF EXISTS public.members ALTER COLUMN id DROP DEFAULT;
DROP TABLE IF EXISTS public.members;

COMMIT;