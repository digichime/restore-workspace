const fs = require("fs");

const HASHBANG = "#!/usr/bin/env node\n";
const TARGET = "./dist/index.js";

const content = fs.readFileSync(TARGET, "utf-8");
if (!content.startsWith(HASHBANG)) {
  fs.writeFileSync(TARGET, HASHBANG + content);
}
