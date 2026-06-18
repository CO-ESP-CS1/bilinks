/** Construction et validation des payloads livre — aligné POST/PATCH /admin/books. */

import {
  BOOK_FILE_MAX_BYTES,
  isAcceptedBookFile,
} from "@/lib/book-file";

export type TypeLivre = "INTERNE" | "EXTERNE";

const TITRE_MAX = 300;
const ISBN_MAX = 20;
const MAISON_EDITION_MAX = 200;

export type BuildBookFormInput = {
  titre: string;
  langue: string;
  type_livre?: TypeLivre;
  url_externe_livre?: string;
  anneePublication?: number | null;
  nombrePages?: number | null;
  isbn?: string;
  resume?: string;
  maison_edition?: string;
  fichier?: File;
  couvertureFile?: File;
  is_downloadable?: boolean;
};

export type UpdateBookPersistedInput = {
  titre: string;
  langue?: string;
  type_livre: TypeLivre;
  urlExterneLivre?: string;
  anneePublication?: number | null;
  nombrePages?: number | null;
  isbn?: string;
  resume?: string;
  maisonEdition?: string;
  couvertureFile?: File;
  fichier?: File;
  is_downloadable?: boolean;
  auteurIds: string[];
  categorieIds?: string[];
  statut?: "PUBLIE" | "ARCHIVE";
  previousStatut?: "PUBLIE" | "ARCHIVE";
};

export type BuildUpdateBookFormInput = {
  titre?: string;
  langue?: string;
  type_livre: TypeLivre;
  url_externe_livre?: string;
  anneePublication?: number | null;
  nombrePages?: number | null;
  isbn?: string;
  resume?: string;
  maison_edition?: string;
  fichier?: File;
  couvertureFile?: File;
  is_downloadable?: boolean;
};

export type CreateBookPersistedInput = {
  titre: string;
  auteurIds: string[];
  categorieIds: string[];
  bibliothequeIds: string[];
  langue?: string;
  type_livre?: TypeLivre;
  urlExterneLivre?: string;
  anneePublication?: number | null;
  nombrePages?: number | null;
  couvertureFile?: File;
  fichier?: File;
  isbn?: string;
  resume?: string;
  maisonEdition?: string;
  is_downloadable?: boolean;
};

function validateOptionalPositiveInt(
  value: number | null | undefined,
  label: string
): string | null {
  if (value == null) return null;
  if (!Number.isInteger(value) || value < 1) {
    return `${label} doit être un entier ≥ 1.`;
  }
  return null;
}

export function validateCreateBookInput(
  input: CreateBookPersistedInput,
  apiMode: boolean
): string | null {
  const titre = input.titre.trim();
  if (!titre) {
    return "Le titre est obligatoire.";
  }
  if (titre.length > TITRE_MAX) {
    return `Le titre ne peut pas dépasser ${TITRE_MAX} caractères.`;
  }
  if (input.isbn?.trim() && input.isbn.trim().length > ISBN_MAX) {
    return `L’ISBN ne peut pas dépasser ${ISBN_MAX} caractères.`;
  }
  if (
    input.maisonEdition?.trim() &&
    input.maisonEdition.trim().length > MAISON_EDITION_MAX
  ) {
    return `La maison d’édition ne peut pas dépasser ${MAISON_EDITION_MAX} caractères.`;
  }

  const anneeError = validateOptionalPositiveInt(
    input.anneePublication,
    "L’année de publication"
  );
  if (anneeError) return anneeError;

  const pagesError = validateOptionalPositiveInt(
    input.nombrePages,
    "Le nombre de pages"
  );
  if (pagesError) return pagesError;

  const type = input.type_livre ?? "INTERNE";

  if (!apiMode) {
    if (input.auteurIds.length === 0) {
      return "Sélectionnez au moins un auteur.";
    }
    if (!input.langue?.trim()) {
      return "La langue est obligatoire.";
    }
    return null;
  }

  if (input.auteurIds.length === 0) {
    return "Sélectionnez au moins un auteur.";
  }

  if (type === "INTERNE") {
    if (!input.fichier) {
      return "Le fichier du livre est obligatoire (INTERNE).";
    }
    if (!isAcceptedBookFile(input.fichier)) {
      return "Format non pris en charge. Utilisez PDF, EPUB ou MOBI.";
    }
    if (input.fichier.size > BOOK_FILE_MAX_BYTES) {
      return "Le fichier dépasse la taille maximale (50 Mo).";
    }
    return null;
  }

  if (!input.urlExterneLivre?.trim()) {
    return "L’URL externe est obligatoire pour un livre EXTERNE.";
  }
  try {
    new URL(input.urlExterneLivre.trim());
  } catch {
    return "L’URL externe n’est pas valide.";
  }
  return null;
}

