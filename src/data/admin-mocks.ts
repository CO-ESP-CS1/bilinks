// Données de démonstration — remplacées par l'API en production
import type {
  MockLivre,
  MockAuteur,
  MockCategorie,
  MockBibliotheque,
  MockUtilisateur,
  MockAbonnement,
  MockPaiement,
  MockCommentaire,
  MockPlanTarifaire,
  MockDefi,
  MockBadge,
  MockNotification,
} from "@/types/admin";













// --- KPIs Dashboard ---
export const mockKPIs = {
  totalLivres: 284,
  totalUtilisateurs: 1_847,
  abonnementsActifs: 412,
  revenusMonthly: 1_230_500, // en XAF
  nouveauxUsersHebdo: 38,
  livresAjoutes: 12,
  paiementsEnAttente: 7,
  commentairesAModerer: 14,
};

// --- Évolution des abonnements (6 derniers mois) ---
export const mockAbonnementsChart = [
  { mois: "Déc", nouveaux: 28, renouvellements: 45 },
  { mois: "Jan", nouveaux: 35, renouvellements: 52 },
  { mois: "Fév", nouveaux: 42, renouvellements: 61 },
  { mois: "Mar", nouveaux: 31, renouvellements: 58 },
  { mois: "Avr", nouveaux: 55, renouvellements: 74 },
  { mois: "Mai", nouveaux: 63, renouvellements: 89 },
];

// --- Répartition plans ---
export const mockPlanRepartition = [
  { plan: "HEBDOMADAIRE", count: 87, prix: 500 },
  { plan: "MENSUEL", count: 245, prix: 1500 },
  { plan: "ANNUEL", count: 80, prix: 12000 },
];

// --- Livres ---
export const mockLivres: MockLivre[] = [
  { id: "l1", titre: "Le Petit Prince", auteurs: ["Antoine de Saint-Exupéry"], categorie: "Roman", langue: "Français", anneePublication: 1943, nombrePages: 93, statut: "PUBLIE", nbLectures: 312, noteMoyenne: 4.7, couvertureUrl: "" },
  { id: "l2", titre: "L'Art de la Guerre", auteurs: ["Sun Tzu"], categorie: "Philosophie", langue: "Français", anneePublication: -500, nombrePages: 68, statut: "PUBLIE", nbLectures: 198, noteMoyenne: 4.5, couvertureUrl: "" },
  { id: "l3", titre: "Clean Code", auteurs: ["Robert C. Martin"], categorie: "Informatique", langue: "Anglais", anneePublication: 2008, nombrePages: 431, statut: "PUBLIE", nbLectures: 445, noteMoyenne: 4.8, couvertureUrl: "" },
  { id: "l4", titre: "Design Patterns", auteurs: ["Gang of Four"], categorie: "Informatique", langue: "Anglais", anneePublication: 1994, nombrePages: 395, statut: "PUBLIE", nbLectures: 267, noteMoyenne: 4.6, couvertureUrl: "" },
  { id: "l5", titre: "Algorithmes", auteurs: ["Thomas Cormen", "Charles Leiserson"], categorie: "Informatique", langue: "Français", anneePublication: 2001, nombrePages: 1292, statut: "PUBLIE", nbLectures: 134, noteMoyenne: 4.3, couvertureUrl: "" },
  { id: "l6", titre: "Les Misérables", auteurs: ["Victor Hugo"], categorie: "Roman", langue: "Français", anneePublication: 1862, nombrePages: 1900, statut: "ARCHIVE", nbLectures: 89, noteMoyenne: 4.4, couvertureUrl: "" },
  { id: "l7", titre: "Économie pour tous", auteurs: ["Ha-Joon Chang"], categorie: "Économie", langue: "Français", anneePublication: 2014, nombrePages: 320, statut: "PUBLIE", nbLectures: 156, noteMoyenne: 4.1, couvertureUrl: "" },
  { id: "l8", titre: "Introduction à Python", auteurs: ["Mark Lutz"], categorie: "Informatique", langue: "Français", anneePublication: 2013, nombrePages: 1540, statut: "PUBLIE", nbLectures: 523, noteMoyenne: 4.5, couvertureUrl: "" },
];

