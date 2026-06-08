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
