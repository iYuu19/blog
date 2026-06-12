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
    copyrightName: z.string(),
    avatarImage: z.string().default(""),
    defaultSocialImage: z.string().default(""),
    defaultCoverImage: z.string().default(""),
    faviconPath: z.string().default(""),
    socialLinks: z
      .array(
        z.object({
          label: z.string(),
          href: z.string()
        })
      )
      .default([])
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

const siteLayout = defineCollection({
  type: "data",
  schema: z.object({
    headerCtaLabel: z.string().default(""),
    headerCtaHref: z.string().default(""),
    footerPanelEyebrow: z.string().default(""),
    footerPanelTitle: z.string().default(""),
    footerPanelText: z.string().default(""),
    homeIndexTitle: z.string().default(""),
    homeIndexMetaTemplate: z.string().default(""),
    homeIndexFocusLabel: z.string().default(""),
    homeIndexFocusText: z.string().default(""),
    homeSections: z
      .array(
        z.object({
          type: z.enum([
            "featured",
            "fresh",
            "writeups",
            "contests",
            "categories",
            "routes",
            "reviews",
            "tags",
            "summaries",
            "note"
          ]),
          enabled: z.boolean().default(true),
          placement: z.enum(["main", "side"]).default("main"),
          title: z.string().default(""),
          note: z.string().default(""),
          linkLabel: z.string().default(""),
          linkHref: z.string().default(""),
          anchor: z.string().default("")
        })
      )
      .default([])
  })
});

const sitePageLayouts = defineCollection({
  type: "data",
  schema: z.object({
    aboutSections: z
      .array(
        z.object({
          type: z.enum([
            "focus",
            "writing",
            "note",
            "contests",
            "latest-posts",
            "browse-guides"
          ]),
          enabled: z.boolean().default(true),
          title: z.string().default(""),
          note: z.string().default(""),
          anchor: z.string().default("")
        })
      )
      .default([]),
    guestbookSections: z
      .array(
        z.object({
          type: z.enum(["message-ideas", "login-note", "comments"]),
          enabled: z.boolean().default(true),
          title: z.string().default(""),
          note: z.string().default(""),
          anchor: z.string().default("")
        })
      )
      .default([]),
    archiveSections: z
      .array(
        z.object({
          type: z.enum(["all-posts", "common-tags"]),
          enabled: z.boolean().default(true),
          title: z.string().default(""),
          note: z.string().default(""),
          anchor: z.string().default("")
        })
      )
      .default([]),
    categoriesSections: z
      .array(
        z.object({
          type: z.enum(["guide-cards", "category-grid"]),
          enabled: z.boolean().default(true),
          title: z.string().default(""),
          note: z.string().default(""),
          anchor: z.string().default("")
        })
      )
      .default([]),
    contestsSections: z
      .array(
        z.object({
          type: z.enum(["contest-grid"]),
          enabled: z.boolean().default(true),
          title: z.string().default(""),
          note: z.string().default(""),
          anchor: z.string().default("")
        })
      )
      .default([]),
    tagsSections: z
      .array(
        z.object({
          type: z.enum(["tag-grid"]),
          enabled: z.boolean().default(true),
          title: z.string().default(""),
          note: z.string().default(""),
          anchor: z.string().default("")
        })
      )
      .default([])
  })
});

const siteAbout = defineCollection({
  type: "data",
  schema: z.object({
    aboutEyebrow: z.string(),
    aboutTitle: z.string(),
    aboutAvatarAlt: z.string().default(""),
    aboutIntro: z.array(z.string()).default([]),
    aboutPostsLabel: z.string().default(""),
    aboutCategoriesLabel: z.string().default(""),
    aboutTagsLabel: z.string().default(""),
    contentMapLabel: z.string().default(""),
    commonTagsLabel: z.string().default(""),
    focusLabel: z.string().default(""),
    focusTitle: z.string().default(""),
    aboutFocusAreas: z.array(z.string()).default([]),
    writingLabel: z.string().default(""),
    writingTitle: z.string().default(""),
    aboutWritingApproach: z.array(z.string()).default([]),
    noteLabel: z.string().default(""),
    noteTitle: z.string().default(""),
    aboutNote: z.string(),
    contestsLabel: z.string().default(""),
    contestsEmpty: z.string().default(""),
    contestsMeta: z.string().default(""),
    latestContentHeading: z.string().default(""),
    latestContentNote: z.string().default(""),
    browseGuideLabel: z.string().default(""),
    browseGuides: z
      .array(
        z.object({
          title: z.string(),
          description: z.string()
        })
      )
      .default([])
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

const siteDetailPages = defineCollection({
  type: "data",
  schema: z.object({
    categoryPage: z.object({
      pageEyebrow: z.string(),
      pageDescriptionTemplate: z.string(),
      postsLabel: z.string(),
      contestsLabel: z.string(),
      latestUpdateLabel: z.string(),
      emptyLatestUpdateText: z.string(),
      overviewLabel: z.string(),
      overviewBody: z.string(),
      commonTagsLabel: z.string(),
      commonTagsEmpty: z.string(),
      commonTracksLabel: z.string(),
      commonTracksEmpty: z.string(),
      topicsLabel: z.string(),
      topicsEmpty: z.string(),
      emptyFeed: z.string()
    }),
    contestPage: z.object({
      pageEyebrow: z.string(),
      pageDescriptionTemplate: z.string(),
      heroIntro: z.string(),
      postCountTemplate: z.string(),
      latestPrefix: z.string()
    }),
    tagPage: z.object({
      pageEyebrow: z.string(),
      pageDescriptionTemplate: z.string(),
      heroIntroTemplate: z.string()
    })
  })
});

export const collections = {
  blog,
  "site-brand": siteBrand,
  "site-home": siteHome,
  "site-layout": siteLayout,
  "site-page-layouts": sitePageLayouts,
  "site-about": siteAbout,
  "site-navigation": siteNavigation,
  "site-categories": siteCategories,
  "site-comments": siteComments,
  "site-guestbook": siteGuestbook,
  "site-archive": siteArchive,
  "site-categories-page": siteCategoriesPage,
  "site-contests-page": siteContestsPage,
  "site-tags-page": siteTagsPage,
  "site-not-found": siteNotFound,
  "site-detail-pages": siteDetailPages
};
