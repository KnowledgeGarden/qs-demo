import { defineStore } from 'pinia';
import { filterKeys } from './baseStore';
import { AxiosResponse } from 'axios';
import {
  PublicMember,
  GuildMembership,
  QuestMembership,
  Casting,
  CastingRole,
  memberPatchKeys,
  Member,
} from '../types';
import { api } from '../boot/axios';
import { useGuildStore } from './guilds';
import { useQuestStore } from './quests';
import { useMemberStore } from './member';

interface MemberMap {
  [key: number]: PublicMember;
}
export interface MembersState {
  members: MemberMap;
  fullFetch: boolean;
  questFetch?: number;
  guildFetch?: number;
  fullMembers: { [key: number]: boolean };
}
const baseState: MembersState = {
  fullFetch: false,
  questFetch: undefined,
  guildFetch: undefined,
  members: {},
  fullMembers: {},
};

export const useMembersStore = defineStore('members', {
  state: () => baseState,
  getters: {
    getMembers: (state: MembersState): PublicMember[] =>
      Object.values(state.members).sort((a, b) =>
        a.handle.localeCompare(b.handle),
      ),
    getMemberById:
      (state: MembersState) =>
      (id: number): PublicMember => {
        const member = state.members[id];
        if (member) return member;
        const loggedIn = useMemberStore().member;
        // may also be in member
        if (loggedIn?.id == id) return loggedIn;
      },
    getMembersByIds: (state: MembersState) => (ids: number[]) =>
      ids.map((id) => state.members[id]),
    getMemberByHandle: (state: MembersState) => (handle: string) =>
      Object.values(state.members).find(
        (member: PublicMember) => member.handle == handle,
      ),
    getMembersByHandle: (state: MembersState) =>
      Object.fromEntries(
        Object.values(state.members).map((member: PublicMember) => [
          member.handle,
          member,
        ]),
      ),
    getMemberHandles: (state: MembersState) =>
      Object.values(state.members)
        .map((member: PublicMember) => member.handle)
        .sort(),
    getPlayersRoles: (state: MembersState) => (member_id: number) => {
      return state.members[member_id]?.casting_role;
    },
    getAvailableRolesByMemberId:
      (state: MembersState) => (member_id: number) => {
        return state.members[member_id]?.guild_member_available_role;
      },
    getAvailableRolesForMemberAndGuild:
      (state: MembersState) =>
      (member_id: number, guild_id: number | undefined) => {
        const roles =
          state.members[member_id]?.guild_member_available_role || [];
        return roles.filter((cr) => cr.guild_id == guild_id);
      },
    castingRolesPerQuest:
      (state: MembersState) => (member_id?: number, quest_id?: number) => {
        const castingRole: CastingRole[] = [];
        const rolesPerQuest: CastingRole[] | undefined =
          state.members[member_id!].casting_role;
        if (rolesPerQuest !== undefined && rolesPerQuest.length > 0) {
          rolesPerQuest.forEach((cr) => {
            if (cr.quest_id == quest_id) {
              castingRole.push(cr);
            }
          });
          return castingRole;
        }
        return [];
      },
  },
  actions: {
    async ensureAllMembers() {
      if (Object.keys(this.members).length === 0 || !this.fullFetch) {
        await this.fetchMembers();
      }
    },
    async ensureMemberById(id: number, full: boolean = true) {
      if (!this.members[id]) {
        await this.fetchMemberById(id, full);
      }
    },
    async reloadIfFull(id: number) {
      if (this.fullMembers[id]) {
        await this.fetchMemberById(id, true);
      }
    },
    async ensureMembersOfGuild({
      guildId,
      full = true,
    }: {
      guildId: number | undefined;
      full?: boolean;
    }) {
      const guildStore = useGuildStore();
      await guildStore.ensureGuild(guildId!, true);
      const guild = guildStore.getGuildById(guildId!);
      let membersId: number[] | number =
        guild.guild_membership?.map((mp: GuildMembership) => mp.member_id) ||
        [];
      if (full) {
        membersId = membersId.filter((id: number) => !this.fullMembers[id]);
      } else {
        membersId = membersId.filter((id: number) => !this.members[id]);
      }
      if (membersId.length > 0) {
        await this.fetchMemberById(membersId, full);
      }
    },
    async ensurePlayersOfQuest(questId: number, full: boolean = true) {
      const questStore = useQuestStore();
      await questStore.ensureQuest({
        quest_id: questId,
        full: true,
      });
      const quest = questStore.getQuestById(questId);
      let membersId: (number | undefined)[] =
        quest.casting?.map((mp: Casting) => mp.member_id) || [];
      membersId.concat(
        quest.quest_membership?.map((mp: QuestMembership) => mp.member_id) ||
          [],
      );
      membersId = [...new Set(membersId)];
      membersId = membersId.filter(
        (id: number | undefined) => !this.members[id!],
      );
      if (membersId.length > 0 && typeof membersId === 'number') {
        this.fetchMemberById(membersId, full);
      }
    },
    resetMembers() {
      Object.assign(this, baseState);
    },
    //axios calls
    async fetchMembers(): Promise<PublicMember[] | undefined> {
      const res: AxiosResponse<PublicMember[]> =
        await api.get('/public_members');
      if (res.status == 200) {
        const fullMembers = Object.values<PublicMember>(this.members).filter(
          (member) => this.fullMembers[member.id],
        );
        const members: MemberMap = Object.fromEntries(
          res.data.map((member: PublicMember) => [member.id, member]),
        );
        for (const member of fullMembers) {
          if (members[member.id]) {
            Object.assign(members[member.id], {
              guild_member_available_role: member.guild_member_available_role,
              casting_role: member.casting_role,
            });
          }
        }
        this.members = members;
        this.fullFetch = true;
        return res.data;
      }
    },
    async fetchMemberById(
      id: undefined | number | number[],
      full: boolean = true,
    ) {
      const memberStore = useMemberStore();
      const params = Object();
      params.id = id;
      if (id) {
        if (Array.isArray(id)) {
          params.id = `in.(${params.id.join(',')})`;
        } else {
          params.id = `eq.${id}`;
        }
      }
      if (full) {
        let select = '*,casting_role!member_id(*)';
        if (memberStore.isAuthenticated) {
          select += ',guild_member_available_role!member_id(*)';
        }
        Object.assign(params, { select });
      }
      const res: AxiosResponse<PublicMember[]> = await api.get(
        'public_members',
        { params },
      );
      if (res.status == 200) {
        this.members = {
          ...this.members,
          ...Object.fromEntries(
            res.data.map((member: PublicMember) => [member.id, member]),
          ),
        };
        if (full) {
          this.fullMembers = {
            ...this.fullMembers,
            ...Object.fromEntries(
              res.data.map((member: PublicMember) => [member.id, true]),
            ),
          };
        }
      }
    },
    async updateMember(data: Partial<Member>) {
      const params = Object();
      params.id = data.id;
      data = filterKeys(data, memberPatchKeys);
      const res: AxiosResponse<PublicMember[]> = await api.patch(
        `/public_members?id=eq.${params.id}`,
        data,
      );
      if (res.status == 200) {
        this.members = Object.assign({}, this.members, res.data[0]);
      }
    },

    removeCastingRole(castingRole: CastingRole) {
      const { member_id } = castingRole;
      let member = this.members[member_id!];
      if (
        member &&
        member.casting_role !== undefined &&
        member.casting_role.length > 0
      ) {
        const { casting_role } = member;
        const pos = casting_role.findIndex(
          (a: CastingRole) =>
            a.role_id == castingRole.role_id &&
            a.member_id == castingRole.member_id &&
            a.guild_id == castingRole.guild_id,
        );
        if (pos >= 0) {
          casting_role.splice(pos, 1);
          member = { ...member, casting_role };
          this.members = { ...this.members, [member_id!]: member };
        }
      }
    },
  },
});
