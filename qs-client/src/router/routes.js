
const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '/',
        component: () => import('pages/Home.vue')
      },
     //Quest pages
      { path: '/quest-app',
        name: "quests",
        component: () => import('pages/Quest-app.vue')
      },
      { path: '/quest',
        name: "quest",
        component: () => import('pages/quest.vue')
      },
      {path: 'questform',
        name: "questform",
        component: () => import('pages/questForm.vue')
      },
      { path: '/quest-landing',
        name: "quest-landing",
        component: () => import('pages/Quest-landing.vue')
      },
      { path: '/questEdit',
        name: "questedit",
        component: () => import('pages/questEdit.vue')
      },
      {path: '/questRequest/:quest_id',
       name: 'questRequest',
       component: () => import('pages/questRequest.vue')
      },
      {path: '/questview/:quest_id',
       name: 'questView',
       component: () => import('pages/questview.vue')
      },
      { path: '/guilds',
        name: "guilds",
        component: () => import('pages/Guilds.vue')
      },
      { path: '/guild-landing',
        name: "guild-landing",
        component: () => import('pages/Guild-landing.vue')
      },
      { path: '/guild/:guild_id',
        name: "guild",
        component: () => import('pages/Guild-app.vue')
      },
      { path: '/guild/:guild_id/play/:quest_id',
        name: "game_play",
        component: () => import('pages/GamePlay.vue')
      },
      { path: '/guildEdit',
        name: "guildedit",
        component: () => import('pages/guildEdit.vue')
      },
      { path: '/guildAdmin/:guild_id',
        name: "guild_admin",
        component: () => import('pages/guildAdmin.vue')
      },
      {path: 'guildform',
        name: "guildform",
        component: () => import('pages/guildForm.vue')
      },
      { path: '/register',
        name: "register",
        component: () => import('pages/Register.vue')
      },
      { path: '/signin',
        name: "signin",
        component: () => import('pages/SignIn.vue')
      },
      { path: '',
        component: () => import('pages/Index.vue')
      },
      { path: '/home',
        name: "home",
        component: () => import('pages/Home.vue'),
      },
      { path: '/landing',
        name: "landingPage",
        component: () => import('pages/Landing-page.vue')
      },
      { path: '/role/:id',
        name: "role",
        component: () => import('pages/Role-room.vue')
      },
      {
        path: '/node/:quest_id',
        name: "node",
        component: () => import('pages/mmowgli-node.vue')
      },
      {
        path: '/nodeEdit/:quest_id',
        name: "nodeEditor",
        component: () => import('pages/nodeEdit.vue')
      },
      { path: '/mnodeedit',
        name: "mmowglieditor",
        component: () => import('pages/mmowgli-node-form.vue')
      },
      { path: '/lobby',
        name: "lobby",
        component: () => import('pages/Lobby.vue')
      }
    ]
  },


  // Always leave this as last one,
  // but you can also remove it
  {
    path: '*',
    component: () => import('pages/Error404.vue')
  }
]

export default routes
