import * as fs from "fs";
import { load } from "js-yaml";

type YarnLockItem = {
  version: string;
  resolution: string;
  dependencies?: {
    [key: string]: string;
  };
  peerDependencies?: {
    [key: string]: string;
  };
  peerDependenciesMeta?: {
    [key: string]: { optional: boolean };
  };
  bin?: {
    [key: string]: string;
  };
  checksum?: string;
  languageName: string;
  linkType: string;
};

Object.entries(load(fs.readFileSync("./yarn.lock", "utf-8")) as any)
  .filter(([key]) => key !== "__metadata")
  .map(([, value]) => value as YarnLockItem)
  .filter(({ resolution }) => resolution.includes("@workspace:"))
  .forEach(({ resolution, dependencies, peerDependencies, peerDependenciesMeta, bin }) => {
    const [name, packageDir] = resolution.split("@workspace:");

    // Skip root package.json
    if (packageDir === ".") return;

    const packageJsonPath = packageDir + "/package.json";

    // Do nothing if the package.json already exists
    if (fs.existsSync(packageJsonPath)) return;

    // Create package directory if not exists
    if (!fs.existsSync(packageDir)) {
      fs.mkdirSync(packageDir, { recursive: true });
    }

    // Create package.json
    fs.writeFileSync(
      packageJsonPath,
      JSON.stringify({ name, dependencies, peerDependencies, peerDependenciesMeta, bin })
    );
  });
