import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://0xiyuu.top",
  integrations: [sitemap()],
  markdown: {
    shikiConfig: {
      theme: "github-light"
    }
  }
});
