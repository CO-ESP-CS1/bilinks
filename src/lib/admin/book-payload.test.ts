import { describe, expect, it } from "vitest";
import {
  buildBookFormData,
  buildUpdateBookFormData,
  readBookFormFields,
  validateCreateBookInput,
  validateUpdateBookInput,
} from "@/lib/admin/book-payload";

describe("validateCreateBookInput", () => {
  const base = {
    titre: "Test",
    auteurIds: ["a1"],
    categorieIds: [],
    bibliothequeIds: ["b1"],
    langue: "Français",
  };

  it("exige un fichier pour INTERNE en mode API", () => {
    expect(
      validateCreateBookInput(
        { ...base, type_livre: "INTERNE" },
        true
      )
    ).toMatch(/fichier/i);
  });

  it("exige url_externe_livre pour EXTERNE en mode API", () => {
    expect(
      validateCreateBookInput(
        { ...base, type_livre: "EXTERNE", bibliothequeIds: [] },
        true
      )
    ).toMatch(/URL externe/i);
  });

  it("accepte EXTERNE avec URL valide sans fichier", () => {
    expect(
      validateCreateBookInput(
        {
          ...base,
          type_livre: "EXTERNE",
          urlExterneLivre: "https://example.com/livre.pdf",
          bibliothequeIds: [],
        },
        true
      )
    ).toBeNull();
  });

  it("rejette un ISBN trop long", () => {
    expect(
      validateCreateBookInput(
        {
          ...base,
          type_livre: "INTERNE",
          isbn: "x".repeat(21),
          fichier: new File(["x"], "book.pdf", { type: "application/pdf" }),
        },
        true
      )
    ).toMatch(/ISBN/i);
  });

  it("rejette annee_publication < 1", () => {
    expect(
      validateCreateBookInput(
        {
          ...base,
          type_livre: "INTERNE",
          anneePublication: 0,
          fichier: new File(["x"], "book.pdf", { type: "application/pdf" }),
        },
        true
      )
    ).toMatch(/année/i);
  });

  it("accepte INTERNE sans bibliothèque ni langue (champs optionnels hors POST)", () => {
    expect(
      validateCreateBookInput(
        {
          ...base,
          type_livre: "INTERNE",
          bibliothequeIds: [],
          langue: "",
          fichier: new File(["x"], "book.pdf", { type: "application/pdf" }),
        },
        true
      )
    ).toBeNull();
  });
});

describe("validateUpdateBookInput", () => {
  const base = {
    titre: "Test",
    type_livre: "INTERNE" as const,
    auteurIds: ["a1"],
  };

  it("n’envoie pas type_livre et accepte fichier optionnel", () => {
    expect(
      validateUpdateBookInput({
        ...base,
        fichier: new File(["x"], "book.pdf", { type: "application/pdf" }),
      })
    ).toBeNull();
  });

  it("rejette fichier pour EXTERNE", () => {
    expect(
      validateUpdateBookInput({
        ...base,
        type_livre: "EXTERNE",
        fichier: new File(["x"], "book.pdf", { type: "application/pdf" }),
      })
    ).toMatch(/INTERNE/i);
  });
});

describe("buildUpdateBookFormData", () => {
  it("n’inclut pas type_livre et envoie file optionnel", () => {
    const file = new File(["x"], "book.pdf", { type: "application/pdf" });
    const form = buildUpdateBookFormData({
      titre: "Titre modifié",
      type_livre: "INTERNE",
      fichier: file,
      is_downloadable: true,
    });
    const fields = readBookFormFields(form);
    expect(fields.type_livre).toBeUndefined();
    expect(fields.titre).toBe("Titre modifié");
    expect(fields.is_downloadable).toBe("true");
  });

  it("force is_downloadable false pour EXTERNE", () => {
    const form = buildUpdateBookFormData({
      type_livre: "EXTERNE",
      url_externe_livre: "https://example.com/livre",
    });
    const fields = readBookFormFields(form);
    expect(fields.is_downloadable).toBe("false");
    expect(fields.url_externe_livre).toBe("https://example.com/livre");
  });
});

describe("buildBookFormData", () => {
  it("envoie file et type INTERNE sans url externe", () => {
    const file = new File(["x"], "book.pdf", { type: "application/pdf" });
    const form = buildBookFormData({
      titre: "Mon livre",
      langue: "Français",
      type_livre: "INTERNE",
      fichier: file,
    });
    const fields = readBookFormFields(form);
    expect(fields.type_livre).toBe("INTERNE");
    expect(fields.titre).toBe("Mon livre");
    expect(fields.url_externe_livre).toBeUndefined();
  });

  it("envoie url_externe_livre et is_downloadable false pour EXTERNE", () => {
    const form = buildBookFormData({
      titre: "Lien externe",
      langue: "Français",
      type_livre: "EXTERNE",
      url_externe_livre: "https://openlibrary.org/works/OL123",
    });
    const fields = readBookFormFields(form);
    expect(fields.type_livre).toBe("EXTERNE");
    expect(fields.url_externe_livre).toBe(
      "https://openlibrary.org/works/OL123"
    );
    expect(fields.is_downloadable).toBe("false");
  });

  it("envoie is_downloadable pour INTERNE", () => {
    const file = new File(["x"], "book.pdf", { type: "application/pdf" });
    const form = buildBookFormData({
      titre: "Mon livre",
      langue: "Français",
      type_livre: "INTERNE",
      fichier: file,
      is_downloadable: true,
    });
    const fields = readBookFormFields(form);
    expect(fields.is_downloadable).toBe("true");
  });
});
