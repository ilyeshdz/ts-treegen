import { defineConfig } from "tsdown";

export default defineConfig({
  dts: {
    tsgo: true,
  },
  entry: {
    index: "src/index.ts",
    node: "src/node.ts",
  },
});
