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
    homeIntro: z.array(z.string()).default([]),
    heroLinks: z
      .array(
        z.object({
          label: z.string(),
          href: z.string()
        })
      )
      .default([]),
    browseTitle: z.string().default(""),
    browseTips: z.array(z.string()).default([]),
    commonEntryTitle: z.string().default(""),
    featuredHeading: z.string().default(""),
    freshHeading: z.string().default(""),
    freshNote: z.string().default(""),
    writeupsHeading: z.string().default(""),
    writeupsEmpty: z.string().default(""),
    contestsHeading: z.string().default(""),
    categoriesHeading: z.string().default(""),
    routesHeading: z.string().default(""),
    routesNote: z.string().default(""),
    routeCards: z
      .array(
        z.object({
          title: z.string(),
          description: z.string(),
          emptyLatestTitle: z.string().default("")
        })
      )
      .default([]),
    updateMethodHeading: z.string().default(""),
    updateMethodText: z.string().default(""),
    fillingHeading: z.string().default(""),
    fillingText: z.string().default(""),
    reviewsHeading: z.string().default(""),
    reviewsEmpty: z.string().default(""),
    tagsHeading: z.string().default(""),
    summariesHeading: z.string().default(""),
    summariesEmpty: z.string().default("")
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

const siteGuestbook = defineCollection({
  type: "data",
  schema: z.object({
    pageDescription: z.string(),
    heroEyebrow: z.string(),
    heroTitle: z.string(),
    heroLead: z.string(),
    heroIntro: z.array(z.string()).default([]),
    pillBadges: z.array(z.string()).default([]),
    quickLinks: z
      .array(
        z.object({
          label: z.string(),
          href: z.string()
        })
      )
      .default([]),
    reminderTitle: z.string(),
    reminders: z.array(z.string()).default([]),
    chatGuideTitle: z.string(),
    chatGuides: z.array(z.string()).default([]),
    messageIdeas: z
      .array(
        z.object({
          eyebrow: z.string(),
          title: z.string(),
          text: z.string()
        })
      )
      .default([]),
    loginPanelEyebrow: z.string(),
    loginPanelTitle: z.string(),
    loginPanelText: z.string(),
    commentsEyebrow: z.string(),
    commentsTitle: z.string(),
    commentsDescription: z.string()
  })
});

const siteArchive = defineCollection({
  type: "data",
  schema: z.object({
    pageTitle: z.string(),
    pageDescription: z.string(),
    heroEyebrow: z.string(),
    heroTitle: z.string(),
    heroIntro: z.string(),
    postsLabel: z.string(),
    writeupsLabel: z.string(),
    reviewsLabel: z.string(),
    indexTitle: z.string(),
    indexMeta: z.string(),
    indexBlockLabel: z.string(),
    indexBlockText: z.string(),
    allPostsHeading: z.string(),
    allPostsNote: z.string(),
    commonTagsHeading: z.string()
  })
});

const siteCategoriesPage = defineCollection({
  type: "data",
  schema: z.object({
    pageTitle: z.string(),
    pageDescription: z.string(),
    heroEyebrow: z.string(),
    heroTitle: z.string(),
    heroIntro: z.string(),
    categoriesLabel: z.string(),
    postsLabel: z.string(),
    activeLabel: z.string(),
    latestPrefix: z.string(),
    preparingText: z.string(),
    guideCards: z
      .array(
        z.object({
          eyebrow: z.string(),
          title: z.string(),
          text: z.string()
        })
      )
      .default([])
  })
});

const siteContestsPage = defineCollection({
  type: "data",
  schema: z.object({
    pageTitle: z.string(),
    pageDescription: z.string(),
    heroEyebrow: z.string(),
    heroTitle: z.string(),
    heroIntro: z.string(),
    contestLabel: z.string(),
    countSuffix: z.string(),
    tracksPrefix: z.string(),
    latestPrefix: z.string(),
    emptyTracksText: z.string()
  })
});

const siteTagsPage = defineCollection({
  type: "data",
  schema: z.object({
    pageTitle: z.string(),
    pageDescription: z.string(),
    heroEyebrow: z.string(),
    heroTitle: z.string(),
    heroIntro: z.string(),
    latestPrefix: z.string()
  })
});

const siteNotFound = defineCollection({
  type: "data",
  schema: z.object({
    pageTitle: z.string(),
    pageDescription: z.string(),
    heroEyebrow: z.string(),
    heroTitle: z.string(),
    heroIntro: z.string(),
    primaryLinkLabel: z.string(),
    secondaryLinkLabel: z.string()
  })
});

export const collections = {
  blog,
  "site-brand": siteBrand,
  "site-home": siteHome,
  "site-about": siteAbout,
  "site-navigation": siteNavigation,
  "site-categories": siteCategories,
  "site-comments": siteComments,
  "site-guestbook": siteGuestbook,
  "site-archive": siteArchive,
  "site-categories-page": siteCategoriesPage,
  "site-contests-page": siteContestsPage,
  "site-tags-page": siteTagsPage,
  "site-not-found": siteNotFound
};
