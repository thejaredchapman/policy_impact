import { prisma } from "../db";
import { fetchAllDocuments } from "./federal-register";
import type { FederalRegisterDocument } from "@/types";
import type { ChangeType } from "@prisma/client";

function mapFederalRegisterType(
  type: string,
  subtype: string | null
): ChangeType {
  const t = type.toUpperCase();
  const s = subtype?.toLowerCase() ?? null;
  if (t === "PRESDOCU" || t === "PRESIDENTIAL DOCUMENT") {
    if (s === "executive_order") return "EXECUTIVE_ORDER";
    if (s === "proclamation") return "PROCLAMATION";
    if (s === "memorandum") return "MEMORANDUM";
    return "OTHER";
  }
  if (t === "RULE") return "AGENCY_RULE";
  if (t === "PRORULE" || t === "PROPOSED RULE") return "AGENCY_PROPOSED_RULE";
  if (t === "NOTICE") return "AGENCY_NOTICE";
  return "OTHER";
}

function extractTopics(title: string, abstract: string | null): string[] {
  const text = `${title} ${abstract || ""}`.toLowerCase();
  const topicKeywords: Record<string, string[]> = {
    immigration: ["immigration", "immigrant", "border", "visa", "asylum", "deportation", "refugee", "daca", "migrant"],
    trade: ["tariff", "trade", "import", "export", "customs", "commerce"],
    healthcare: ["health", "medicare", "medicaid", "pharmaceutical", "drug pricing", "hospital", "medical"],
    environment: ["climate", "environmental", "emission", "pollution", "epa", "clean air", "clean water", "energy"],
    education: ["education", "student", "school", "university", "college", "loan forgiveness"],
    defense: ["defense", "military", "armed forces", "nato", "security", "veteran"],
    economy: ["economic", "inflation", "tax", "fiscal", "budget", "debt", "treasury"],
    labor: ["labor", "worker", "employment", "wage", "union", "workplace", "osha"],
    housing: ["housing", "rent", "mortgage", "hud", "homelessness"],
    technology: ["technology", "ai", "artificial intelligence", "cyber", "data privacy", "digital"],
    justice: ["justice", "crime", "law enforcement", "prison", "sentencing", "civil rights"],
    agriculture: ["agriculture", "farm", "usda", "food safety", "crop"],
    transportation: ["transportation", "infrastructure", "highway", "aviation", "railroad"],
    foreign_policy: ["foreign policy", "diplomatic", "sanctions", "embassy", "international"],
    firearms: ["firearm", "gun", "atf", "second amendment"],
    dei: ["diversity", "equity", "inclusion", "dei", "affirmative action"],
  };

  const found: string[] = [];
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some((kw) => text.includes(kw))) {
      found.push(topic);
    }
  }
  return found.length > 0 ? found : ["general"];
}

export interface BulkIngestResult {
  totalFetched: number;
  totalNew: number;
  totalInserted: number;
  errors: string[];
}

export async function runBulkIngestion(options: {
  dateFrom?: string;
  dateTo?: string;
  onProgress?: (message: string) => void;
}): Promise<BulkIngestResult> {
  const {
    dateFrom = "2025-01-20",
    dateTo,
    onProgress = () => {},
  } = options;

  const result: BulkIngestResult = {
    totalFetched: 0,
    totalNew: 0,
    totalInserted: 0,
    errors: [],
  };

  const startedAt = new Date();

  // Create ingestion log
  const log = await prisma.ingestionLog.create({
    data: {
      source: "FEDERAL_REGISTER",
      status: "SUCCESS",
      startedAt,
    },
  });

  try {
    // Step 1: Fetch all documents with pagination
    onProgress(`Fetching documents from ${dateFrom}${dateTo ? ` to ${dateTo}` : " to present"}...`);

    const allDocs = await fetchAllDocuments({
      dateFrom,
      dateTo,
      onPage: (page, totalPages) => {
        onProgress(`  Fetched page ${page}/${totalPages}`);
      },
    });

    result.totalFetched = allDocs.length;
    onProgress(`Total documents fetched: ${allDocs.length}`);

    // Step 2: Deduplicate in batches of 50
    const BATCH_SIZE = 50;
    const newDocs: FederalRegisterDocument[] = [];

    for (let i = 0; i < allDocs.length; i += BATCH_SIZE) {
      const batch = allDocs.slice(i, i + BATCH_SIZE);
      const docNumbers = batch.map((d) => d.document_number);

      const existing = await prisma.policyChange.findMany({
        where: { federalRegisterNumber: { in: docNumbers } },
        select: { federalRegisterNumber: true },
      });

      const existingSet = new Set(
        existing.map((e) => e.federalRegisterNumber)
      );
      const batchNew = batch.filter(
        (d) => !existingSet.has(d.document_number)
      );
      newDocs.push(...batchNew);
    }

    result.totalNew = newDocs.length;
    onProgress(`New documents to insert: ${newDocs.length} (${allDocs.length - newDocs.length} already in DB)`);

    // Step 3: Insert new documents (no AI - use abstract as summary)
    for (let i = 0; i < newDocs.length; i++) {
      const doc = newDocs[i];
      try {
        const summary =
          doc.abstract || `${doc.title}. Published ${doc.publication_date}.`;
        const topics = extractTopics(doc.title, doc.abstract);

        const policyChange = await prisma.policyChange.create({
          data: {
            title: doc.title,
            summary,
            rawContent: (doc.abstract || doc.title).slice(0, 50000),
            type: mapFederalRegisterType(doc.type, doc.subtype),
            sourceUrl: doc.html_url,
            sourceType: "FEDERAL_REGISTER",
            federalRegisterNumber: doc.document_number,
            executiveOrderNumber: doc.executive_order_number != null
              ? Number(doc.executive_order_number)
              : null,
            signingDate: doc.signing_date
              ? new Date(doc.signing_date)
              : null,
            publicationDate: doc.publication_date
              ? new Date(doc.publication_date)
              : null,
            effectiveDate: doc.effective_on
              ? new Date(doc.effective_on)
              : null,
            agencies: doc.agencies.map((a) => a.name).filter(Boolean),
            topics,
            cfrReferences: doc.cfr_references.map(
              (r) => `${r.title} CFR ${r.part}`
            ),
          },
        });

        // Create upcoming event for future effective dates
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

        result.totalInserted++;

        if ((i + 1) % 25 === 0 || i === newDocs.length - 1) {
          onProgress(`  Inserted ${i + 1}/${newDocs.length} documents`);
        }
      } catch (e) {
        const msg = `Failed to insert ${doc.document_number}: ${e instanceof Error ? e.message : String(e)}`;
        result.errors.push(msg);
      }
    }

    // Step 4: Update ingestion log
    await prisma.ingestionLog.update({
      where: { id: log.id },
      data: {
        status: result.errors.length > 0 ? "PARTIAL_FAILURE" : "SUCCESS",
        documentsFound: result.totalFetched,
        documentsNew: result.totalNew,
        errorMessage:
          result.errors.length > 0
            ? result.errors.slice(0, 20).join("\n")
            : null,
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
