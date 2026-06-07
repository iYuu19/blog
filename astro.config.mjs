import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://blog-cx8.pages.dev",
  integrations: [sitemap()],
  markdown: {
    shikiConfig: {
      theme: "github-light"
    }
  }
});