// --- Auteurs ---
export const mockAuteurs: MockAuteur[] = [
  { id: "a1", nom: "de Saint-Exupéry", prenom: "Antoine", nbLivres: 1, deletedAt: null },
  { id: "a2", nom: "Tzu", prenom: "Sun", nbLivres: 1, deletedAt: null },
  { id: "a3", nom: "Martin", prenom: "Robert C.", nbLivres: 2, deletedAt: null },
  { id: "a4", nom: "Hugo", prenom: "Victor", nbLivres: 2, deletedAt: null },
  { id: "a5", nom: "Cormen", prenom: "Thomas", nbLivres: 1, deletedAt: null },
  { id: "a6", nom: "Chang", prenom: "Ha-Joon", nbLivres: 1, deletedAt: null },
  { id: "a7", nom: "Lutz", prenom: "Mark", nbLivres: 1, deletedAt: null },
];

// --- Catégories ---
export const mockCategories: MockCategorie[] = [
  { id: "c1", nom: "Roman", description: "Œuvres de fiction narrative", nbLivres: 45, deletedAt: null },
  { id: "c2", nom: "Informatique", description: "Programmation, algorithmes, systèmes", nbLivres: 92, deletedAt: null },
  { id: "c3", nom: "Philosophie", description: "Pensée critique et éthique", nbLivres: 28, deletedAt: null },
  { id: "c4", nom: "Économie", description: "Microéconomie, macroéconomie, finance", nbLivres: 34, deletedAt: null },
  { id: "c5", nom: "Mathématiques", description: "Algèbre, analyse, statistiques", nbLivres: 51, deletedAt: null },
  { id: "c6", nom: "Droit", description: "Droit civil, pénal, commercial", nbLivres: 19, deletedAt: null },
];

// --- Bibliothèques ---
export const mockBibliotheques: MockBibliotheque[] = [
  { id: "b1", nom: "Bibliothèque Principale COMEC", type: "INTERNE", statut: "ACTIVE", description: "Catalogue principal de B LINKS", urlExterne: null, nbLivres: 284, deletedAt: null },
  { id: "b2", nom: "OpenLibrary", type: "EXTERNE", statut: "ACTIVE", description: "Bibliothèque numérique gratuite mondiale", urlExterne: "https://openlibrary.org", nbLivres: 0, deletedAt: null },
  { id: "b3", nom: "Gallica — BnF", type: "EXTERNE", statut: "ACTIVE", description: "Bibliothèque numérique de la BnF", urlExterne: "https://gallica.bnf.fr", nbLivres: 0, deletedAt: null },
  { id: "b4", nom: "Fonds Africain", type: "INTERNE", statut: "ACTIVE", description: "Littérature africaine et ouvrages locaux", urlExterne: null, nbLivres: 47, deletedAt: null },
  { id: "b5", nom: "Archive Ancienne", type: "INTERNE", statut: "ARCHIVEE", description: "Ancienne collection, archivée", urlExterne: null, nbLivres: 12, deletedAt: null },
];

// --- Utilisateurs ---
export const mockUtilisateurs: MockUtilisateur[] = [
  { id: "u1", nom: "Moukassa", prenom: "Darcel", email: "darcel@univ-brazza.cg", ecole: "UMNG", niveau: "Licence 3", role: "USER", statut: "ACTIF", points: 340, dateInscription: "2024-09-12", abonnementActif: true, membreEtablissement: false, deletedAt: null },
  { id: "u2", nom: "Ngoma", prenom: "Prisca", email: "prisca.ngoma@gmail.com", ecole: "ISM", niveau: "Master 1", role: "USER", statut: "ACTIF", points: 185, dateInscription: "2024-10-03", abonnementActif: true, membreEtablissement: false, deletedAt: null },
  { id: "u3", nom: "Loemba", prenom: "Franck", email: "franck.l@yahoo.fr", ecole: "ESGAE", niveau: "Licence 2", role: "USER", statut: "BANNI", points: 20, dateInscription: "2024-08-22", abonnementActif: false, membreEtablissement: false, deletedAt: null },
  { id: "u4", nom: "Mavoungou", prenom: "Chrystelle", email: "c.mavoungou@gmail.com", ecole: "UMNG", niveau: "Licence 1", role: "USER", statut: "ACTIF", points: 95, dateInscription: "2025-01-15", abonnementActif: false, membreEtablissement: false, deletedAt: null },
  { id: "u5", nom: "Boutsindi", prenom: "Divin", email: "divin@bibliotech.cg", ecole: "UMNG", niveau: "Licence 3", role: "ADMIN", statut: "ACTIF", points: 0, dateInscription: "2024-07-01", abonnementActif: false, membreEtablissement: false, deletedAt: null },
  { id: "u6", nom: "Kimpouni", prenom: "Aline", email: "aline.k@gmail.com", ecole: "UCB", niveau: "Master 2", role: "USER", statut: "ACTIF", points: 520, dateInscription: "2024-11-08", abonnementActif: true, membreEtablissement: false, deletedAt: null },
];

