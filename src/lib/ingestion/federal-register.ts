import type { FederalRegisterDocument } from "@/types";

const BASE_URL =
  process.env.FEDERAL_REGISTER_BASE_URL ||
  "https://www.federalregister.gov/api/v1";

export async function fetchRecentDocuments(options: {
  daysBack?: number;
  types?: string[];
  perPage?: number;
} = {}): Promise<FederalRegisterDocument[]> {
  const { daysBack = 1, types = ["PRESDOCU", "RULE", "PRORULE", "NOTICE"], perPage = 100 } = options;

  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - daysBack);

  const params = new URLSearchParams();
  params.set("conditions[publication_date][gte]", startDate.toISOString().split("T")[0]);
  types.forEach((t) => params.append("conditions[type][]", t));
  params.set("per_page", String(perPage));
  params.set("order", "newest");

  const fields = [
    "title",
    "abstract",
    "document_number",
    "type",
    "subtype",
    "publication_date",
    "signing_date",
    "effective_on",
    "agencies",
    "citation",
    "html_url",
    "raw_text_url",
    "executive_order_number",
    "cfr_references",
  ];
  fields.forEach((f) => params.append("fields[]", f));

  const url = `${BASE_URL}/documents.json?${params.toString()}`;

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(
      `Federal Register API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data.results as FederalRegisterDocument[];
}

export async function fetchAllDocuments(options: {
  dateFrom: string;
  dateTo?: string;
  types?: string[];
  perPage?: number;
  onPage?: (page: number, totalPages: number) => void;
} ): Promise<FederalRegisterDocument[]> {
  const {
    dateFrom,
    dateTo,
    types = ["PRESDOCU", "RULE", "PRORULE", "NOTICE"],
    perPage = 100,
    onPage,
  } = options;

  const fields = [
    "title",
    "abstract",
    "document_number",
    "type",
    "subtype",
    "publication_date",
    "signing_date",
    "effective_on",
    "agencies",
    "citation",
    "html_url",
    "raw_text_url",
    "executive_order_number",
    "cfr_references",
  ];

  function buildUrl(page: number): string {
    const params = new URLSearchParams();
    params.set("conditions[publication_date][gte]", dateFrom);
    if (dateTo) {
      params.set("conditions[publication_date][lte]", dateTo);
    }
    types.forEach((t) => params.append("conditions[type][]", t));
    params.set("per_page", String(perPage));
    params.set("page", String(page));
    params.set("order", "newest");
    fields.forEach((f) => params.append("fields[]", f));
    return `${BASE_URL}/documents.json?${params.toString()}`;
  }

  // Fetch first page to get total_pages
  const firstResponse = await fetch(buildUrl(1), {
    headers: { Accept: "application/json" },
  });

  if (!firstResponse.ok) {
    throw new Error(
      `Federal Register API error: ${firstResponse.status} ${firstResponse.statusText}`
    );
  }

  const firstData = await firstResponse.json();
  const totalPages: number = firstData.total_pages || 1;
  const allDocs: FederalRegisterDocument[] = [
    ...(firstData.results as FederalRegisterDocument[]),
  ];

  onPage?.(1, totalPages);

  // Fetch remaining pages
  for (let page = 2; page <= totalPages; page++) {
    // 200ms delay to be courteous to the API
    await new Promise((resolve) => setTimeout(resolve, 200));

    const response = await fetch(buildUrl(page), {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(
        `Federal Register API error on page ${page}: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    allDocs.push(...(data.results as FederalRegisterDocument[]));
    onPage?.(page, totalPages);
  }

  return allDocs;
}

export async function fetchDocumentFullText(
  rawTextUrl: string
): Promise<string> {
  const response = await fetch(rawTextUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch document text: ${response.status}`);
  }
  return response.text();
}
