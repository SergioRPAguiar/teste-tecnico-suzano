const path = require("node:path");
const fs = require("node:fs");
const { spawnSync } = require("node:child_process");
const frontend = path.resolve(__dirname, "..");
const root = path.resolve(frontend, "..");
const real = process.argv.includes("--real");
const update = process.argv.includes("--update-snapshots");
const tests = path.join(frontend, "tests");
const results = path.join(frontend, "test-results");
fs.mkdirSync(results, { recursive: true });
fs.mkdirSync(path.join(tests, "__screenshots__"), { recursive: true });

function docker(args) {
  const result = spawnSync("docker", args, { cwd: root, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
docker(["build", "-f", "frontend/Dockerfile.visual", "-t", "suzano-case-visual", "."]);
docker(["run", "--rm", "--ipc=host",
  "--mount", `type=bind,source=${tests},target=/app/tests`,
  "--mount", `type=bind,source=${results},target=/app/test-results`,
  ...(real ? ["--network", `${process.env.E2E_COMPOSE_PROJECT ?? "suzano-case"}_default`, "-e", "E2E_MODE=real", "-e", "E2E_BASE_URL=http://web:3000", "-e", "E2E_API_URL=http://api:3001",
    ...["ADMIN_USERNAME", "ADMIN_PASSWORD", "E2E_PUBLIC_API_URL"].flatMap((key) => process.env[key] ? ["-e", key] : [])] : []),
  "suzano-case-visual", "npm", "run", update ? "test:update-snapshots" : "test:e2e",
]);
