import { defineConfig } from "tsdown";

export default defineConfig({
  dts: {
    tsgo: true,
  },
  entry: {
    index: "src/index.ts",
    node: "src/node.ts",
    deno: "src/deno.ts",
    bun: "src/bun.ts",
    memory: "src/memory.ts",
    cloudflare: "src/cloudflare.ts",
  },
});
