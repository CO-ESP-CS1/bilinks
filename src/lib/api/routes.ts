/** Chemins API admin — alignés sur backend/docs/ADMIN-API-CONTRACT.md */
export const ADMIN_ROUTES = {
  users: {
    list: "/admin/users",
    create: "/admin/users",
    byId: (id: string) => `/admin/users/${id}`,
    ban: (id: string) => `/admin/users/${id}/ban`,
    unban: (id: string) => `/admin/users/${id}/unban`,
    readingHabits: (id: string) => `/admin/users/${id}/reading-habits`,
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
    suspend: (id: string) => `/admin/subscriptions/${id}/suspend`,
    activate: (id: string) => `/admin/subscriptions/${id}/activate`,
  },
  payments: { list: "/admin/payments" },
  comments: {
    list: "/admin/comments",
    moderate: (id: string) => `/admin/comments/${id}/moderate`,
    republish: (id: string) => `/admin/comments/${id}/republish`,
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
    activity: "/admin/stats/activity",
    readingHabits: "/admin/stats/reading-habits",
  },
  etablissements: {
    list: "/admin/etablissements",
    create: "/admin/etablissements",
    byId: (id: string) => `/admin/etablissements/${id}`,
    membres: (id: string) => `/admin/etablissements/${id}/membres`,
    retireMembre: (id: string, membreId: string) =>
      `/admin/etablissements/${id}/membres/${membreId}/retirer`,
    prolonger: (id: string) => `/admin/etablissements/${id}/prolonger`,
    performance: (id: string) => `/admin/etablissements/${id}/performance`,
  },
  performance: {
    overview: (query?: string) =>
      `/admin/performance/overview${query ? `?${query}` : ""}`,
  },
  exports: {
    statsPdf: "/admin/export/stats/pdf",
    statsXlsx: "/admin/export/stats/xlsx",
    userPdf: (id: string) => `/admin/export/users/${id}/pdf`,
    userXlsx: (id: string) => `/admin/export/users/${id}/xlsx`,
    paymentsPdf: (query?: string) =>
      `/admin/export/payments/pdf${query ? `?${query}` : ""}`,
    paymentsXlsx: (query?: string) =>
      `/admin/export/payments/xlsx${query ? `?${query}` : ""}`,
    performancePdf: (query?: string) =>
      `/admin/export/performance/pdf${query ? `?${query}` : ""}`,
    performanceXlsx: (query?: string) =>
      `/admin/export/performance/xlsx${query ? `?${query}` : ""}`,
  },
  notifications: {
    list: "/admin/notifications",
    create: "/admin/notifications",
    delete: (id: string) => `/admin/notifications/${id}`,
  },
  youtube: {
    channels: "/admin/youtube/channels",
    resolveChannel: (q: string) =>
      `/admin/youtube/channels/resolve?q=${encodeURIComponent(q)}`,
    createChannel: "/admin/youtube/channels",
    updateChannel: (id: string) => `/admin/youtube/channels/${id}`,
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
  changePassword: "/auth/password/change",
} as const;

export const PROFILE_ROUTES = {
  me: "/me",
  photo: "/me/photo",
} as const;
