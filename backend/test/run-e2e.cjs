const { Client } = require("pg");
const { spawnSync } = require("node:child_process");
require("dotenv").config({ path: ".env.test", quiet: true });

async function run() {
  const url = new URL(process.env.DATABASE_URL ?? "");
  const database = decodeURIComponent(url.pathname.slice(1));
  if (!/^[a-z0-9_]+_test$/.test(database)) {
    throw new Error("Os testes exigem DATABASE_URL de um banco com nome terminado em _test.");
  }
  const adminUrl = new URL(url);
  adminUrl.pathname = "/postgres";
  const client = new Client({ connectionString: adminUrl.toString() });
  try {
    await client.connect();
    const result = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [database]);
    if (result.rowCount === 0) await client.query(`CREATE DATABASE "${database}"`);
  } finally { await client.end(); }

  for (const args of [
    ["node_modules/prisma/build/index.js", "migrate", "deploy"],
    ["node_modules/jest/bin/jest.js", "--config", "test/jest-e2e.config.cjs", "--runInBand"],
  ]) {
    const result = spawnSync(process.execPath, args, { stdio: "inherit", env: process.env });
    if (result.error) throw result.error;
    if (result.status !== 0) { process.exitCode = result.status ?? 1; return; }
  }
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
