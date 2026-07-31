/** Liens de navigation admin — barre latérale. */

export type AdminNavItem = {
  name: string;
  path: string;
};

export type AdminNavSection = {
  title: string;
  items: AdminNavItem[];
};

export const adminNavSections: AdminNavSection[] = [
  {
    title: "Menu principal",
    items: [
      { name: "Tableau de bord", path: "/admin" },
      { name: "Livres", path: "/admin/livres" },
      { name: "Auteurs", path: "/admin/auteurs" },
      { name: "Catégories", path: "/admin/categories" },
    ],
  },
  {
    title: "Utilisateurs",
    items: [
      { name: "Utilisateurs", path: "/admin/utilisateurs" },
      { name: "Administrateurs", path: "/admin/administrateurs" },
      { name: "Abonnements", path: "/admin/abonnements" },
      { name: "Paiements", path: "/admin/paiements" },
      { name: "Établissements", path: "/admin/etablissements" },
    ],
  },
  {
    title: "Contenu",
    items: [
      { name: "Bibliothèques", path: "/admin/bibliotheques" },
      { name: "Vidéos éducatives", path: "/admin/videos-educatives" },
      { name: "Défis & Badges", path: "/admin/defis" },
      { name: "Commentaires", path: "/admin/commentaires" },
    ],
  },
  {
    title: "Système",
    items: [
      { name: "Notifications", path: "/admin/notifications" },
      { name: "Statistiques", path: "/admin/statistiques" },
      { name: "Performance", path: "/admin/performance" },
    ],
  },
];

export const ADMINISTRATEURS_PATH = "/admin/administrateurs";
