import { defineConfig } from "tsdown";

export default defineConfig({
  dts: {
    generator: "tsgo",
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
