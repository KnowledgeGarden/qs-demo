-- Deploy sensecraft:conversation_node to pg
-- requires: quests
-- requires: guilds
-- requires: role

BEGIN;

CREATE SEQUENCE IF NOT EXISTS public.conversation_node_id_seq
    AS INTEGER
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE IF NOT EXISTS public.conversation_node (
    id INTEGER NOT NULL DEFAULT nextval('public.conversation_node_id_seq'::regclass),
    quest_id INTEGER,
    guild_id INTEGER,
    creator_id INTEGER NOT NULL,
    parent_id INTEGER,
    ancestry ltree NOT NULL,
    node_type public.ibis_node_type NOT NULL,
    status public.publication_state DEFAULT 'private_draft'::public.publication_state NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    published_at timestamp with time zone,
    title varchar(255) NOT NULL,
    description text,
    meta meta_state DEFAULT 'conversation'::meta_state NOT NULL,
    url varchar(255),
    draft_for_role_id INTEGER,
    CONSTRAINT conversation_node_pkey PRIMARY KEY (id),
    CONSTRAINT conversation_node_creator_id_fkey FOREIGN KEY (creator_id)
      REFERENCES public.members(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT conversation_node_parent_id_fkey FOREIGN KEY (parent_id)
      REFERENCES public.conversation_node(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT conversation_node_quest_id_fkey FOREIGN KEY (quest_id)
      REFERENCES public.quests(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT conversation_node_draft_for_role_id_fkey FOREIGN KEY (draft_for_role_id)
      REFERENCES public.role(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT conversation_node_guild_id_fkey FOREIGN KEY (guild_id)
      REFERENCES public.guilds(id) ON UPDATE CASCADE ON DELETE CASCADE
);

ALTER SEQUENCE public.conversation_node_id_seq OWNED BY public.conversation_node.id;

COMMIT;
