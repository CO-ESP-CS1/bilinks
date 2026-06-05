import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appDir = path.join(root, "src/app");

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, files);
    else if (name === "layout.tsx") files.push(p);
  }
  return files;
}

const layoutTemplate = (page) => `import { adminPageMetadata } from "@/config/metadata";

export const metadata = adminPageMetadata("${page}");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
`;

for (const file of walk(appDir)) {
  if (file.includes("(admin)") && file.endsWith("layout.tsx")) {
    const content = fs.readFileSync(file, "utf8");
    const m = content.match(/title:\s*"([^"]+)\s+—\s+B LINKS Admin"/);
    if (!m) continue;
    const page = m[1];
    if (file.endsWith("(admin)\\layout.tsx") || file.endsWith("(admin)/layout.tsx")) continue;
    fs.writeFileSync(file, layoutTemplate(page));
    console.log("OK", page, path.relative(root, file));
  }
}
