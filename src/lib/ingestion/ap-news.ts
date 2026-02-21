import Parser from "rss-parser";
import { POLICY_KEYWORDS } from "../utils/constants";
import type { APArticle } from "@/types";

const parser = new Parser();

const DEFAULT_RSS_FEEDS = [
  "https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml",
  "https://rss.politico.com/politics-news.xml",
  "https://thehill.com/feed/",
];

function isPolicyRelevant(title: string, content: string): boolean {
  const text = `${title} ${content}`.toLowerCase();
  return POLICY_KEYWORDS.some((kw) => text.includes(kw));
}

function getRSSFeeds(): string[] {
  const envFeeds = process.env.NEWS_RSS_FEEDS || process.env.AP_NEWS_RSS_URL;
  if (envFeeds) {
    return envFeeds.split(",").map((url) => url.trim()).filter(Boolean);
  }
  return DEFAULT_RSS_FEEDS;
}

export async function fetchAPPoliticsArticles(options: {
  maxArticles?: number;
} = {}): Promise<APArticle[]> {
  const { maxArticles = 50 } = options;
  const feeds = getRSSFeeds();

  const articles: APArticle[] = [];
  const seenLinks = new Set<string>();

  for (const rssUrl of feeds) {
    try {
      const feed = await parser.parseURL(rssUrl);

      for (const item of feed.items) {
        if (articles.length >= maxArticles) break;

        const title = item.title || "";
        const link = item.link || "";
        const content = item.contentSnippet || item.content || "";

        // Skip duplicates across feeds
        if (!link || seenLinks.has(link)) continue;

        if (!isPolicyRelevant(title, content)) continue;

        seenLinks.add(link);
        articles.push({
          title,
          link,
          pubDate: item.pubDate || new Date().toISOString(),
          contentSnippet: item.contentSnippet || "",
          content: item.content || item.contentSnippet || "",
        });
      }
    } catch (e) {
      // Log but continue with other feeds if one fails
      console.warn(
        `Failed to fetch RSS feed ${rssUrl}: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  return articles;
}