export function validateUpdateBookInput(
  input: UpdateBookPersistedInput
): string | null {
  const titre = input.titre.trim();
  if (!titre) return "Le titre est obligatoire.";
  if (titre.length > TITRE_MAX) {
    return `Le titre ne peut pas dépasser ${TITRE_MAX} caractères.`;
  }
  if (input.isbn?.trim() && input.isbn.trim().length > ISBN_MAX) {
    return `L’ISBN ne peut pas dépasser ${ISBN_MAX} caractères.`;
  }
  if (
    input.maisonEdition?.trim() &&
    input.maisonEdition.trim().length > MAISON_EDITION_MAX
  ) {
    return `La maison d’édition ne peut pas dépasser ${MAISON_EDITION_MAX} caractères.`;
  }

  const anneeError = validateOptionalPositiveInt(
    input.anneePublication,
    "L’année de publication"
  );
  if (anneeError) return anneeError;

  const pagesError = validateOptionalPositiveInt(
    input.nombrePages,
    "Le nombre de pages"
  );
  if (pagesError) return pagesError;

  if (input.auteurIds.length === 0) {
    return "Sélectionnez au moins un auteur.";
  }

  if (input.fichier) {
    if (input.type_livre !== "INTERNE") {
      return "Le remplacement de fichier est réservé aux livres internes.";
    }
    if (!isAcceptedBookFile(input.fichier)) {
      return "Format non pris en charge. Utilisez PDF, EPUB ou MOBI.";
    }
    if (input.fichier.size > BOOK_FILE_MAX_BYTES) {
      return "Le fichier dépasse la taille maximale (50 Mo).";
    }
  }

  if (input.type_livre === "EXTERNE" && input.urlExterneLivre?.trim()) {
    try {
      new URL(input.urlExterneLivre.trim());
    } catch {
      return "L’URL externe n’est pas valide.";
    }
  }

  return null;
}

export function buildUpdateBookFormData(
  input: BuildUpdateBookFormInput
): FormData {
  const form = new FormData();
  if (input.titre?.trim()) form.set("titre", input.titre.trim());
  if (input.langue?.trim()) form.set("langue", input.langue.trim());
  if (input.isbn?.trim()) form.set("isbn", input.isbn.trim());
  if (input.resume?.trim()) form.set("resume", input.resume.trim());
  if (input.maison_edition?.trim()) {
    form.set("maison_edition", input.maison_edition.trim());
  }

  if (input.type_livre === "EXTERNE") {
    if (input.url_externe_livre?.trim()) {
      form.set("url_externe_livre", input.url_externe_livre.trim());
    }
    form.set("is_downloadable", "false");
  } else if (input.is_downloadable !== undefined) {
    form.set("is_downloadable", String(input.is_downloadable));
  }

  if (
    input.anneePublication != null &&
    Number.isInteger(input.anneePublication) &&
    input.anneePublication >= 1
  ) {
    form.set("annee_publication", String(input.anneePublication));
  }
  if (
    input.nombrePages != null &&
    Number.isInteger(input.nombrePages) &&
    input.nombrePages >= 1
  ) {
    form.set("nombre_pages", String(input.nombrePages));
  }

  if (input.type_livre === "INTERNE" && input.fichier) {
    form.append("file", input.fichier, input.fichier.name);
  }
  if (input.couvertureFile) {
    form.append("couverture", input.couvertureFile, input.couvertureFile.name);
  }
  return form;
}

export function buildBookFormData(input: BuildBookFormInput): FormData {
  const type = input.type_livre ?? "INTERNE";
  const form = new FormData();
  form.set("titre", input.titre.trim());
  form.set("type_livre", type);
  form.set("langue", (input.langue?.trim() || "Français"));

  if (type === "EXTERNE" && input.url_externe_livre?.trim()) {
    form.set("url_externe_livre", input.url_externe_livre.trim());
    form.set("is_downloadable", "false");
  } else {
    form.set("is_downloadable", String(input.is_downloadable ?? false));
  }

  if (
    input.anneePublication != null &&
    Number.isInteger(input.anneePublication) &&
    input.anneePublication >= 1
  ) {
    form.set("annee_publication", String(input.anneePublication));
  }
  if (
    input.nombrePages != null &&
    Number.isInteger(input.nombrePages) &&
    input.nombrePages >= 1
  ) {
    form.set("nombre_pages", String(input.nombrePages));
  }
  if (input.isbn?.trim()) form.set("isbn", input.isbn.trim());
  if (input.resume?.trim()) form.set("resume", input.resume.trim());
  if (input.maison_edition?.trim()) {
    form.set("maison_edition", input.maison_edition.trim());
  }

  if (type === "INTERNE" && input.fichier) {
    form.append("file", input.fichier, input.fichier.name);
  }
  if (input.couvertureFile) {
    form.append("couverture", input.couvertureFile, input.couvertureFile.name);
  }
  return form;
}

/** Lit les champs d’un FormData (tests d’intégration sans multipart réel). */
export function readBookFormFields(form: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  form.forEach((value, key) => {
    if (typeof value === "string") out[key] = value;
  });
  return out;
}
