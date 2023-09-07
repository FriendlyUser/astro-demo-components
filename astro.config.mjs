import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";

import vue from "@astrojs/vue";

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), vue({ jsx: true })],
  site: "https://friendlyuser.github.io/astro-demo-components",
  base: "/astro-demo-components/",
});