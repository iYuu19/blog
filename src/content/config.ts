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

export const collections = { blog };
