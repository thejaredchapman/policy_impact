"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const changeTypes = [
  { value: "", label: "ALL" },
  { value: "EXECUTIVE_ORDER", label: "EXEC_ORDER" },
  { value: "LEGISLATION", label: "LEGISLATION" },
  { value: "AGENCY_RULE", label: "AGENCY_RULE" },
  { value: "AGENCY_PROPOSED_RULE", label: "PROPOSED_RULE" },
  { value: "AGENCY_NOTICE", label: "NOTICE" },
  { value: "APPOINTMENT", label: "APPOINTMENT" },
  { value: "PROCLAMATION", label: "PROCLAMATION" },
  { value: "MEMORANDUM", label: "MEMORANDUM" },
];

const changeStatuses = [
  { value: "", label: "ALL" },
  { value: "TRACKING", label: "TRACKING" },
  { value: "IN_EFFECT", label: "IN_EFFECT" },
  { value: "PENDING_IMPLEMENTATION", label: "PENDING" },
  { value: "CHALLENGED", label: "CHALLENGED" },
  { value: "BLOCKED", label: "BLOCKED" },
  { value: "OVERTURNED", label: "OVERTURNED" },
];

export function ChangeFilters({ agencies = [] }: { agencies?: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`/changes?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="space-y-3 mb-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-term-heading)] text-base">
            search&gt;
          </span>
          <input
            type="text"
            placeholder="___"
            defaultValue={searchParams.get("search") ?? ""}
            onChange={(e) => updateParam("search", e.target.value)}
            className="w-full pl-22 pr-4 py-2.5 text-base"
          />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[var(--color-term-dim)] text-sm whitespace-nowrap">--type=</span>
          <select
            defaultValue={searchParams.get("type") ?? ""}
            onChange={(e) => updateParam("type", e.target.value)}
            className="px-2 py-2.5 text-sm"
          >
            {changeTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[var(--color-term-dim)] text-sm whitespace-nowrap">--status=</span>
          <select
            defaultValue={searchParams.get("status") ?? ""}
            onChange={(e) => updateParam("status", e.target.value)}
            className="px-2 py-2.5 text-sm"
          >
            {changeStatuses.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-1">
          <span className="text-[var(--color-term-dim)] text-sm whitespace-nowrap">--from=</span>
          <input
            type="date"
            defaultValue={searchParams.get("dateFrom") ?? ""}
            onChange={(e) => updateParam("dateFrom", e.target.value)}
            className="px-2 py-2.5 text-sm"
          />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[var(--color-term-dim)] text-sm whitespace-nowrap">--to=</span>
          <input
            type="date"
            defaultValue={searchParams.get("dateTo") ?? ""}
            onChange={(e) => updateParam("dateTo", e.target.value)}
            className="px-2 py-2.5 text-sm"
          />
        </div>
        {agencies.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-[var(--color-term-dim)] text-sm whitespace-nowrap">--agency=</span>
            <select
              defaultValue={searchParams.get("agency") ?? ""}
              onChange={(e) => updateParam("agency", e.target.value)}
              className="px-2 py-2.5 text-sm max-w-xs"
            >
              <option value="">ALL</option>
              {agencies.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
