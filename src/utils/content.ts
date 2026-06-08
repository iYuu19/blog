import type { CollectionEntry } from "astro:content";

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
