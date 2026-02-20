import { prisma } from "../db";
import { fetchRecentDocuments, fetchDocumentFullText } from "./federal-register";
import { fetchAPPoliticsArticles } from "./ap-news";
import { deduplicateFederalRegister, deduplicateAPNews } from "./deduplication";
import { generateSummary } from "../ai/summarize";
import { analyzePolicy } from "../ai/impact-analyzer";
import { ai } from "../ai/client";
import { DAILY_DIGEST_PROMPT } from "../ai/prompts";
import type { ChangeType } from "@prisma/client";
import type { AIDigestResponse } from "@/types";

function mapFederalRegisterType(type: string, subtype: string | null): ChangeType {
  if (type === "PRESDOCU") {
    if (subtype === "executive_order") return "EXECUTIVE_ORDER";
    if (subtype === "proclamation") return "PROCLAMATION";
    if (subtype === "memorandum") return "MEMORANDUM";
    return "OTHER";
  }
  if (type === "RULE") return "AGENCY_RULE";
  if (type === "PRORULE") return "AGENCY_PROPOSED_RULE";
  if (type === "NOTICE") return "AGENCY_NOTICE";
  return "OTHER";
}

export interface IngestionResult {
  federalRegisterFound: number;
  federalRegisterNew: number;
  apNewsFound: number;
  apNewsNew: number;
  digestGenerated: boolean;
  errors: string[];
}

