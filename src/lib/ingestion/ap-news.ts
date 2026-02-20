import Parser from "rss-parser";
import { POLICY_KEYWORDS } from "../utils/constants";
import type { APArticle } from "@/types";

const parser = new Parser();

function isPolicyRelevant(title: string, content: string): boolean {
  const text = `${title} ${content}`.toLowerCase();
  return POLICY_KEYWORDS.some((kw) => text.includes(kw));
}

export async function fetchAPPoliticsArticles(options: {
  maxArticles?: number;
} = {}): Promise<APArticle[]> {
  const { maxArticles = 30 } = options;
  const rssUrl =
    process.env.AP_NEWS_RSS_URL ||
    "https://rsshub.app/apnews/topics/apf-politics";

  const feed = await parser.parseURL(rssUrl);

  const articles: APArticle[] = [];

  for (const item of feed.items) {
    if (articles.length >= maxArticles) break;

    const title = item.title || "";
    const content = item.contentSnippet || item.content || "";

    if (!isPolicyRelevant(title, content)) continue;

    articles.push({
      title,
      link: item.link || "",
      pubDate: item.pubDate || new Date().toISOString(),
      contentSnippet: item.contentSnippet || "",
      content: item.content || item.contentSnippet || "",
    });
  }

  return articles;
}
