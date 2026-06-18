import fs from "fs";
import path from "path";

const lib = path.resolve("src/lib");
const files = fs.readdirSync(lib).filter((f) => f.endsWith("-store.ts"));

const localReturn =
  /\n  return (?:create|update|delete|softDelete)[A-Za-z]+Local\([^;]*\);/g;

const localIfBlock =
  /\n  if \(!softDelete[A-Za-z]+Local\([^)]+\)\) \{\s*return \{ ok: false, error: "[^"]+" \};\s*\}\s*\n  return \{ ok: true \};/g;

for (const file of files) {
  const p = path.join(lib, file);
  let s = fs.readFileSync(p, "utf8");
  const orig = s;

  s = s.replace(localReturn, "\n  return { ok: false, error: API_REQUIRED_MESSAGE };");
  s = s.replace(
    localIfBlock,
    "\n  return { ok: false, error: API_REQUIRED_MESSAGE };"
  );

  // plans deletePlanLocal standalone
  s = s.replace(
    /\n  return deletePlanLocal\(id\);/g,
    "\n  return { ok: false, error: API_REQUIRED_MESSAGE };"
  );

  // stats books mock
  s = s.replace(
    /return \{ rows: mockStatsBookRows\(\), meta: null \};/g,
    "return { rows: [], meta: null };"
  );

  if (s !== orig) {
    fs.writeFileSync(p, s);
    console.log("fixed", file);
  }
}