// --- Abonnements ---
export const mockAbonnements: MockAbonnement[] = [
  { id: "ab1", utilisateurNom: "Darcel Moukassa", utilisateurEmail: "darcel@univ-brazza.cg", plan: "MENSUEL", statut: "ACTIF", typeRenouvellement: "RENOUVELLEMENT", dateDebut: "2025-05-01", dateFin: "2025-06-01", montant: 1500, deletedAt: null },
  { id: "ab2", utilisateurNom: "Prisca Ngoma", utilisateurEmail: "prisca.ngoma@gmail.com", plan: "ANNUEL", statut: "ACTIF", typeRenouvellement: "UPGRADE", dateDebut: "2025-01-15", dateFin: "2026-01-15", montant: 12000, deletedAt: null },
  { id: "ab3", utilisateurNom: "Aline Kimpouni", utilisateurEmail: "aline.k@gmail.com", plan: "MENSUEL", statut: "ACTIF", typeRenouvellement: "NOUVEAU", dateDebut: "2025-05-08", dateFin: "2025-06-08", montant: 1500, deletedAt: null },
  { id: "ab4", utilisateurNom: "Chrystelle Mavoungou", utilisateurEmail: "c.mavoungou@gmail.com", plan: "HEBDOMADAIRE", statut: "EXPIRE", typeRenouvellement: "NOUVEAU", dateDebut: "2025-04-01", dateFin: "2025-04-08", montant: 500, deletedAt: null },
];

// --- Paiements ---
export const mockPaiements: MockPaiement[] = [
  { id: "p1", utilisateurNom: "Darcel Moukassa", plan: "MENSUEL", montant: 1500, operateur: "MTN", numeroTelephone: "+242 06 123 4567", statut: "SUCCES", refTransaction: "MTN-2025-0501-7823", createdAt: "2025-05-01T10:23:00" },
  { id: "p2", utilisateurNom: "Prisca Ngoma", plan: "ANNUEL", montant: 12000, operateur: "Airtel", numeroTelephone: "+242 05 987 6543", statut: "SUCCES", refTransaction: "AIR-2025-0115-4421", createdAt: "2025-01-15T14:05:00" },
  { id: "p3", utilisateurNom: "Aline Kimpouni", plan: "MENSUEL", montant: 1500, operateur: "MTN", numeroTelephone: "+242 06 555 7890", statut: "SUCCES", refTransaction: "MTN-2025-0508-9934", createdAt: "2025-05-08T09:12:00" },
  { id: "p4", utilisateurNom: "Franck Loemba", plan: "MENSUEL", montant: 1500, operateur: "Airtel", numeroTelephone: "+242 05 111 2222", statut: "ECHEC", refTransaction: null, createdAt: "2025-04-20T17:45:00" },
  { id: "p5", utilisateurNom: "Chrystelle Mavoungou", plan: "HEBDOMADAIRE", montant: 500, operateur: "MTN", numeroTelephone: "+242 06 333 4444", statut: "SUCCES", refTransaction: "MTN-2025-0401-1122", createdAt: "2025-04-01T08:30:00" },
  { id: "p6", utilisateurNom: "Inconnu", plan: "MENSUEL", montant: 1500, operateur: "MTN", numeroTelephone: "+242 06 777 8888", statut: "EN_ATTENTE", refTransaction: null, createdAt: "2025-05-16T11:00:00" },
];

