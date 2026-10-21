const { spawnSync } = require("node:child_process");
const { mkdtempSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const path = require("node:path");

let temporaryDirectory;
try {
  const cli = require.resolve("prisma/build/index.js");
  const env = { ...process.env };
  // Respeita configuracao explicita (incluindo o secret usado nos builds Docker).
  // No Windows local, inicia outro Node com as CAs antes de carregar o Prisma.
  if (process.platform === "win32" && !env.NODE_EXTRA_CA_CERTS) {
    temporaryDirectory = mkdtempSync(path.join(tmpdir(), "suzano-prisma-ca-"));
    const exported = spawnSync("powershell.exe", [
      "-NoLogo", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass",
      "-File", path.join(__dirname, "export-system-ca.ps1"), "-Directory", temporaryDirectory,
    ], { encoding: "utf8", windowsHide: true });
    if (exported.error) throw exported.error;
    if (exported.status !== 0) throw new Error(exported.stderr?.trim() || "Nao foi possivel ler as CAs raiz confiaveis do Windows.");
    const bundle = JSON.parse(exported.stdout.trim());
    if (typeof bundle.Path !== "string" || !bundle.Path) throw new Error("Bundle de CAs temporario invalido.");
    env.NODE_EXTRA_CA_CERTS = bundle.Path;
    console.log(`Prisma: ${bundle.Count} CAs raiz do Windows disponiveis temporariamente; HTTPS permanece validado.`);
  }

  const result = spawnSync(process.execPath, [cli, ...process.argv.slice(2)], { stdio: "inherit", env });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  if (temporaryDirectory) {
    try { rmSync(temporaryDirectory, { recursive: true, force: true, maxRetries: 2, retryDelay: 100 }); }
    catch { console.error(`Nao foi possivel remover o bundle temporario: ${temporaryDirectory}`); }
  }
}
