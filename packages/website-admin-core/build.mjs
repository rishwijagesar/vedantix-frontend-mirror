import { createRequire } from "node:module";
import { mkdir, copyFile } from "node:fs/promises";
const require = createRequire(import.meta.url);
// Build environments may point at an already-installed esbuild without copying it.
const { build } = process.env.VEDANTIX_ESBUILD_PATH
  ? require(process.env.VEDANTIX_ESBUILD_PATH)
  : require("esbuild");
await mkdir(new URL("./dist/", import.meta.url), { recursive: true });
await build({
  entryPoints: [new URL("./src/index.ts", import.meta.url).pathname],
  outfile: new URL("./dist/index.js", import.meta.url).pathname,
  bundle: true, format: "esm", platform: "browser", target: "es2020", jsx: "automatic",
  external: ["react", "react/*", "react-dom", "react-dom/*"],
  banner: { js: '"use client";' },
});
await copyFile(new URL("./src/index.d.ts", import.meta.url), new URL("./dist/index.d.ts", import.meta.url));
