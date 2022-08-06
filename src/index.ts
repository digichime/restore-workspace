import * as fs from "fs";
import * as readline from "readline";

(async () => {
  const stream = fs.createReadStream("./yarn.lock", "utf-8");
  const rl = readline.createInterface({ input: stream });

  let packageJson: { dir: string; value: any } | null = null;
  let fieldName: string | null = null;

  for await (const line of rl) {
    // Read the resolutin field until @workspace: package found
    if (!packageJson) {
      if (line.startsWith("  resolution: ") && line.includes("@workspace:")) {
        const [packageName, packageDir] = line.slice(14).replaceAll('"', "").split("@workspace:");
        if (packageDir !== ".") {
          packageJson = { dir: packageDir, value: { name: packageName } };
        }
      }
      continue;
    }

    if (fieldName) {
      // Add value to field if the line starts with 4 spaces indents
      // TODO: support peerDependenciesMeta field
      if (line.startsWith("    ")) {
        const [name, value] = line.trim().replaceAll('"', "").split(": ");
        packageJson.value[fieldName][name] = value;
        continue;
      }

      // Clear the fieldName if the line doesn't start with 4 space indents
      fieldName = null;
    }

    // Add new field to packageJson
    // TODO: support peerDependenciesMeta and bin
    if (line === "  dependencies:" || line === "  peerDependencies:") {
      fieldName = line.slice(2, -1);
      packageJson.value[fieldName] = {};
      continue;
    }

    if (line === "") {
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
      fieldName = null;
    }
  }
})();
