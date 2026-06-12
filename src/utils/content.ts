import { getEntry, type CollectionEntry } from "astro:content";

export interface CategoryDefinition {
  name: string;
  slug?: string;
  description: string;
  writingFocus: string;
  exampleTopics: string[];
  sortOrder: number;
}

const defaultCategoryDefinitions: CategoryDefinition[] = [
  {
    name: "比赛 WP",
    slug: "比赛-wp",
    description: "适合收单题解法、关键 payload、脚本和截图记录。",
    writingFocus: "更偏单题过程和解题细节，适合快速回看当时是怎么打出来的。",
    exampleTopics: ["Web 题解", "Misc 题解", "电子取证单题"],
    sortOrder: 10
  },
  {
    name: "赛后复盘",
    slug: "赛后复盘",
    description: "适合写一整场比赛的总结，不只是单题。",
    writingFocus: "更偏整场节奏、失误点、团队配合、赛后回看和后续补题计划。",
    exampleTopics: ["整场比赛总结", "赛中失误记录", "复盘清单"],
    sortOrder: 20
  },
  {
    name: "专题总结",
    slug: "专题总结",
    description: "适合长期沉淀重复出现的知识点和题型。",
    writingFocus: "更偏方法整理、知识点归纳、工具对比和做题套路总结。",
    exampleTopics: ["原型污染总结", "流量分析笔记", "常见取证思路"],
    sortOrder: 30
  }
];

export interface TagDefinition {
  name: string;
  slug?: string;
  description: string;
  learningFocus: string;
  relatedCategory: string;
  exampleTopics: string[];
  sortOrder: number;
}

const defaultTagDefinitions: TagDefinition[] = [
  {
    name: "CTF",
    slug: "ctf",
    description: "适合汇总比赛、题解和赛后复盘里反复出现的共通标签。",
    learningFocus: "更偏整体语境，适合从这里回看整类比赛内容和做题记录。",
    relatedCategory: "比赛 WP",
    exampleTopics: ["比赛记录", "赛后总结", "题型入口"],
    sortOrder: 10
  },
  {
    name: "Web",
    slug: "web",
    description: "这里会聚合 Web 题解、漏洞利用过程和相关专题总结。",
    learningFocus: "适合顺着 Web 方向看题解、漏洞点和常见利用链。",
    relatedCategory: "比赛 WP",
    exampleTopics: ["原型污染", "反序列化", "任意文件读取"],
    sortOrder: 20
  },
  {
    name: "电子取证",
    slug: "digital-forensics",
    description: "这里会集中整理电子取证、痕迹分析和取证工具相关内容。",
    learningFocus: "适合按取证思路回看文件、日志、镜像和行为分析。",
    relatedCategory: "专题总结",
    exampleTopics: ["取证流程", "痕迹定位", "分析工具"],
    sortOrder: 30
  },
  {
    name: "流量分析",
    slug: "traffic-analysis",
    description: "这里会放流量分析相关题解、抓包记录和网络取证过程。",
    learningFocus: "适合沿着协议、请求链路和数据提取过程连续阅读。",
    relatedCategory: "专题总结",
    exampleTopics: ["HTTP 流量", "协议分析", "数据提取"],
    sortOrder: 40
  },
  {
    name: "Misc",
    slug: "misc",
    description: "适合整理 Misc 方向里零散但很常见的题型和思路。",
    learningFocus: "更偏工具使用、题型辨认和临场分析路径。",
    relatedCategory: "比赛 WP",
    exampleTopics: ["文本隐写", "编码还原", "杂项分析"],
    sortOrder: 50
  }
];

export function slugifySegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\\/]/g, "-")
    .replace(/\s+/g, "-");
}

export function getContestName(post: CollectionEntry<"blog">): string {
  return post.data.contest || post.data.oj || "未命名比赛";
}

export function getContestSlug(post: CollectionEntry<"blog">): string {
  return slugifySegment(post.data.contestSlug || getContestName(post));
}

export function getContestCover(post: CollectionEntry<"blog">): string {
  return post.data.coverImage || "";
}

export function getCategoryName(post: CollectionEntry<"blog">): string {
  return post.data.category || "未分类";
}

export function getCategorySlug(post: CollectionEntry<"blog">): string {
  return slugifySegment(getCategoryName(post));
}

export async function getCategoryDefinitions(): Promise<CategoryDefinition[]> {
  const entry = await getEntry("site-categories", "categories");
  const categories =
    entry?.data.categories && entry.data.categories.length > 0
      ? entry.data.categories
      : defaultCategoryDefinitions;

  return categories
    .map((category) => ({
      ...category,
      slug: slugifySegment(category.slug || category.name),
      exampleTopics: category.exampleTopics ?? [],
      sortOrder: category.sortOrder ?? 100
    }))
    .sort(
      (a, b) =>
        a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "zh-CN")
    );
}

export async function getTagDefinitions(): Promise<TagDefinition[]> {
  const entry = await getEntry("site-tags", "tags");
  const tags =
    entry?.data.tags && entry.data.tags.length > 0
      ? entry.data.tags
      : defaultTagDefinitions;

  return tags
    .map((tag) => ({
      ...tag,
      slug: slugifySegment(tag.slug || tag.name),
      relatedCategory: tag.relatedCategory ?? "",
      exampleTopics: tag.exampleTopics ?? [],
      sortOrder: tag.sortOrder ?? 100
    }))
    .sort(
      (a, b) =>
        a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "zh-CN")
    );
}
