/** Chemins API admin — alignés sur backend/docs/ADMIN-API-CONTRACT.md */
export const ADMIN_ROUTES = {
  users: {
    list: "/admin/users",
    create: "/admin/users",
    byId: (id: string) => `/admin/users/${id}`,
    ban: (id: string) => `/admin/users/${id}/ban`,
    unban: (id: string) => `/admin/users/${id}/unban`,
  },
  books: {
    list: "/admin/books",
    create: "/admin/books",
    byId: (id: string) => `/admin/books/${id}`,
    archive: (id: string) => `/admin/books/${id}/archive`,
    authors: (id: string) => `/admin/books/${id}/authors`,
    categories: (id: string) => `/admin/books/${id}/categories`,
  },
  libraries: {
    list: "/admin/libraries",
    create: "/admin/libraries",
    byId: (id: string) => `/admin/libraries/${id}`,
    archive: (id: string) => `/admin/libraries/${id}/archive`,
    unarchive: (id: string) => `/admin/libraries/${id}/unarchive`,
    books: (id: string) => `/admin/libraries/${id}/books`,
    removeBook: (bibId: string, bookId: string) =>
      `/admin/libraries/${bibId}/books/${bookId}`,
  },
  auteurs: {
    list: "/admin/auteurs",
    create: "/admin/auteurs",
    byId: (id: string) => `/admin/auteurs/${id}`,
  },
  categories: {
    list: "/admin/categories",
    create: "/admin/categories",
    byId: (id: string) => `/admin/categories/${id}`,
  },
  plans: {
    list: "/admin/plans",
    create: "/admin/plans",
    byId: (id: string) => `/admin/plans/${id}`,
  },
  subscriptions: {
    list: "/admin/subscriptions",
    cancel: (id: string) => `/admin/subscriptions/${id}/cancel`,
  },
  payments: { list: "/admin/payments" },
  comments: {
    list: "/admin/comments",
    moderate: (id: string) => `/admin/comments/${id}/moderate`,
    byId: (id: string) => `/admin/comments/${id}`,
  },
  challenges: {
    list: "/admin/challenges",
    create: "/admin/challenges",
    byId: (id: string) => `/admin/challenges/${id}`,
    cancel: (id: string) => `/admin/challenges/${id}/cancel`,
    participants: (id: string) => `/admin/challenges/${id}/participants`,
  },
  badges: {
    list: "/admin/badges",
    create: "/admin/badges",
    byId: (id: string) => `/admin/badges/${id}`,
  },
  stats: {
    dashboard: "/admin/stats/dashboard",
    users: "/admin/stats/users",
    books: "/admin/stats/books",
    searchTerms: "/admin/stats/search-terms",
  },
  notifications: {
    list: "/admin/notifications",
    create: "/admin/notifications",
    delete: (id: string) => `/admin/notifications/${id}`,
  },
  youtube: {
    channels: "/admin/youtube/channels",
    createChannel: "/admin/youtube/channels",
    activateChannel: (id: string) => `/admin/youtube/channels/${id}/activate`,
    deactivateChannel: (id: string) => `/admin/youtube/channels/${id}/deactivate`,
    deleteChannel: (id: string) => `/admin/youtube/channels/${id}`,
    sync: "/admin/youtube/sync",
    publicVideos: "/youtube/videos",
    publicChannels: "/youtube/channels",
  },
} as const;

export const AUTH_ROUTES = {
  login: "/auth/password/login",
} as const;
