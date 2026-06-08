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

const site = defineCollection({
  type: "data",
  schema: z.object({
    brandMark: z.string(),
    siteTitle: z.string(),
    headerTagline: z.string(),
    siteDescription: z.string(),
    homeEyebrow: z.string(),
    homeTitle: z.string(),
    homeLead: z.string(),
    homeIntro: z.array(z.string()).default([]),
    aboutEyebrow: z.string(),
    aboutTitle: z.string(),
    aboutIntro: z.array(z.string()).default([]),
    aboutFocusAreas: z.array(z.string()).default([]),
    aboutWritingApproach: z.array(z.string()).default([]),
    aboutNote: z.string(),
    footerDescription: z.string(),
    copyrightName: z.string()
  })
});

export const collections = { blog, site };
