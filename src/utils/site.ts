import { getEntry } from "astro:content";

export const defaultSiteSettings = {
  brandMark: "iYuu",
  siteTitle: "iYuu Notes",
  headerTagline: "菜鸟一枚，也在认真刷题",
  siteDescription: "iYuu 的比赛 WP、赛后复盘与专题记录。",
  homeEyebrow: "iYuu 的 Blog",
  homeTitle: "iYuu 的 blog",
  homeLead: "欢迎来到我的博客，希望这些记录能对你有帮助。",
  homeIntro: [
    "这里主要整理比赛 WP、赛后复盘和专题总结，内容以 CTF、电子取证等方向为主。",
    "希望这些记录既方便自己回顾，也能给后来看到的人一点参考，欢迎交流和讨论。"
  ],
  heroLinks: [
    { label: "看比赛分类", href: "/contests" },
    { label: "看内容分类", href: "/categories" },
    { label: "看全部文章", href: "/blog" },
    { label: "看标签", href: "/tags" },
    { label: "看看这个站在写什么", href: "/about" }
  ],
  browseTitle: "浏览方式",
  browseTips: [
    "比赛页适合按赛事集中查看一整场记录",
    "分类页适合按主题浏览不同方向的内容",
    "标签页适合快速定位具体知识点"
  ],
  commonEntryTitle: "常用入口",
  featuredHeading: "先看这一篇",
  freshHeading: "最近在补这些",
  freshNote: "把零散记录慢慢补成一个自己的知识库",
  writeupsHeading: "最近比赛 WP",
  writeupsEmpty: "目前公开的比赛 WP 还不多，先从上面那篇开始，后面会慢慢把每场比赛的过程补起来。",
  contestsHeading: "按比赛分类",
  categoriesHeading: "按内容分类",
  routesHeading: "内容路线图",
  routesNote: "可以从不同内容类型进入，按自己感兴趣的方向浏览",
  routeCards: [
    {
      title: "比赛 WP",
      description: "这里主要收录单题解法、关键 payload、脚本思路和过程记录。",
      emptyLatestTitle: "这个栏目会随着后续更新慢慢补充起来。"
    },
    {
      title: "赛后复盘",
      description: "这里会放整场比赛的节奏、失误点、回看总结和补题记录。",
      emptyLatestTitle: "后面会逐步把整场比赛的复盘内容补上。"
    },
    {
      title: "专题总结",
      description: "这里会整理反复出现的知识点、工具用法和题型笔记。",
      emptyLatestTitle: "后续会把常见知识点慢慢整理到这里。"
    }
  ],
  updateMethodHeading: "更新方式",
  updateMethodText:
    "这里会尽量把题目背景、分析过程和关键结论写清楚，让每篇文章都既方便阅读，也方便后续回看。",
  fillingHeading: "持续补充中",
  fillingText:
    "除了比赛 WP，这里也会慢慢补充赛后复盘、专题总结和学习过程中的记录，让内容越来越完整。",
  reviewsHeading: "赛后复盘",
  reviewsEmpty: "这里以后会放一场比赛打完后的整体复盘，而不只是单题 WP。",
  tagsHeading: "标签",
  summariesHeading: "专题总结",
  summariesEmpty: "等比赛文章积累起来之后，再把常出现的知识点单独整理成专题。",
  aboutEyebrow: "About",
  aboutTitle: "关于这个博客",
  aboutIntro: [
    "这里主要记录比赛 WP、赛后复盘和专题总结，内容以 CTF、电子取证等方向为主。",
    "会尽量把过程写清楚，也欢迎交流和讨论。"
  ],
  aboutFocusAreas: [
    "打完比赛之后整理出来的单题 WP 和整场比赛记录。",
    "CTF Web、电子取证、流量分析这些方向里的复盘文章。",
    "比赛里反复出现的知识点和工具用法总结。"
  ],
  aboutWritingApproach: [
    "先记比赛背景、题目入口和当时的判断信号，再展开过程。",
    "尽量写出“为什么当时想到这个方向”，而不只是最后的 payload 或脚本。",
    "在能说明问题的前提下，尽量把关键步骤、证据链和复盘结论写完整。"
  ],
  aboutNote:
    "文章会持续补充和修订。如果某篇内容存在疏漏，后续也会根据复盘和新的理解继续更新。",
  footerDescription: "记录 CTF、电子取证与比赛复盘。",
  copyrightName: "iYuu",
  commentsEnabled: false,
  commentsTitle: "评论区",
  commentsDescription: "欢迎交流、补充思路或指出文中的问题。",
  giscusRepo: "iYuu19/blog",
  giscusRepoId: "",
  giscusCategory: "General",
  giscusCategoryId: "",
  giscusMapping: "pathname",
  giscusStrict: false,
  giscusReactionsEnabled: true,
  giscusInputPosition: "bottom",
  giscusTheme: "light",
  giscusLang: "zh-CN",
  navLinks: [
    { label: "首页", href: "/" },
    { label: "比赛", href: "/contests" },
    { label: "分类", href: "/categories" },
    { label: "留言板", href: "/guestbook" },
    { label: "归档", href: "/blog" },
    { label: "标签", href: "/tags" },
    { label: "关于", href: "/about" }
  ]
};

export async function getSiteSettings() {
  const [brandEntry, homeEntry, aboutEntry, navigationEntry, commentsEntry] = await Promise.all([
    getEntry("site-brand", "brand"),
    getEntry("site-home", "home"),
    getEntry("site-about", "about"),
    getEntry("site-navigation", "navigation"),
    getEntry("site-comments", "comments")
  ]);

  return {
    ...defaultSiteSettings,
    ...(brandEntry?.data ?? {}),
    ...(homeEntry?.data ?? {}),
    ...(aboutEntry?.data ?? {}),
    ...(navigationEntry?.data ?? {}),
    ...(commentsEntry?.data ?? {})
  };
}
