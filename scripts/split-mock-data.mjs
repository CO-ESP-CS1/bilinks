import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = fs.readFileSync(path.join(root, "src/lib/mock-data.ts"), "utf8");

const typePattern =
  /^export (type|interface) [\s\S]*?(?=\n\/\/|\nexport const mock|\nexport type |\nexport interface |\n*$)/gm;

const types = [...src.matchAll(typePattern)].map((m) => m[0].trim());
const mocksSrc = src
  .replace(typePattern, "")
  .replace(/^\/\/ =+[\s\S]*?^\/\/ =+\n\n/m, "")
  .trim();

const typesContent = `// Types domaine admin (UI) — source de vérité côté front\n\n${types.join("\n\n")}\n`;

const mocksContent = `// Données de démonstration — remplacées par l'API en production\nimport type {\n  MockLivre,\n  MockAuteur,\n  MockCategorie,\n  MockBibliotheque,\n  MockUtilisateur,\n  MockAbonnement,\n  MockPaiement,\n  MockCommentaire,\n  MockPlanTarifaire,\n  MockDefi,\n  MockBadge,\n  MockNotification,\n} from "@/types/admin";\n\n${mocksSrc}\n`;

fs.mkdirSync(path.join(root, "src/types"), { recursive: true });
fs.mkdirSync(path.join(root, "src/data"), { recursive: true });
fs.writeFileSync(path.join(root, "src/types/admin.ts"), typesContent);
fs.writeFileSync(path.join(root, "src/data/admin-mocks.ts"), mocksContent);
fs.writeFileSync(
  path.join(root, "src/lib/mock-data.ts"),
  `/**\n * @deprecated Préférez @/types/admin et @/data/admin-mocks\n */\nexport * from "@/types/admin";\nexport * from "@/data/admin-mocks";\n`
);
console.log("OK", { types: types.length, mocksLines: mocksSrc.split("\n").length });