export async function runDailyIngestion(daysBack = 1): Promise<IngestionResult> {
  const result: IngestionResult = {
    federalRegisterFound: 0,
    federalRegisterNew: 0,
    apNewsFound: 0,
    apNewsNew: 0,
    digestGenerated: false,
    errors: [],
  };

  const startedAt = new Date();

  // Log ingestion start
  const log = await prisma.ingestionLog.create({
    data: {
      source: "FEDERAL_REGISTER",
      status: "SUCCESS",
      startedAt,
    },
  });

  try {
    // Step 1: Fetch from Federal Register
    let fedDocs: Awaited<ReturnType<typeof fetchRecentDocuments>> = [];
    try {
      fedDocs = await fetchRecentDocuments({ daysBack });
      result.federalRegisterFound = fedDocs.length;
    } catch (e) {
      result.errors.push(`Federal Register fetch failed: ${e instanceof Error ? e.message : String(e)}`);
    }

    // Step 2: Fetch from AP News
    let apArticles: Awaited<ReturnType<typeof fetchAPPoliticsArticles>> = [];
    try {
      apArticles = await fetchAPPoliticsArticles();
      result.apNewsFound = apArticles.length;
    } catch (e) {
      result.errors.push(`AP News fetch failed: ${e instanceof Error ? e.message : String(e)}`);
    }

    // Step 3: Deduplicate
    const newFedDocs = await deduplicateFederalRegister(fedDocs);
    result.federalRegisterNew = newFedDocs.length;

    const newAPArticles = await deduplicateAPNews(apArticles);
    result.apNewsNew = newAPArticles.length;

    // Step 4: Process Federal Register documents
    for (const doc of newFedDocs) {
      try {
        // Fetch full text
        let fullText = doc.abstract || doc.title;
        if (doc.raw_text_url) {
          try {
            fullText = await fetchDocumentFullText(doc.raw_text_url);
          } catch {
            // Fall back to abstract
          }
        }

        // Generate AI summary
        const { summary, model, provider } = await generateSummary(fullText);

        // Save to database
        const policyChange = await prisma.policyChange.create({
          data: {
            title: summary.headline || doc.title,
            summary: `${summary.lead}\n\n${summary.details}\n\n${summary.context}`,
            rawContent: fullText.slice(0, 50000),
            type: mapFederalRegisterType(doc.type, doc.subtype),
            sourceUrl: doc.html_url,
            sourceType: "FEDERAL_REGISTER",
            federalRegisterNumber: doc.document_number,
            executiveOrderNumber: doc.executive_order_number,
            signingDate: doc.signing_date ? new Date(doc.signing_date) : null,
            publicationDate: doc.publication_date
              ? new Date(doc.publication_date)
              : null,
            effectiveDate: doc.effective_on ? new Date(doc.effective_on) : null,
            agencies: doc.agencies.map((a) => a.name).filter(Boolean),
            topics: summary.topics,
            cfrReferences: doc.cfr_references.map(
              (r) => `${r.title} CFR ${r.part}`
            ),
            aiProvider: provider,
            aiModel: model,
          },
        });

        // Generate impact ratings
        try {
          const { ratings, model: impModel, provider: impProvider } =
            await analyzePolicy(policyChange.title, policyChange.summary, fullText);

          if (ratings.length > 0) {
            await prisma.impactRating.createMany({
              data: ratings.map((r) => ({
                policyChangeId: policyChange.id,
                category: r.category,
                subcategory: r.subcategory,
                score: r.score,
                explanation: r.explanation,
                confidence: r.confidence,
                aiProvider: impProvider,
                aiModel: impModel,
              })),
              skipDuplicates: true,
            });
          }
        } catch (e) {
          result.errors.push(
            `Impact analysis failed for ${doc.document_number}: ${e instanceof Error ? e.message : String(e)}`
          );
        }

        // Extract upcoming events from effective dates
        if (doc.effective_on) {
          const effectiveDate = new Date(doc.effective_on);
          if (effectiveDate > new Date()) {
            await prisma.upcomingEvent.create({
              data: {
                title: `${policyChange.title} takes effect`,
                description: `This policy action becomes effective on ${doc.effective_on}.`,
                eventType: "IMPLEMENTATION",
                eventDate: effectiveDate,
                policyChangeId: policyChange.id,
                sourceUrl: doc.html_url,
              },
            });
          }
        }
      } catch (e) {
        result.errors.push(
          `Processing failed for ${doc.document_number}: ${e instanceof Error ? e.message : String(e)}`
        );
      }
    }

    // Step 5: Process AP News articles
    for (const article of newAPArticles) {
      try {
        const { summary, model, provider } = await generateSummary(
          `${article.title}\n\n${article.content}`
        );

        await prisma.policyChange.create({
          data: {
            title: summary.headline || article.title,
            summary: `${summary.lead}\n\n${summary.details}\n\n${summary.context}`,
            rawContent: article.content.slice(0, 50000),
            type: summary.changeType || "OTHER",
            sourceUrl: article.link,
            sourceType: "AP_NEWS",
            publicationDate: new Date(article.pubDate),
            topics: summary.topics,
            agencies: [],
            cfrReferences: [],
            aiProvider: provider,
            aiModel: model,
          },
        });
      } catch (e) {
        result.errors.push(
          `AP article processing failed for ${article.link}: ${e instanceof Error ? e.message : String(e)}`
        );
      }
    }

    // Step 6: Generate daily digest
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysChanges = await prisma.policyChange.findMany({
      where: {
        createdAt: { gte: today },
      },
      select: {
        id: true,
        title: true,
        summary: true,
        type: true,
      },
    });

    if (todaysChanges.length > 0) {
      try {
        const digestResponse = await ai.generate(
          DAILY_DIGEST_PROMPT,
          JSON.stringify(todaysChanges),
          { responseFormat: "json", temperature: 0.3 }
        );

        const digest = JSON.parse(digestResponse.content) as AIDigestResponse;

        await prisma.dailyDigest.upsert({
          where: { date: today },
          create: {
            date: today,
            headline: digest.headline,
            summary: digest.summary,
            aiProvider: digestResponse.provider,
            aiModel: digestResponse.model,
            entries: {
              create: digest.entries
                .filter((e) =>
                  todaysChanges.some((tc) => tc.id === e.policyChangeId)
                )
                .map((e) => ({
                  policyChangeId: e.policyChangeId,
                  briefSummary: e.briefSummary,
                  orderIndex: e.orderIndex,
                })),
            },
          },
          update: {
            headline: digest.headline,
            summary: digest.summary,
            aiProvider: digestResponse.provider,
            aiModel: digestResponse.model,
          },
        });

        result.digestGenerated = true;
      } catch (e) {
        result.errors.push(
          `Digest generation failed: ${e instanceof Error ? e.message : String(e)}`
        );
      }
    }

    // Update ingestion log
    await prisma.ingestionLog.update({
      where: { id: log.id },
      data: {
        status: result.errors.length > 0 ? "PARTIAL_FAILURE" : "SUCCESS",
        documentsFound: result.federalRegisterFound + result.apNewsFound,
        documentsNew: result.federalRegisterNew + result.apNewsNew,
        errorMessage:
          result.errors.length > 0 ? result.errors.join("\n") : null,
        durationMs: Date.now() - startedAt.getTime(),
        completedAt: new Date(),
      },
    });
  } catch (e) {
    await prisma.ingestionLog.update({
      where: { id: log.id },
      data: {
        status: "FAILURE",
        errorMessage: e instanceof Error ? e.message : String(e),
        durationMs: Date.now() - startedAt.getTime(),
        completedAt: new Date(),
      },
    });
    throw e;
  }

  return result;
}
