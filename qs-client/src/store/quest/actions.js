import questService from "../../services";
import { Notify } from "quasar";


export  async function createQuests({commit, dispatch}, payload,) {
    try {
        const token = this.state.member.token;
        const result = await questService.createQuest(payload,token)
        const getQuest = await dispatch('findQuests');
        return result;
    }
    catch(error) {
        console.log('Error in createQuest', error)
    }
}
export  async function updateQuests({commit, dispatch}, payload,) {
    try {
        const token = this.state.member.token;
        let today = new Date;
        payload.updated_at = today;
    today = today.toISOString()
        let result = await questService.updateQuest(payload,token)
        return (result)
    }
    catch (err) {

    }
}
export async function findQuests( {commit}) {
    try {
    const token = this.state.member.token;
    let result =  await questService.getQuests(token)
    commit('SET_QUEST_DATA', result.data);
    return (result);
    }
    catch(error) {
        console.log("findQuest error: ", error);
    }
}
export async function getQuestById( {commit}, questId) {
    try {
    const token = this.state.auth.accessToken;
    let result =  await questService.getQuestById(questId, token)
    return (result.data[0]);
    }
    catch(error) {
        console.log("get quest by id error: ", error);
    }
}
export async function getQuestByHandle( {commit}, questHandle) {
    try {
    const token = this.state.auth.accessToken;
    let result =  await questService.getQuestByHandle(questHandle, token)
    return (result.data[0]);
    }
    catch(error) {
        console.log("get quest by handle error: ", error);
    }
}
export async function logout ({commit}) {
    this.state.quests.currentQuest = null;
    this.state.quests.quests = null;
    return true
  }

export function setCurrentQuest({commit, getters}, questId) {
    let quest = getters.getQuestById(questId)
    return Promise.resolve(commit('SET_CURRENT_QUEST', quest[0]))
}

 export function setQuestData({commit}){
    console.log("Quest data: ", {opt})
    return Promise.resolve(commit('SET_QUEST_DATA', opt.data));
}
