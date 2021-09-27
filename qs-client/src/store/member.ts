import MyVapi from "./base";
const { hash } = require("bcryptjs");
import { Notify } from "quasar";
import { Member } from "../types";

export interface MemberState {
  member: Member;
  email?: string;
  token?: string;
  tokenExpiry?: number;
  isAuthenticated: boolean;
}

// TODO: right now expiry is shared knowledge with backend.
// Ideally, I should read it from the token.
const TOKEN_EXPIRATION = 1000000;
const TOKEN_RENEWAL = (TOKEN_EXPIRATION * 9) / 10;

const baseState: MemberState = {
  member: null,
  email: null,
  token: null,
  tokenExpiry: null,
  isAuthenticated: false,
};

export const member = new MyVapi<MemberState>({
  state: baseState,
})
  // Step 3
  .patch({
    action: "updateUser",
    property: "member",
    path: ({ id }) => `/members?id=eq.${id}`,
    onSuccess: (state: MemberState, res, axios, { params, data }) => {
      state.member = Object.assign({}, state.member, res.data[0]);
    },
  })
  .call({
    action: "signin",
    property: "token",
    path: "get_token",
    beforeRequest: (state: MemberState, actionParams) => {
      const { data, password, signonEmail } = actionParams;
      data.pass = password;
      data.mail = signonEmail;
    },
    onError: (state: MemberState, err, axios, { params, data }) => {
      console.log(err);
      Notify.create({
        message: "Wrong email or password",
        color: "negative",
        icon: "warning",
      });
    },
    onSuccess: (state: MemberState, res, axios, { params, data }) => {
      state.token = res.data;
      state.tokenExpiry = Date.now() + TOKEN_EXPIRATION;
      state.email = data.mail;
      state.isAuthenticated = true;
      const storage = window.localStorage;
      storage.setItem("token", state.token);
      storage.setItem("tokenExpiry", state.tokenExpiry.toString());
      storage.setItem("email", state.email);
      window.setTimeout(() => {
        MyVapi.store.dispatch("member/renewToken", {
          params: { token: state.token },
        });
      }, TOKEN_RENEWAL);
      // Ideally, I should be able to chain another action as below.
      // But onSuccess is part of the mutator, not the action, so no async.
      // return await MyVapi.store.dispatch('member/fetchLoginUser', {email: data.mail})
    },
  })
  .get({
    action: "fetchLoginUser",
    property: "member",
    path: "/members",
    queryParams: true,
    beforeRequest: (state: MemberState, { params }) => {
      if (!state.token) {
        state.token = window.localStorage.getItem("token");
      }
      if (!state.tokenExpiry) {
        state.tokenExpiry = Number.parseInt(
          window.localStorage.getItem("tokenExpiry")
        );
      }
      if (!state.email) {
        state.email = window.localStorage.getItem("email");
      }
      if (state.token && state.email) {
        params.email = `eq.${state.email}`;
      }
      params.select = "*,quest_membership(*),guild_membership(*),casting(*)";
    },
    onSuccess: (state: MemberState, res, axios, { params, data }) => {
      state.member = res.data[0];
      state.isAuthenticated = true;
      state.token = state.token || window.localStorage.getItem("token");
      const tokenExpiry =
        state.tokenExpiry || window.localStorage.getItem("tokenExpiry");
      if (tokenExpiry) {
        state.tokenExpiry = Number.parseInt(tokenExpiry as string);
      }
      return state.member;
    },
    onError: (state: MemberState, error, axios, { params, data }) => {
      window.localStorage.removeItem("token");
      window.localStorage.removeItem("tokenExpiry");
      console.log(error);
    },
  })
  .post({
    action: "registerUserCrypted",
    property: "member",
    path: "/members",
    onError: (state: MemberState, error, axios, { params, data }) => {
      const errorCode = data.code;
      if (errorCode === 409) {
        Notify.create({
          message:
            "This account already exists. Try resetting your password or contact support.",
          color: "negative",
        });
      } else {
        Notify.create({
          message:
            "There was an error creating your account. If this issue persists, contact support.",
          color: "negative",
        });
      }
    },
    onSuccess: (state: MemberState, payload, axios, { params, data }) => {
      // TODO: Send email to user with activation link
      // TODO: Add to members state?
      Notify.create({
        message:
          "Account created successfully. Please check your email for a confirmation link.",
        color: "positive",
      });
    },
  })
  .call({
    action: "renewToken",
    path: ({ token }: { token: string }) => `/rpc/renew_token?token=${token}`,
    readOnly: true,
    onSuccess: (state: MemberState, res, axios, { params, data }) => {
      state.token = res.data;
      const tokenExpiry = Date.now() + TOKEN_EXPIRATION;
      state.tokenExpiry = tokenExpiry;
      const storage = window.localStorage;
      storage.setItem("token", state.token);
      storage.setItem("tokenExpiry", tokenExpiry.toString());
      window.setTimeout(() => {
        MyVapi.store.dispatch("member/renewToken", {
          params: { token: state.token },
        });
      }, TOKEN_RENEWAL);
    },
  })
  // Step 4
  .getVuexStore({
    getters: {
      getUser: (state) => state.member,
      getUserEmail: (state) => state.email,
      getUserId: (state) => state.member?.id,
      getUserById: (state) => (id: number) =>
        state.member?.id == id ? state.member : null,
    },
    mutations: {
      LOGOUT: (state) => {
        window.localStorage.removeItem("token");
        window.localStorage.removeItem("email");
        window.localStorage.removeItem("tokenExpiry");
        return Object.assign(state, baseState);
      },
      ADD_CASTING: (state: MemberState, casting) => {
        if (state.member) {
          const castings =
            state.member.casting.filter(
              (c) => c.quest_id != casting.quest_id
            ) || [];
          castings.push(casting);
          state.member.casting = castings;
        }
      },
      ADD_GUILD_MEMBERSHIP: (state: MemberState, membership) => {
        if (state.member) {
          const memberships =
            state.member.guild_membership.filter(
              (m) => m.guild_id != membership.guild_id
            ) || [];
          memberships.push(membership);
          state.member.guild_membership = memberships;
        }
      },
      ADD_QUEST_MEMBERSHIP: (state: MemberState, membership) => {
        if (state.member) {
          const memberships =
            state.member.quest_membership.filter(
              (m) => m.quest_id != membership.quest_id
            ) || [];
          memberships.push(membership);
          state.member.quest_membership = memberships;
        }
      },
    },
    actions: {
      logout: (context) => {
        context.commit("LOGOUT");
      },
      registerUser: async (context, data) => {
        const password = await hash(data.password, 10);
        data = { ...data, password };
        return await context.dispatch("registerUserCrypted", { data });
      },
      ensureLoginUser: async (context) => {
        // TODO: the case where the member is pending
        if (!context.state.member) {
          const expiry =
            context.state.tokenExpiry ||
            window.localStorage.getItem("tokenExpiry");
          if (expiry && Date.now() < Number.parseInt(expiry)) {
            await context.dispatch("fetchLoginUser");
            if (!context.state.tokenExpiry) {
              // add a commit for expiry?
            }
            return context.state.member;
          }
        }
      },
    },
  });