import { prisma } from "../db";
import type { FederalRegisterDocument, APArticle } from "@/types";

export async function deduplicateFederalRegister(
  docs: FederalRegisterDocument[]
): Promise<FederalRegisterDocument[]> {
  if (docs.length === 0) return [];

  const docNumbers = docs.map((d) => d.document_number);
  const existing = await prisma.policyChange.findMany({
    where: { federalRegisterNumber: { in: docNumbers } },
    select: { federalRegisterNumber: true },
  });

  const existingSet = new Set(existing.map((e) => e.federalRegisterNumber));
  return docs.filter((d) => !existingSet.has(d.document_number));
}

export async function deduplicateAPNews(
  articles: APArticle[]
): Promise<APArticle[]> {
  if (articles.length === 0) return [];

  const urls = articles.map((a) => a.link);
  const existing = await prisma.policyChange.findMany({
    where: { sourceUrl: { in: urls } },
    select: { sourceUrl: true },
  });

  const existingSet = new Set(existing.map((e) => e.sourceUrl));
  return articles.filter((a) => !existingSet.has(a.link));
}
