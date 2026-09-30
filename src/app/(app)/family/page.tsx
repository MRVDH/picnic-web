"use client";

import { ErrorView } from "@/components/ui/error-view";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useTranslations } from "@/contexts/country-context";
import { useApiResource } from "@/hooks/use-api-resource";
import { usePageTitle } from "@/hooks/use-page-title";
import type { FamilyApiResponse, FamilyPageData, FamilyText } from "@/lib/core/user-types";

/**
 * The Mijn Family-account page, like the app's membership screen: what the
 * membership saved, its benefits and the current plan. All texts and their
 * colors come from Picnic. Read-only: switching or managing the plan is left
 * to the app.
 */
export default function FamilyPage() {
  const t = useTranslations();
  const title = t.accountFamilyAccount.replace("{highlight}", t.accountFamilyAccountHighlight);
  const { state, retry } = useApiResource<FamilyApiResponse>("/api/user/family", t.familyLoadError);
  usePageTitle(title);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <main className="mx-auto w-full max-w-xl flex-1 px-6 py-8">
        <h1 className="text-foreground mb-6 text-center text-2xl font-bold">{title}</h1>
        {state.status === "loading" && <LoadingSpinner />}
        {state.status === "error" && <ErrorView message={state.message} onRetry={retry} />}
        {state.status === "success" && <Family family={state.data} />}
      </main>
    </div>
  );
}

function Family({ family }: { family: FamilyPageData }) {
  return (
    <>
      {family.savings && (
        <section className="rounded-2xl bg-[#f0e8dd] px-6 py-8 text-center">
          <p className="inline-flex gap-1 rounded-xl bg-[#f0e8dd99] px-2 py-1">
            {family.savings.title.map((text, index) => (
              <StyledText key={index} text={text} />
            ))}
          </p>
          <p className="text-foreground mt-2 text-5xl font-semibold">{family.savings.amount}</p>
        </section>
      )}

      {family.upgrade && (
        <section
          className="mt-6 rounded-2xl border border-black/5 px-4 py-4"
          style={{ backgroundColor: family.upgrade.backgroundColor ?? undefined }}
        >
          <StyledText text={family.upgrade.title} as="p" />
          {family.upgrade.subtitle && <StyledText text={family.upgrade.subtitle} as="p" />}
        </section>
      )}

      {family.benefits.length > 0 && (
        <ul className="divide-card-border mt-4 divide-y">
          {family.benefits.map((benefit, index) => (
            <li key={index} className="py-4">
              <StyledText text={benefit} />
            </li>
          ))}
        </ul>
      )}

      {family.account && (
        <section className="border-card-border mt-4 border-t pt-6">
          <h2 className="text-foreground mb-4 text-xl font-bold">{family.account.heading.text}</h2>
          <div className="flex flex-col gap-5">
            {family.account.groups.map((group, index) => (
              <div key={index} className="flex flex-col gap-0.5">
                {group.texts.map((text, textIndex) => (
                  <StyledText key={textIndex} text={text} as="p" />
                ))}
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

/** A text with the size, color and weight Picnic sends for it. */
function StyledText({ text, as = "span" }: { text: FamilyText; as?: "span" | "p" }) {
  const Tag = as;
  return (
    <Tag
      className="text-foreground"
      style={{
        fontSize: text.size ? `${text.size}px` : undefined,
        color: text.color ?? undefined,
        fontWeight: text.weight ?? undefined,
      }}
    >
      {text.text}
    </Tag>
  );
}
