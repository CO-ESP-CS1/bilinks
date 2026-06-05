import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const file = path.join(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."),
  "src/data/admin-mocks.ts"
);

let src = fs.readFileSync(file, "utf8");

// Supprime les corps d'interface orphelins laissés par le split (sans "export interface")
src = src.replace(
  /(\/\/ ---[^\n]*---\s*\n)\s*id: string;[\s\S]*?\n\}\n\n(?=export const)/g,
  "$1"
);

// Supprime les lignes "export type" / "export interface" résiduelles
src = src.replace(/^export (type|interface) .+\n/gm, "");

// En-tête commentaire obsolète
src = src.replace(
  /\/\/ ={10,}[\s\S]*?\/\/ ={10,}\s*\n\n/g,
  ""
);

fs.writeFileSync(file, src);
console.log("fixed", file);
