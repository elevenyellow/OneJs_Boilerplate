import { $ } from "bun";
import path from "node:path";

console.log("\n🚀 Welcome to EyJs Boilerplate Initializer!\n");

const projectName = prompt("Project name:", "my-eyjs-project") || "my-eyjs-project";

const keepApi = (prompt("Keep API? (Y/n)", "Y") || "Y").toLowerCase() === "y";
const keepAdmin = (prompt("Keep Admin? (Y/n)", "Y") || "Y").toLowerCase() === "y";
const keepWorker = (prompt("Keep Worker? (Y/n)", "Y") || "Y").toLowerCase() === "y";

const keepPost = (prompt("Keep 'post' example? (Y/n)", "n") || "n").toLowerCase() === "y";
const keepUser = (prompt("Keep 'user' example? (Y/n)", "n") || "n").toLowerCase() === "y";

const pkgPath = path.join(process.cwd(), "package.json");
const pkg = await Bun.file(pkgPath).json();

console.log("\n⏳ Initializing project...");

// 1. Update package.json name
pkg.name = projectName;

// 2. Clean up apps
if (!keepApi) {
  console.log("  - Removing apps/api...");
  await $`rm -rf apps/api`.quiet();
}
if (!keepAdmin) {
  console.log("  - Removing apps/admin...");
  await $`rm -rf apps/admin`.quiet();
}
if (!keepWorker) {
  console.log("  - Removing apps/worker...");
  await $`rm -rf apps/worker`.quiet();
}

// 3. Clean up packages
if (!keepPost) {
  console.log("  - Removing packages/post...");
  await $`rm -rf packages/post`.quiet();
}
if (!keepUser) {
  console.log("  - Removing packages/user...");
  await $`rm -rf packages/user`.quiet();
}

// 4. Update root package.json scripts based on kept apps
if (!keepApi) {
  delete pkg.scripts["start:api:prod"];
  delete pkg.scripts["start:api:dev"];
}

// 5. Finalize package.json
await Bun.write(pkgPath, JSON.stringify(pkg, null, 2));

console.log("\n✅ Project initialized successfully!");
console.log("👉 Next steps:");
console.log("  1. Run 'bun install'");
console.log("  2. Start developing!");

// 6. Self-destruct
const removeInit = (prompt("\nRemove this init script? (Y/n)", "Y") || "Y").toLowerCase() === "y";
if (removeInit) {
  console.log("  - Cleaning up initialization script...");
  await $`rm scripts/init.ts`.quiet();
  
  // Re-read and remove init script from package.json
  const finalPkg = await Bun.file(pkgPath).json();
  delete finalPkg.scripts.init;
  await Bun.write(pkgPath, JSON.stringify(finalPkg, null, 2));
}

console.log("\nReady to go! 🚀\n");

