import fs from "fs";
import path from "path";

const lib = path.resolve("src/lib");
const files = fs.readdirSync(lib).filter((f) => f.endsWith("-store.ts"));

for (const file of files) {
  const p = path.join(lib, file);
  let s = fs.readFileSync(p, "utf8");
  const orig = s;

  if (s.includes("isApiConfigured") && !s.includes("API_REQUIRED_MESSAGE")) {
    s = s.replace(
      /import \{([^}]+)\} from "@\/lib\/api\/admin-list-fetch";/,
      (m, inner) => {
        if (inner.includes("API_REQUIRED_MESSAGE")) return m;
        return `import {${inner}, API_REQUIRED_MESSAGE } from "@/lib/api/admin-list-fetch";`;
      }
    );
  }

  s = s.replace(/,?\s*isDemoDataOnly/g, "");
  s = s.replace(/function setCache\(([^)]+)\): void \{\s*apiCache = ([^;]+);\s*write\w+\(\2\);\s*\}/g,
    "function setCache($1): void {\n  apiCache = $2;\n}");

  s = s.replace(
    /export function ensureAuteurs\(\): MockAuteur\[\] \{[\s\S]*?\n\}/,
    "export function ensureAuteurs(): MockAuteur[] {\n  return apiCache ?? [];\n}"
  );
  s = s.replace(
    /export function ensureCategories\(\): MockCategorie\[\] \{[\s\S]*?\n\}/,
    "export function ensureCategories(): MockCategorie[] {\n  return apiCache ?? [];\n}"
  );
  s = s.replace(
    /export function ensureLibraries\(\): MockBibliotheque\[\] \{[\s\S]*?\n\}/,
    "export function ensureLibraries(): MockBibliotheque[] {\n  return apiCache ?? [];\n}"
  );
  s = s.replace(
    /export function ensureUsers\(\): MockUtilisateur\[\] \{[\s\S]*?\n\}/,
    "export function ensureUsers(): MockUtilisateur[] {\n  return apiCache ?? [];\n}"
  );
  s = s.replace(
    /export function ensureChallenges\(\): MockDefi\[\] \{[\s\S]*?\n\}/,
    "export function ensureChallenges(): MockDefi[] {\n  return apiCache ?? [];\n}"
  );

  s = s.replace(/\n  return createAuteurLocal\(input\);\n/g, "\n  return { ok: false, error: API_REQUIRED_MESSAGE };\n");
  s = s.replace(/\n  return updateAuteurLocal\([^)]+\);\n/g, "\n  return { ok: false, error: API_REQUIRED_MESSAGE };\n");
  s = s.replace(/\n  return createUserLocal\([^)]+\);\n/g, "\n  return { ok: false, error: API_REQUIRED_MESSAGE };\n");

  s = s.replace(
    /if \(!isApiConfigured\(\)\) \{\s*return \{ data: fallbackDashboard\(\), source: "mock" \};\s*\}/,
    `if (!isApiConfigured()) {
    return {
      data: emptyDashboard(),
      source: "unavailable",
      error: API_REQUIRED_MESSAGE,
    };
  }`
  );

  s = s.replace(
    /if \(!isApiConfigured\(\)\) \{\s*return mockStatsUsersView\(\);\s*\}/g,
    `if (!isApiConfigured()) {
    return emptyStatsUsersView();
  }`
  );

  if (s !== orig) {
    fs.writeFileSync(p, s);
    console.log("updated", file);
  }
}
