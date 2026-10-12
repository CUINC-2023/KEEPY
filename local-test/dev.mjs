import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const api = spawn(process.execPath, [fileURLToPath(new URL("server.mjs", import.meta.url))], {
  cwd: root,
  stdio: "inherit",
  windowsHide: true,
});
const web = spawn(
  process.execPath,
  [
    root + "node_modules/vite/bin/vite.js",
    "dev",
    "--port",
    "8083",
    "--host",
    "127.0.0.1",
    ...(process.argv.includes("--force") ? ["--force"] : []),
  ],
  { cwd: root, stdio: "inherit", windowsHide: true },
);
let exiting = false;
const finish = (code) => {
  if (exiting) return;
  exiting = true;
  api.kill();
  web.kill();
  process.exitCode = code ?? 0;
};
api.on("exit", finish);
web.on("exit", finish);
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => finish(0));
