-- Deploy sensecraft:casting_functions to pg
-- requires: casting

BEGIN;

\set dbo :dbn '__owner';
\set dbm :dbn '__member';
\set dbc :dbn '__client';

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.casting TO :dbm;
GRANT SELECT ON TABLE public.casting TO :dbc;

CREATE OR REPLACE FUNCTION public.register_all_members(questid INTEGER, guildid INTEGER) RETURNS void 
LANGUAGE plpgsql AS
$$
BEGIN
  IF (SELECT COUNT(*) FROM public.game_play WHERE quest_id = questid AND guild_id = guildid AND status='confirmed') > 0 THEN 
    INSERT INTO public.casting (member_id, quest_id, guild_id, permissions, roles) (
      SELECT member_id, questid, guildid, ARRAY[]::permission[], available_roles FROM public.guild_membership
      WHERE guild_id = guildid AND status='confirmed') ON CONFLICT DO NOTHING;
  END IF;
END$$;

ALTER TABLE public.casting ENABLE ROW LEVEL SECURITY;

CREATE POLICY casting_delete_policy ON public.casting FOR DELETE USING ((public.is_quest_id_member(quest_id) OR public.has_guild_permission(guild_id, 'joinQuest'::public.permission)));
CREATE POLICY casting_insert_policy ON public.casting FOR INSERT WITH CHECK (
  ((member_id = current_member_id() AND public.is_guild_id_member(guild_id)) OR public.is_guild_id_leader(guild_id))
  AND (SELECT COUNT(*) FROM public.game_play WHERE quest_id = quest_id AND guild_id = guild_id AND status='confirmed') > 0);
CREATE POLICY casting_select_policy ON public.casting FOR SELECT USING (((( SELECT guilds.public
   FROM public.guilds
  WHERE (guilds.id = casting.guild_id)) AND ( SELECT quests.public
   FROM public.quests
  WHERE (quests.id = casting.quest_id))) OR public.is_guild_id_member(guild_id) OR public.is_quest_id_member(quest_id)));
CREATE POLICY casting_update_policy ON public.casting FOR UPDATE USING (
  (member_id = current_member_id() AND public.is_guild_id_member(guild_id)) OR public.is_guild_id_leader(guild_id));

COMMIT;