import guildService from "../../services/guild";
import { Notify } from "quasar";


export  function createGuilds({commit, dispatch}, payload,) {
    const token = this.state.auth.accessToken;
    console.log("going through create guilds:", payload, token);
    let result = guildService.createGuild(payload,token)
    .then (function(result) {
        dispatch('findGuilds');
    }).catch(function(error) {
        console.log('Error in createGuild', error)
    })
}

export  function updateGuilds({commit, dispatch}, payload,) {
    const token = this.state.auth.accessToken;
    let result = guildService.updateGuild(payload,token)
    .then (function(result) {
        dispatch('findGuilds');
    }).catch(function(error) {
        console.log('Error in updateGuild', error)
    })
}


export async function findGuilds( {commit}, payload) {
    try {
        const token = this.state.auth.accessToken;
        let result =  await guildService.getGuilds(payload, token)
        commit('SET_GUILD_DATA', result.data);
        return (result)
    }
    catch(error){
        console.log("Error in findGuilds", error);
    }
}

export async function checkBelongsToGuild({state, commit}, id) {
    try {
    const token = this.state.auth.accessToken;
    let result = await guildService.checkIfMemberBelongsToGuild(id, token)
        commit('SET_GUILD_MEMBER_DATA', result.data);
        return (result)
    }
    catch(error) {
        console.log("Error in getting guild/user members", error);
    }
}

export async function joinGuild({commit, state}, guildId) {
    try {
        const token = this.state.auth.accessToken;
        const userId = this.state.user.user.id;
        let response = await guildService.joinGuild(guildId, userId, token)
        return (response)
    }
    catch (error) {
        console.log("Error with member joing guild ", error)
    }

}

export async function getMembersByGuildId({state, commit}, id) {
    try {
    const token = this.state.auth.accessToken;
    let result = await guildService.getGuildMembersById(id, token)
    return (result.data.data)
    }
    catch(error) {
        console.log("Error in getting guild/user members", error);
    }
}

 export function setGuildData({commit}){
    console.log("Guild data: ", {opt})
    return Promise.resolve(commit('SET_GUILD_DATA', opt.data));
}
