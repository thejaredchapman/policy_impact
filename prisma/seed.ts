import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create sample policy changes
  const eo1 = await prisma.policyChange.create({
    data: {
      title: "Administration Issues Executive Order on Federal Hiring",
      summary:
        "The president signed an executive order directing federal agencies to review and restructure hiring practices. The order requires agencies to submit plans within 90 days. The directive applies to all executive branch departments and prioritizes merit-based selection criteria.\n\nThe order builds on previous civil service reform efforts and responds to agency requests for updated hiring guidelines.",
      type: "EXECUTIVE_ORDER",
      status: "PENDING_IMPLEMENTATION",
      sourceUrl: "https://www.federalregister.gov/example-1",
      sourceType: "FEDERAL_REGISTER",
      federalRegisterNumber: "2026-00001",
      executiveOrderNumber: 14200,
      signingDate: new Date("2026-02-10"),
      publicationDate: new Date("2026-02-11"),
      effectiveDate: new Date("2026-05-12"),
      agencies: ["Office of Personnel Management", "Office of Management and Budget"],
      topics: ["federal hiring", "civil service", "government reform"],
      cfrReferences: ["5 CFR 300"],
      aiProvider: "seed",
      aiModel: "seed",
    },
  });

  const eo2 = await prisma.policyChange.create({
    data: {
      title: "Agency Finalizes Rule on Financial Reporting Requirements",
      summary:
        "The Securities and Exchange Commission finalized a rule updating financial disclosure requirements for publicly traded companies. The rule modifies reporting timelines and adds new categories of required disclosures.\n\nThe rule takes effect on April 1, 2026, and applies to all public companies filing with the SEC. Companies with market capitalization below $250 million receive a six-month extension.",
      type: "AGENCY_RULE",
      status: "PENDING_IMPLEMENTATION",
      sourceUrl: "https://www.federalregister.gov/example-2",
      sourceType: "FEDERAL_REGISTER",
      federalRegisterNumber: "2026-00002",
      publicationDate: new Date("2026-02-12"),
      effectiveDate: new Date("2026-04-01"),
      agencies: ["Securities and Exchange Commission"],
      topics: ["financial regulation", "corporate disclosure", "SEC"],
      cfrReferences: ["17 CFR 210", "17 CFR 229"],
      aiProvider: "seed",
      aiModel: "seed",
    },
  });

  const eo3 = await prisma.policyChange.create({
    data: {
      title: "Administration Announces Trade Tariff Adjustments",
      summary:
        "The Office of the United States Trade Representative announced adjustments to tariff rates on imported steel and aluminum products. The changes increase tariffs by 10% on steel imports from selected countries and 5% on aluminum.\n\nThe adjustment follows a Section 232 national security review completed in January 2026. Industry groups provided comment during a 60-day public comment period.",
      type: "PROCLAMATION",
      status: "IN_EFFECT",
      sourceUrl: "https://www.federalregister.gov/example-3",
      sourceType: "FEDERAL_REGISTER",
      federalRegisterNumber: "2026-00003",
      signingDate: new Date("2026-02-08"),
      publicationDate: new Date("2026-02-09"),
      effectiveDate: new Date("2026-02-09"),
      agencies: ["Office of the United States Trade Representative", "Department of Commerce"],
      topics: ["trade", "tariffs", "steel", "aluminum", "manufacturing"],
      cfrReferences: [],
      aiProvider: "seed",
      aiModel: "seed",
    },
  });

  // Create impact ratings for each policy
  const impactData = [
    // EO1 - Federal Hiring
    { policyChangeId: eo1.id, category: "SALARY_BRACKET" as const, subcategory: "$50k-$75k", score: 1, explanation: "Federal hiring reforms may expand job opportunities in the $50k-$75k salary range, which constitutes the majority of federal GS-7 to GS-11 positions.", confidence: 0.5 },
    { policyChangeId: eo1.id, category: "SALARY_BRACKET" as const, subcategory: "$75k-$100k", score: 1, explanation: "Mid-level federal positions in this salary bracket may see streamlined hiring processes under the new directive.", confidence: 0.5 },
    { policyChangeId: eo1.id, category: "US_STATE" as const, subcategory: "District of Columbia", score: 1, explanation: "The D.C. metro area, which has the highest concentration of federal workers, would be most affected by changes to federal hiring practices.", confidence: 0.7 },

    // EO2 - Financial Reporting
    { policyChangeId: eo2.id, category: "SALARY_BRACKET" as const, subcategory: "Over $250k", score: -1, explanation: "Increased compliance costs from new reporting requirements may reduce corporate profitability, potentially affecting executive compensation packages.", confidence: 0.4 },
    { policyChangeId: eo2.id, category: "SALARY_BRACKET" as const, subcategory: "$100k-$150k", score: 0, explanation: "No direct measurable impact on this salary bracket from the reporting rule changes.", confidence: 0.3 },

    // EO3 - Trade Tariffs
    { policyChangeId: eo3.id, category: "SALARY_BRACKET" as const, subcategory: "Under $25k", score: -1, explanation: "Tariff increases on steel and aluminum may raise consumer goods prices, disproportionately affecting lower-income households that spend a higher percentage of income on goods.", confidence: 0.5 },
    { policyChangeId: eo3.id, category: "SALARY_BRACKET" as const, subcategory: "$25k-$50k", score: -1, explanation: "Higher import costs on metals may increase prices for manufactured goods, automobiles, and construction, affecting household budgets in this bracket.", confidence: 0.5 },
    { policyChangeId: eo3.id, category: "US_STATE" as const, subcategory: "Pennsylvania", score: 1, explanation: "Pennsylvania's domestic steel industry may benefit from reduced foreign competition due to the tariff increase on imported steel.", confidence: 0.6 },
    { policyChangeId: eo3.id, category: "US_STATE" as const, subcategory: "Indiana", score: 1, explanation: "Indiana's steel manufacturing sector may see increased demand as imported steel becomes more expensive.", confidence: 0.6 },
    { policyChangeId: eo3.id, category: "ETHNICITY" as const, subcategory: "Hispanic/Latino", score: 0, explanation: "No direct ethnicity-specific provisions in the tariff adjustment. Impact is distributed across economic factors rather than ethnic demographics.", confidence: 0.2 },
  ];

  await prisma.impactRating.createMany({
    data: impactData.map((d) => ({
      ...d,
      aiProvider: "seed",
      aiModel: "seed",
    })),
  });

  // Create upcoming events
  await prisma.upcomingEvent.createMany({
    data: [
      {
        title: "Federal hiring reform plans due from agencies",
        description:
          "All executive branch agencies must submit restructured hiring plans to OPM as required by Executive Order 14200.",
        eventType: "DEADLINE",
        eventDate: new Date("2026-05-12"),
        policyChangeId: eo1.id,
        sourceUrl: "https://www.federalregister.gov/example-1",
      },
      {
        title: "SEC financial reporting rule takes effect",
        description:
          "New financial disclosure requirements for publicly traded companies become effective.",
        eventType: "IMPLEMENTATION",
        eventDate: new Date("2026-04-01"),
        policyChangeId: eo2.id,
        sourceUrl: "https://www.federalregister.gov/example-2",
      },
      {
        title: "SEC extended compliance deadline for small companies",
        description:
          "Companies with market capitalization below $250 million must comply with new reporting requirements by this date.",
        eventType: "DEADLINE",
        eventDate: new Date("2026-10-01"),
        policyChangeId: eo2.id,
        sourceUrl: "https://www.federalregister.gov/example-2",
      },
    ],
  });

  // Create daily digest
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.dailyDigest.create({
    data: {
      date: today,
      headline: "Administration Acts on Federal Hiring, Trade Tariffs Adjusted",
      summary:
        "The administration took action on multiple policy fronts. An executive order directs federal agencies to reform hiring practices within 90 days. Separately, tariff rates on imported steel and aluminum were increased following a national security review. The SEC also finalized new financial reporting requirements for public companies.",
      aiProvider: "seed",
      aiModel: "seed",
      entries: {
        create: [
          {
            policyChangeId: eo1.id,
            orderIndex: 1,
            briefSummary:
              "Executive order directs federal agencies to submit restructured hiring plans within 90 days, prioritizing merit-based selection criteria.",
          },
          {
            policyChangeId: eo3.id,
            orderIndex: 2,
            briefSummary:
              "Tariffs on imported steel increased 10% and aluminum 5% following a Section 232 national security review.",
          },
          {
            policyChangeId: eo2.id,
            orderIndex: 3,
            briefSummary:
              "SEC finalizes updated financial disclosure requirements for public companies, effective April 1.",
          },
        ],
      },
    },
  });

  console.log("Seed complete. Created 3 policy changes, impact ratings, events, and daily digest.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
