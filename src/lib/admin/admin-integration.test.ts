import { describe, expect, it } from "vitest";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import { unwrapListData } from "@/lib/api/pagination";
import {
  buildBanUserBody,
  buildAdminCreateBody,
  buildAdminUsersQuery,
  validateAdminCreateBody,
  buildPlanCreateBody,
  buildPlanUpdateBody,
  buildStatsBooksQuery,
  buildStatsSearchTermsQuery,
  buildStatsUsersQuery,
  validateChallengeTargets,
  validateSubscriptionCancelRaison,
} from "@/lib/admin/validators";

describe("validateChallengeTargets (contrat backend)", () => {
  it("exige une catégorie pour CATEGORIE", () => {
    expect(validateChallengeTargets("CATEGORIE", {})).toMatch(/catégorie/i);
    expect(
      validateChallengeTargets("CATEGORIE", {
        categorie_id: "550e8400-e29b-41d4-a716-446655440000",
      })
    ).toBeNull();
  });

  it("n’exige pas de cible pour NB_LIVRES", () => {
    expect(validateChallengeTargets("NB_LIVRES", {})).toBeNull();
  });
});

describe("validateSubscriptionCancelRaison", () => {
  it("refuse moins de 3 caractères en mode API", () => {
    expect(validateSubscriptionCancelRaison("ab", true)).toMatch(/3 caractères/);
    expect(validateSubscriptionCancelRaison("abc", true)).toBeNull();
  });
});

describe("buildPlanCreateBody", () => {
  it("utilise XAF par défaut (aligné backend)", () => {
    expect(
      buildPlanCreateBody({
        plan: "MENSUEL",
        prix: 1500,
        duree_jours: 30,
      })
    ).toEqual({
      plan: "MENSUEL",
      prix: 1500,
      devise: "XAF",
      duree_jours: 30,
    });
  });
});

describe("buildBanUserBody", () => {
  it("n’envoie raison que si renseignée", () => {
    expect(buildBanUserBody()).toEqual({});
    expect(buildBanUserBody("  spam  ")).toEqual({ raison: "spam" });
  });
});

describe("ADMIN_ROUTES.users ban/unban", () => {
  const id = "550e8400-e29b-41d4-a716-446655440000";

  it("aligne PATCH /admin/users/{id}/ban et /unban", () => {
    expect(ADMIN_ROUTES.users.ban(id)).toBe(`/admin/users/${id}/ban`);
    expect(ADMIN_ROUTES.users.unban(id)).toBe(`/admin/users/${id}/unban`);
  });
});

describe("buildAdminCreateBody", () => {
  it("aligne POST /admin/users", () => {
    expect(
      buildAdminCreateBody({
        nom: "Dupont",
        prenom: "Jean",
        email: "Admin@Example.com",
        password: "secret123",
      })
    ).toEqual({
      nom: "Dupont",
      prenom: "Jean",
      email: "admin@example.com",
      password: "secret123",
    });
  });
});

describe("validateAdminCreateBody", () => {
  it("exige 8 caractères en mode API", () => {
    expect(
      validateAdminCreateBody(
        { nom: "A", prenom: "B", email: "a@b.c", password: "short" },
        true
      )
    ).toMatch(/8 caractères/);
  });
});

describe("buildAdminUsersQuery", () => {
  it("aligne GET /admin/users", () => {
    const params = buildAdminUsersQuery({
      statut: "ACTIF",
      role: "USER",
      q: "dupont",
      page: 2,
      limit: 20,
    });
    expect(params.get("statut")).toBe("ACTIF");
    expect(params.get("role")).toBe("USER");
    expect(params.get("q")).toBe("dupont");
    expect(params.get("page")).toBe("2");
    expect(params.get("limit")).toBe("20");
  });
});

describe("buildStatsUsersQuery", () => {
  it("aligne GET /admin/stats/users", () => {
    expect(buildStatsUsersQuery({ periode: "90j" }).get("periode")).toBe("90j");
  });
});

describe("buildStatsSearchTermsQuery", () => {
  it("aligne GET /admin/stats/search-terms", () => {
    const params = buildStatsSearchTermsQuery({
      periode: "7j",
      no_results: true,
    });
    expect(params.get("periode")).toBe("7j");
    expect(params.get("no_results")).toBe("true");
  });
});

describe("buildStatsBooksQuery", () => {
  it("aligne les query params GET /admin/stats/books", () => {
    const params = buildStatsBooksQuery({
      sort: "note_moyenne",
      page: 2,
      limit: 10,
    });
    expect(params.get("sort")).toBe("note_moyenne");
    expect(params.get("page")).toBe("2");
    expect(params.get("limit")).toBe("10");
  });
});

describe("buildPlanUpdateBody", () => {
  it("n’envoie que les champs définis (PATCH partiel)", () => {
    expect(buildPlanUpdateBody({ statut: "INACTIF" })).toEqual({
      statut: "INACTIF",
    });
    expect(
      buildPlanUpdateBody({ prix: 500, duree_jours: 7, statut: "ACTIF" })
    ).toEqual({ prix: 500, duree_jours: 7, statut: "ACTIF" });
  });
});

describe("unwrapListData (enveloppes API)", () => {
  it("extrait data[] des plans et livres", () => {
    expect(unwrapListData({ data: [{ id: "1" }] })).toEqual([{ id: "1" }]);
    expect(unwrapListData([{ id: "2" }])).toEqual([{ id: "2" }]);
  });
});