// --- Commentaires ---
export const mockCommentaires: MockCommentaire[] = [
  { id: "cm1", utilisateurNom: "Darcel Moukassa", livreTitre: "Clean Code", contenu: "Livre indispensable pour tout développeur sérieux.", statut: "PUBLIE", createdAt: "2025-05-10T14:22:00" },
  { id: "cm2", utilisateurNom: "Aline Kimpouni", livreTitre: "Le Petit Prince", contenu: "Magnifique, j'ai pleuré à la fin.", statut: "PUBLIE", createdAt: "2025-05-11T09:15:00" },
  { id: "cm3", utilisateurNom: "Franck Loemba", livreTitre: "Algorithmes", contenu: "Commentaire inapproprié supprimé.", statut: "SUPPRIME", createdAt: "2025-04-28T20:05:00" },
  { id: "cm4", utilisateurNom: "Chrystelle Mavoungou", livreTitre: "L'Art de la Guerre", contenu: "Contenu potentiellement problématique à vérifier.", statut: "MODERE", createdAt: "2025-05-14T16:40:00" },
];

// --- Plans tarifaires ---
export const mockPlans: MockPlanTarifaire[] = [
  {
    id: "pl1",
    code: "HEBDOMADAIRE",
    nom: "Hebdomadaire",
    prix: 500,
    dureeJours: 7,
    statut: "ACTIF",
    devise: "XAF",
    deletedAt: null,
  },
  {
    id: "pl2",
    code: "MENSUEL",
    nom: "Mensuel",
    prix: 1500,
    dureeJours: 30,
    statut: "ACTIF",
    devise: "XAF",
    deletedAt: null,
  },
  {
    id: "pl3",
    code: "ANNUEL",
    nom: "Annuel",
    prix: 12000,
    dureeJours: 365,
    statut: "ACTIF",
    devise: "XAF",
    deletedAt: null,
  },
];

// --- Activité récente (dashboard) ---
export const mockActiviteRecente = [
  { type: "inscription", message: "Chrystelle Mavoungou s'est inscrite", temps: "Il y a 2h" },
  { type: "paiement", message: "Paiement MTN reçu de Aline Kimpouni (1 500 XAF)", temps: "Il y a 4h" },
  { type: "commentaire", message: "Commentaire à modérer sur L'Art de la Guerre", temps: "Il y a 5h" },
  { type: "livre", message: "Introduction à Python : 523 lectures ce mois", temps: "Aujourd'hui" },
  { type: "badge", message: "12 badges distribués cette semaine", temps: "Cette semaine" },
];

// --- Défis ---
export const mockDefis: MockDefi[] = [
  {
    id: "d1",
    titre: "Marathon de lecture",
    description: "Lisez autant de pages que possible en une semaine.",
    objectif: "Lire 200 pages",
    pointsRecompense: 150,
    dateDebut: "2025-05-01",
    dateFin: "2025-05-08",
    statut: "ACTIF",
    participants: 89,
    deletedAt: null,
  },
  {
    id: "d2",
    titre: "Explorateur du catalogue",
    description: "Découvrez de nouvelles catégories.",
    objectif: "Consulter 10 livres différents",
    pointsRecompense: 80,
    dateDebut: "2025-04-15",
    dateFin: "2025-05-15",
    statut: "ACTIF",
    participants: 124,
    deletedAt: null,
  },
  {
    id: "d3",
    titre: "Club commentateurs",
    description: "Partagez vos avis sur vos lectures.",
    objectif: "Publier 3 commentaires validés",
    pointsRecompense: 50,
    dateDebut: "2025-03-01",
    dateFin: "2025-03-31",
    statut: "TERMINE",
    participants: 67,
    deletedAt: null,
  },
  {
    id: "d4",
    titre: "Défi rentrée 2025",
    description: "Préparation du challenge de septembre.",
    objectif: "À définir",
    pointsRecompense: 100,
    dateDebut: "2025-09-01",
    dateFin: "2025-09-30",
    statut: "BROUILLON",
    participants: 0,
    deletedAt: null,
  },
];

