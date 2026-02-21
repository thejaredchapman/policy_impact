import { Card, CardBody, CardHeader } from "@/components/ui/Card";

const endpoints = [
  {
    method: "GET",
    path: "/api/daily-report",
    description:
      "Returns today's daily digest including headline, summary, and individual policy change entries.",
    params: [],
    example: `{
  "success": true,
  "data": {
    "date": "2026-02-13",
    "headline": "Administration Signs Executive Order on...",
    "summary": "The administration took three policy actions...",
    "entries": [
      {
        "policyChangeId": "clx...",
        "title": "...",
        "briefSummary": "...",
        "type": "EXECUTIVE_ORDER"
      }
    ]
  }
}`,
  },
  {
    method: "GET",
    path: "/api/changes",
    description:
      "Browse and filter the policy change repository with pagination.",
    params: [
      { name: "search", type: "string", desc: "Full-text search query" },
      { name: "type", type: "enum", desc: "Filter by change type (e.g., EXECUTIVE_ORDER, AGENCY_RULE)" },
      { name: "status", type: "enum", desc: "Filter by status (e.g., IN_EFFECT, CHALLENGED)" },
      { name: "dateFrom", type: "date", desc: "Start date (YYYY-MM-DD)" },
      { name: "dateTo", type: "date", desc: "End date (YYYY-MM-DD)" },
      { name: "page", type: "number", desc: "Page number (default: 1)" },
      { name: "perPage", type: "number", desc: "Items per page (default: 20, max: 100)" },
    ],
    example: `{
  "success": true,
  "data": [...],
  "meta": { "page": 1, "perPage": 20, "total": 47 }
}`,
  },
  {
    method: "GET",
    path: "/api/changes/:id",
    description:
      "Get full details for a single policy change including impact ratings and related events.",
    params: [],
    example: `{
  "success": true,
  "data": {
    "id": "clx...",
    "title": "...",
    "summary": "...",
    "type": "EXECUTIVE_ORDER",
    "impactRatings": [...],
    "upcomingEvents": [...]
  }
}`,
  },
  {
    method: "POST",
    path: "/api/impact",
    description:
      "Calculate personalized impact scores based on demographic profile.",
    params: [
      { name: "sex", type: "string", desc: "e.g., 'Women', 'Men'" },
      { name: "ethnicity", type: "string", desc: "e.g., 'Hispanic/Latino'" },
      { name: "salaryBracket", type: "string", desc: "e.g., '$50k-$75k'" },
      { name: "usState", type: "string", desc: "e.g., 'California'" },
      { name: "religion", type: "string", desc: "e.g., 'Christian'" },
      { name: "maritalStatus", type: "string", desc: "e.g., 'Married'" },
      { name: "sexualOrientation", type: "string", desc: "e.g., 'LGBTQ+'" },
      { name: "politicalAffiliation", type: "string", desc: "e.g., 'Independent'" },
    ],
    example: `{
  "success": true,
  "data": {
    "overallScore": -0.3,
    "totalPoliciesAnalyzed": 47,
    "categoryBreakdown": [...],
    "topPositive": [...],
    "topNegative": [...]
  }
}`,
  },
  {
    method: "GET",
    path: "/api/upcoming",
    description: "List upcoming policy events (hearings, deadlines, etc.).",
    params: [
      { name: "eventType", type: "enum", desc: "Filter by type (HEARING, DEADLINE, IMPLEMENTATION, etc.)" },
      { name: "page", type: "number", desc: "Page number" },
      { name: "perPage", type: "number", desc: "Items per page" },
    ],
    example: `{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "title": "Comment period ends for...",
      "eventType": "DEADLINE",
      "eventDate": "2026-03-01T00:00:00Z"
    }
  ]
}`,
  },
  {
    method: "POST",
    path: "/api/summarize",
    description:
      "Generate a custom AI summary on a topic based on tracked policy changes.",
    params: [
      { name: "topic", type: "string", desc: "Topic to summarize (required)" },
      { name: "dateFrom", type: "date", desc: "Start date filter" },
      { name: "dateTo", type: "date", desc: "End date filter" },
    ],
    example: `{
  "success": true,
  "data": {
    "summary": "The administration has taken several actions regarding..."
  }
}`,
  },
];

export default function APIDocsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--color-term-heading)]">
          # API Documentation
        </h1>
        <p className="text-sm text-[var(--color-term-dim)] mt-1">
          &gt; man govlens-api
        </p>
        <p className="text-base text-[var(--color-term-text)] mt-2">
          GovLens provides a public REST API for accessing policy change
          data, impact ratings, and AI-generated summaries. All responses follow
          a consistent JSON envelope format.
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-[var(--color-term-heading)] text-sm">
            ## Response Format
          </h2>
        </CardHeader>
        <CardBody>
          <pre className="text-sm text-[var(--color-term-text)] bg-[var(--color-term-bg)] p-4 overflow-x-auto border border-[var(--color-term-border)]">
{`{
  "success": boolean,
  "data": <response data>,
  "error": { "code": "string", "message": "string" },  // on error
  "meta": { "page": number, "perPage": number, "total": number }  // on paginated
}`}
          </pre>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-[var(--color-term-heading)] text-sm">
            ## Rate Limiting
          </h2>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-[var(--color-term-text)]">
            API requests are rate limited to 60 requests per minute per IP
            address. The <code className="text-[var(--color-rubric-favorable)]">/api/summarize</code>{" "}
            endpoint is limited to 10 requests per minute. Rate limit status is
            returned in response headers: <code className="text-[var(--color-rubric-favorable)]">X-RateLimit-Remaining</code>.
          </p>
        </CardBody>
      </Card>

      <div className="space-y-4">
        {endpoints.map((ep) => (
          <Card key={`${ep.method}-${ep.path}`}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <span
                  className={`text-sm font-bold ${
                    ep.method === "GET"
                      ? "text-[var(--color-rubric-beneficial)]"
                      : "text-[var(--color-rubric-favorable)]"
                  }`}
                >
                  {ep.method}
                </span>
                <code className="text-base font-bold text-[var(--color-term-text)]">{ep.path}</code>
              </div>
              <p className="text-sm text-[var(--color-term-dim)] mt-2">{ep.description}</p>
            </CardHeader>
            <CardBody>
              {ep.params.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-bold text-[var(--color-term-heading)] mb-2">
                    ### Parameters
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--color-term-border)]">
                          <th className="text-left py-2 pr-4 font-bold text-[var(--color-term-dim)]">
                            NAME
                          </th>
                          <th className="text-left py-2 pr-4 font-bold text-[var(--color-term-dim)]">
                            TYPE
                          </th>
                          <th className="text-left py-2 font-bold text-[var(--color-term-dim)]">
                            DESCRIPTION
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {ep.params.map((p) => (
                          <tr key={p.name} className="border-b border-[var(--color-term-border)]">
                            <td className="py-2 pr-4">
                              <code className="text-[var(--color-rubric-favorable)]">
                                {p.name}
                              </code>
                            </td>
                            <td className="py-2 pr-4 text-[var(--color-term-dim)]">
                              {p.type}
                            </td>
                            <td className="py-2 text-[var(--color-term-text)]">{p.desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              <div>
                <h4 className="text-xs font-bold text-[var(--color-term-heading)] mb-2">
                  ### Example Response
                </h4>
                <pre className="text-sm text-[var(--color-term-text)] bg-[var(--color-term-bg)] p-4 overflow-x-auto border border-[var(--color-term-border)]">
                  {ep.example}
                </pre>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
