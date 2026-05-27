export type CrudCoverage = {
  entity: string;
  routes: string[];
  create: boolean;
  read: boolean;
  update: boolean;
  deleteSoft: boolean;
  archive: boolean;
  notes?: string;
};

/**
 * Matrice de couverture CRUD des interfaces admin.
 * Sert de référence fonctionnelle pour valider la cohérence UI.
 */
export const ADMIN_CRUD_MATRIX: CrudCoverage[] = [
  {
    entity: "livres",
    routes: ["/admin/livres", "/admin/livres/[id]", "/admin/livres/[id]/modifier"],
    create: true,
    read: true,
    update: true,
    deleteSoft: false,
    archive: true,
    notes: "Suppression hard absente, archivage présent.",
  },
  {
    entity: "auteurs",
    routes: ["/admin/auteurs", "/admin/auteurs/[id]", "/admin/auteurs/[id]/modifier"],
    create: true,
    read: true,
    update: true,
    deleteSoft: true,
    archive: false,
  },
  {
    entity: "categories",
    routes: ["/admin/categories", "/admin/categories/[id]", "/admin/categories/[id]/modifier"],
    create: true,
    read: true,
    update: true,
    deleteSoft: true,
    archive: false,
  },
  {
    entity: "utilisateurs",
    routes: ["/admin/utilisateurs", "/admin/utilisateurs/[id]", "/admin/utilisateurs/[id]/abonnement"],
    create: true,
    read: true,
    update: true,
    deleteSoft: true,
    archive: false,
  },
  {
    entity: "abonnements",
    routes: ["/admin/abonnements"],
    create: true,
    read: true,
    update: true,
    deleteSoft: true,
    archive: false,
  },
  {
    entity: "paiements",
    routes: ["/admin/paiements"],
    create: false,
    read: true,
    update: false,
    deleteSoft: false,
    archive: false,
    notes: "Interface orientée consultation.",
  },
  {
    entity: "commentaires",
    routes: ["/admin/commentaires"],
    create: false,
    read: true,
    update: true,
    deleteSoft: true,
    archive: false,
    notes: "Modération (statut) plutôt que CRUD classique.",
  },
];

