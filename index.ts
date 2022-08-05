import * as fs from "fs";
import * as readline from "readline";

const parseLine = (line: string) => {
  const [key, ...rest] = line.replaceAll('"', "").split(":");
  return [key.trim(), rest.join(":").trim()];
};

(async () => {
  const stream = fs.createReadStream("./yarn.lock", "utf-8");
  const rl = readline.createInterface({
    input: stream,
  });

  let packageJson: { dir: string; value: any } | null = null;
  let field: { name: string; value: any } | null = null;

  for await (const line of rl) {
    if (line.startsWith("    ")) {
      // 4 spaces indent
      if (field) {
        const [name, value] = parseLine(line);
        field.value[name] = value;
      }
    } else if (line.startsWith("  ")) {
      // 2 spaces indent
      if (packageJson && field) {
        packageJson.value[field.name] = field.value;
        field = null;
      }
      const [name, value] = parseLine(line);
      if (name === "resolution") {
        if (value.includes("@workspace:")) {
          const [packageName, packageDir] = value.split("@workspace:");
          if (packageDir !== ".") {
            packageJson = { dir: packageDir, value: { name: packageName } };
          }
        }
      } else if (name === "dependencies" || name === "peerDependencies") {
        field = { name, value: {} };
      }
    } else {
      // No indent
      if (packageJson) {
        // Make sure the package directory  exists
        if (!fs.existsSync(packageJson.dir)) {
          fs.mkdirSync(packageJson.dir, { recursive: true });
        }

        // Create the package.json if not exists
        const packageJsonPath = packageJson.dir + "/package.json";
        if (!fs.existsSync(packageJsonPath)) {
          fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson.value));
        }

        packageJson = null;
      }
    }
  }
})();