// --- Badges ---
export const mockBadges: MockBadge[] = [
  {
    id: "bg1",
    nom: "Premier pas",
    description: "Première connexion à B LINKS",
    condition: "Créer un compte",
    rarete: "COMMUN",
    nbAttribues: 1847,
    actif: true,
    deletedAt: null,
  },
  {
    id: "bg2",
    nom: "Lecteur assidu",
    description: "10 livres terminés",
    condition: "10 lectures complètes",
    rarete: "RARE",
    nbAttribues: 312,
    actif: true,
    deletedAt: null,
  },
  {
    id: "bg3",
    nom: "Critique éclairé",
    description: "5 commentaires publiés",
    condition: "5 commentaires validés",
    rarete: "COMMUN",
    nbAttribues: 156,
    actif: true,
    deletedAt: null,
  },
  {
    id: "bg4",
    nom: "Champion du défi",
    description: "Gagner un défi mensuel",
    condition: "Terminer un défi en 1er",
    rarete: "EPIC",
    nbAttribues: 24,
    actif: true,
    deletedAt: null,
  },
  {
    id: "bg5",
    nom: "Abonné premium",
    description: "Souscription annuelle active",
    condition: "Plan annuel actif",
    rarete: "RARE",
    nbAttribues: 80,
    actif: true,
    deletedAt: null,
  },
  {
    id: "bg6",
    nom: "Ancien badge test",
    description: "Badge retiré du catalogue",
    condition: "—",
    rarete: "COMMUN",
    nbAttribues: 12,
    actif: false,
    deletedAt: null,
  },
];

// --- Notifications admin ---
export const mockNotifications: MockNotification[] = [
  {
    id: "n1",
    titre: "Nouveaux livres d'Informatique",
    message: "12 ouvrages viennent d'être ajoutés au catalogue.",
    cible: "TOUS",
    statut: "ENVOYEE",
    envoyeLe: "2025-05-14T09:00:00",
    programmeLe: null,
    lus: 892,
    totalCibles: 1847,
    deletedAt: null,
  },
  {
    id: "n2",
    titre: "Rappel renouvellement",
    message: "Votre abonnement expire dans 3 jours.",
    cible: "ABONNES",
    statut: "ENVOYEE",
    envoyeLe: "2025-05-12T08:30:00",
    programmeLe: null,
    lus: 245,
    totalCibles: 412,
    deletedAt: null,
  },
  {
    id: "n3",
    titre: "Défi Marathon, c'est parti !",
    message: "Participez au défi de la semaine et gagnez 150 points.",
    cible: "TOUS",
    statut: "PROGRAMMEE",
    envoyeLe: null,
    programmeLe: "2025-05-20T07:00:00",
    lus: 0,
    totalCibles: 1847,
    deletedAt: null,
  },
  {
    id: "n4",
    titre: "Offre découverte UMNG",
    message: "1 semaine gratuite pour les étudiants UMNG.",
    cible: "ECOLE",
    statut: "BROUILLON",
    envoyeLe: null,
    programmeLe: null,
    lus: 0,
    totalCibles: 420,
    deletedAt: null,
  },
];

// --- Statistiques (graphiques) ---
export const mockLecturesParMois = [
  { mois: "Déc", lectures: 1240 },
  { mois: "Jan", lectures: 1580 },
  { mois: "Fév", lectures: 1420 },
  { mois: "Mar", lectures: 1890 },
  { mois: "Avr", lectures: 2100 },
  { mois: "Mai", lectures: 2450 },
];

export const mockTopLivres = [
  { titre: "Introduction à Python", lectures: 523 },
  { titre: "Clean Code", lectures: 445 },
  { titre: "Le Petit Prince", lectures: 312 },
  { titre: "Design Patterns", lectures: 267 },
  { titre: "L'Art de la Guerre", lectures: 198 },
];

export const mockCroissanceUtilisateurs = [
  { mois: "Déc", total: 1520 },
  { mois: "Jan", total: 1610 },
  { mois: "Fév", total: 1685 },
  { mois: "Mar", total: 1750 },
  { mois: "Avr", total: 1802 },
  { mois: "Mai", total: 1847 },
];

export const mockRepartitionCategories = [
  { categorie: "Informatique", count: 92 },
  { categorie: "Roman", count: 45 },
  { categorie: "Mathématiques", count: 51 },
  { categorie: "Économie", count: 34 },
  { categorie: "Philosophie", count: 28 },
  { categorie: "Droit", count: 19 },
];
