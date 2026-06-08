import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    category: z.string().default("比赛 WP"),
    contest: z.string().default(""),
    contestSlug: z.string().default(""),
    coverImage: z.string().default(""),
    track: z.string().default(""),
    tags: z.array(z.string()).default([]),
    oj: z.string().default(""),
    difficulty: z.string(),
    language: z.string().default("Markdown"),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false)
  })
});

const siteBrand = defineCollection({
  type: "data",
  schema: z.object({
    brandMark: z.string(),
    siteTitle: z.string(),
    headerTagline: z.string(),
    siteDescription: z.string(),
    footerDescription: z.string(),
    copyrightName: z.string()
  })
});

const siteHome = defineCollection({
  type: "data",
  schema: z.object({
    homeEyebrow: z.string(),
    homeTitle: z.string(),
    homeLead: z.string(),
    homeIntro: z.array(z.string()).default([])
  })
});

const siteAbout = defineCollection({
  type: "data",
  schema: z.object({
    aboutEyebrow: z.string(),
    aboutTitle: z.string(),
    aboutIntro: z.array(z.string()).default([]),
    aboutFocusAreas: z.array(z.string()).default([]),
    aboutWritingApproach: z.array(z.string()).default([]),
    aboutNote: z.string()
  })
});

const siteNavigation = defineCollection({
  type: "data",
  schema: z.object({
    navLinks: z
      .array(
        z.object({
          label: z.string(),
          href: z.string()
        })
      )
      .default([])
  })
});

const siteCategories = defineCollection({
  type: "data",
  schema: z.object({
    categories: z
      .array(
        z.object({
          name: z.string(),
          slug: z.string().optional(),
          description: z.string(),
          writingFocus: z.string(),
          exampleTopics: z.array(z.string()).default([]),
          sortOrder: z.coerce.number().default(100)
        })
      )
      .default([])
  })
});

const siteComments = defineCollection({
  type: "data",
  schema: z.object({
    commentsEnabled: z.boolean().default(false),
    commentsTitle: z.string().default("评论区"),
    commentsDescription: z.string().default("欢迎交流、补充思路或指出文中的问题。"),
    giscusRepo: z.string().default(""),
    giscusRepoId: z.string().default(""),
    giscusCategory: z.string().default("General"),
    giscusCategoryId: z.string().default(""),
    giscusMapping: z.string().default("pathname"),
    giscusStrict: z.boolean().default(false),
    giscusReactionsEnabled: z.boolean().default(true),
    giscusInputPosition: z.string().default("bottom"),
    giscusTheme: z.string().default("light"),
    giscusLang: z.string().default("zh-CN")
  })
});

export const collections = {
  blog,
  "site-brand": siteBrand,
  "site-home": siteHome,
  "site-about": siteAbout,
  "site-navigation": siteNavigation,
  "site-categories": siteCategories,
  "site-comments": siteComments
};
