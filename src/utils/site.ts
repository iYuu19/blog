import { getEntry } from "astro:content";

export const defaultSiteSettings = {
  brandMark: "iYuu",
  siteTitle: "iYuu Notes",
  headerTagline: "菜鸟一枚，也在认真刷题",
  siteDescription: "iYuu 的比赛 WP、赛后复盘与专题记录。",
  homeEyebrow: "iYuu 的 Blog",
  homeTitle: "iYuu 的 blog",
  homeLead: "记录 CTF、电子取证与比赛复盘。",
  homeIntro: [
    "这里主要整理比赛 WP、赛后复盘和专题总结，内容以 CTF、电子取证等方向为主。",
    "希望这些记录既方便自己回顾，也能给后来看到的人一点参考。"
  ],
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
  aboutNote: "文章会持续补充和修订。如果某篇内容存在疏漏，后续也会根据复盘和新的理解继续更新。",
  footerDescription: "记录 CTF、电子取证与比赛复盘。",
  copyrightName: "iYuu",
  navLinks: [
    { label: "首页", href: "/" },
    { label: "比赛", href: "/contests" },
    { label: "分类", href: "/categories" },
    { label: "归档", href: "/blog" },
    { label: "标签", href: "/tags" },
    { label: "关于", href: "/about" }
  ]
};

export async function getSiteSettings() {
  const [brandEntry, homeEntry, aboutEntry, navigationEntry] = await Promise.all([
    getEntry("site-brand", "brand"),
    getEntry("site-home", "home"),
    getEntry("site-about", "about"),
    getEntry("site-navigation", "navigation")
  ]);

  return {
    ...defaultSiteSettings,
    ...(brandEntry?.data ?? {}),
    ...(homeEntry?.data ?? {}),
    ...(aboutEntry?.data ?? {}),
    ...(navigationEntry?.data ?? {})
  };
}
