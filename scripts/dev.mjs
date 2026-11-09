// Starts the backend and the Vite dev server together (no extra dependency).
import { spawn } from "node:child_process";

const run = (name, args) => {
  const child = spawn(process.execPath, args, { stdio: "inherit" });
  child.on("exit", (code) => {
    console.log(`[${name}] exited with code ${code}`);
    process.exit(code ?? 0);
  });
  return child;
};

const children = [
  run("server", ["--env-file-if-exists=.env", "server/index.mjs"]),
  run("web", ["node_modules/vite/bin/vite.js"]),
];
for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => children.forEach((c) => c.kill(sig)));
}
