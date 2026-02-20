"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ImpactBadge, ImpactBar } from "@/components/ui/ImpactBadge";
import { RubricLegend } from "@/components/ui/RubricLegend";
import { DEMOGRAPHIC_MATRIX } from "@/lib/utils/constants";
import Link from "next/link";
import type { PersonalizedImpactResult } from "@/types";

const US_STATES_SHORT = DEMOGRAPHIC_MATRIX.US_STATE;

const profileFields = [
  { key: "sex", label: "SEX", category: "SEX" },
  { key: "maritalStatus", label: "MARITAL_STATUS", category: "MARITAL_STATUS" },
  { key: "sexualOrientation", label: "SEXUAL_ORIENTATION", category: "SEXUAL_ORIENTATION" },
  { key: "religion", label: "RELIGION", category: "RELIGION" },
  { key: "ethnicity", label: "ETHNICITY", category: "ETHNICITY" },
  { key: "salaryBracket", label: "SALARY_BRACKET", category: "SALARY_BRACKET" },
  { key: "usState", label: "US_STATE", category: "US_STATE" },
  { key: "politicalAffiliation", label: "POLITICAL_AFFILIATION", category: "POLITICAL_AFFILIATION" },
] as const;

type ProfileKey = (typeof profileFields)[number]["key"];

function getStoredProfile(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem("policypulse_profile");
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export default function ImpactPage() {
  const [profile, setProfile] = useState<Record<string, string>>(getStoredProfile);
  const [result, setResult] = useState<PersonalizedImpactResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateProfile(key: string, value: string) {
    const updated = { ...profile, [key]: value };
    if (!value) delete updated[key];
    setProfile(updated);
    localStorage.setItem("policypulse_profile", JSON.stringify(updated));
  }

  async function calculateImpact() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/impact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message || "Failed to calculate impact.");
        return;
      }
      setResult(data.data);
    } catch {
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--color-term-heading)]">
          # Personalized Impact Calculator
        </h1>
        <p className="text-sm text-[var(--color-term-dim)] mt-1">
          &gt; Select your demographics to see how recent policy changes may affect you.
        </p>
      </div>

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-[var(--color-term-heading)] text-base">
            ## Your Profile
          </h2>
          <p className="text-sm text-[var(--color-term-dim)] mt-1">
            Profile is stored locally. Never sent to servers except to calculate impact scores.
          </p>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {profileFields.map((field) => {
              const options =
                DEMOGRAPHIC_MATRIX[
                  field.category as keyof typeof DEMOGRAPHIC_MATRIX
                ] || [];
              return (
                <div key={field.key}>
                  <label className="block text-sm font-bold text-[var(--color-term-heading)] mb-1">
                    {field.label}&gt;
                  </label>
                  <select
                    value={profile[field.key] || ""}
                    onChange={(e) => updateProfile(field.key, e.target.value)}
                    className="w-full px-2 py-2.5 text-sm"
                  >
                    <option value="">-- Select --</option>
                    {(field.key === "usState" ? US_STATES_SHORT : options).map(
                      (opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      )
                    )}
                  </select>
                </div>
              );
            })}
          </div>
          <div className="mt-6">
            <button
              onClick={calculateImpact}
              disabled={
                loading || Object.keys(profile).length === 0
              }
              className="px-6 py-2.5 border border-[var(--color-term-heading)] text-[var(--color-term-heading)] text-base font-bold hover:bg-[var(--color-term-heading)] hover:text-[var(--color-term-bg)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "> calculating..." : "> calculate_impact"}
            </button>
          </div>
          {error && (
            <p className="mt-3 text-sm text-[var(--color-rubric-critical)]">
              ERROR: {error}
            </p>
          )}
        </CardBody>
      </Card>

      {/* Results */}
      {result && (
        <>
          {/* Overall Score */}
          <Card>
            <CardBody>
              <p className="text-sm text-[var(--color-term-dim)] mb-2">&gt; Your Overall Impact Score</p>
              <div className="flex items-center gap-3">
                <ImpactBadge score={result.overallScore} size="lg" showLabel />
              </div>
              <p className="text-sm text-[var(--color-term-dim)] mt-2">
                Based on {result.totalPoliciesAnalyzed} policy changes analyzed
              </p>
            </CardBody>
          </Card>

          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-[var(--color-term-heading)] text-base">
                ## Impact by Category
              </h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {result.categoryBreakdown.map((cat) => (
                  <div key={cat.category}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-[var(--color-term-text)]">
                        {cat.category.replace(/_/g, " ")}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[var(--color-term-dim)]">
                          {cat.count} {cat.count === 1 ? "policy" : "policies"}
                        </span>
                        <ImpactBadge score={cat.averageScore} size="sm" />
                      </div>
                    </div>
                    <ImpactBar score={cat.averageScore} />
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Top Positive & Negative */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-[var(--color-rubric-beneficial)] text-base">
                  ## Most Positive Impact
                </h2>
              </CardHeader>
              <CardBody>
                {result.topPositive.length > 0 ? (
                  result.topPositive.map((item, idx) => (
                    <div
                      key={`${item.policyChangeId}-${item.category}`}
                      className={`py-2 ${idx > 0 ? "border-t border-[var(--color-term-border)]" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <Link
                          href={`/changes/${item.policyChangeId}`}
                          className="text-sm text-[var(--color-rubric-favorable)] hover:underline truncate flex-1"
                        >
                          {item.policyTitle}
                        </Link>
                        <ImpactBadge score={item.score} size="sm" />
                      </div>
                      <p className="text-sm text-[var(--color-term-dim)] mt-0.5 line-clamp-2">
                        {item.explanation}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[var(--color-term-dim)]">No positive impacts found.</p>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="font-semibold text-[var(--color-rubric-critical)] text-base">
                  ## Most Negative Impact
                </h2>
              </CardHeader>
              <CardBody>
                {result.topNegative.length > 0 ? (
                  result.topNegative.map((item, idx) => (
                    <div
                      key={`${item.policyChangeId}-${item.category}`}
                      className={`py-2 ${idx > 0 ? "border-t border-[var(--color-term-border)]" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <Link
                          href={`/changes/${item.policyChangeId}`}
                          className="text-sm text-[var(--color-rubric-favorable)] hover:underline truncate flex-1"
                        >
                          {item.policyTitle}
                        </Link>
                        <ImpactBadge score={item.score} size="sm" />
                      </div>
                      <p className="text-sm text-[var(--color-term-dim)] mt-0.5 line-clamp-2">
                        {item.explanation}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[var(--color-term-dim)]">No negative impacts found.</p>
                )}
              </CardBody>
            </Card>
          </div>
        </>
      )}

      {/* Rubric Legend */}
      <RubricLegend />
    </div>
  );
}
