import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/client";
import {
  GENERIC_ERROR_MESSAGE,
  humanizeErrorMessage,
  messageFromApiError,
  SESSION_REQUIRED_MESSAGE,
} from "@/lib/api/errors";

describe("messageFromApiError", () => {
  it("traduit un message backend avec noms de champs techniques", () => {
    const err = new ApiError("x", 400, {
      message: "date_fin doit être postérieure à date_debut.",
    });
    expect(messageFromApiError(err)).toBe(
      "La date de fin doit être postérieure à la date de début."
    );
  });

  it("conserve un message déjà lisible", () => {
    const err = new ApiError("x", 409, { message: "ISBN déjà utilisé." });
    expect(messageFromApiError(err)).toBe("ISBN déjà utilisé.");
  });

  it("remplace les validations anglaises", () => {
    const err = new ApiError("x", 400, {
      message: "is_downloadable must be a boolean value",
    });
    expect(messageFromApiError(err)).toBe(
      "Indiquez si le livre est téléchargeable (oui ou non)."
    );
  });

  it("utilise un message de session pour 401", () => {
    const err = new ApiError("x", 401, { message: "Unauthorized" });
    expect(messageFromApiError(err)).toBe(SESSION_REQUIRED_MESSAGE);
  });

  it("masque les messages HTML ou routes API", () => {
    expect(
      humanizeErrorMessage("GET /admin/books failed with HTTP 500")
    ).toBe(GENERIC_ERROR_MESSAGE);
  });
});
