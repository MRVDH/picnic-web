"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ProductGrid } from "@/components/product-grid";
import { SectionNavBar } from "@/components/section-nav-bar";
import { SharedHeader } from "@/components/shared-header";
import { CartProvider } from "@/contexts/cart-context";
import { CartToast } from "@/components/cart-toast";
import type {
  Product,
  SearchSection,
  SearchApiResponse,
  ApiErrorResponse,
} from "@/lib/types";

type SearchState =
  | { status: "idle" }
  | { status: "loading"; query: string }
  | {
      status: "success";
      query: string;
      products: Product[];
      sections: SearchSection[];
    }
  | { status: "error"; query: string; message: string };

export default function Home() {
  return (
    <Suspense fallback={<LoadingView />}>
      <SearchPage />
    </Suspense>
  );
}

function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlQuery = searchParams.get("q") ?? "";

  const [searchState, setSearchState] = useState<SearchState>({
    status: "idle",
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const dismissToast = useCallback(() => setToastMessage(null), []);

  const handleSearch = useCallback(
    async (query: string) => {
      const trimmed = query.trim();

      if (trimmed === "") {
        setSearchState({ status: "idle" });
        router.push("/");
        return;
      }

      router.push(`/?q=${encodeURIComponent(trimmed)}`);
      setSearchState({ status: "loading", query: trimmed });

      try {
        const url = `/api/search?q=${encodeURIComponent(trimmed)}`;
        const response = await fetch(url);
        const data: SearchApiResponse | ApiErrorResponse =
          await response.json();

        if ("error" in data) {
          if ("code" in data && data.code === "TOKEN_EXPIRED") {
            window.location.href = "/login?expired=true";
            return;
          }
          setSearchState({ status: "error", query: trimmed, message: data.error });
          return;
        }

        setSearchState({
          status: "success",
          query: trimmed,
          products: data.products,
          sections: data.sections,
        });
      } catch {
        setSearchState({
          status: "error",
          query: trimmed,
          message: "Er is iets misgegaan. Probeer het later opnieuw.",
        });
      }
    },
    [router],
  );

  // Auto-search when the page loads with ?q= or when URL changes (back/forward)
  useEffect(() => {
    if (urlQuery) {
      handleSearch(urlQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQuery]);

  return (
    <CartProvider showToast={setToastMessage}>
      <div className="flex min-h-full flex-1 flex-col">
        <SharedHeader
          bottomBar={
            searchState.status === "success" && searchState.sections.length > 0 ? (
              <SectionNavBar sections={searchState.sections} />
            ) : undefined
          }
        />

        <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
          {searchState.status === "idle" && <LandingView />}
          {searchState.status === "loading" && <LoadingView />}
          {searchState.status === "error" && (
            <ErrorView message={searchState.message} />
          )}
          {searchState.status === "success" && (
            <ResultsView
              query={searchState.query}
              products={searchState.products}
              sections={searchState.sections}
            />
          )}
        </main>

        <CartToast message={toastMessage} onDismiss={dismissToast} />
      </div>
    </CartProvider>
  );
}

// ─── Sub-views ───────────────────────────────────────────────────────────────

function LandingView() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-32 text-center">
      <PicnicLogo size="large" />
      <h1 className="mt-6 text-3xl font-bold text-foreground">
        Welkom bij Picnic Web
      </h1>
      <p className="mt-2 text-lg text-gray-500">
        Zoek je favoriete producten
      </p>
    </div>
  );
}

function LoadingView() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-picnic-red" />
    </div>
  );
}

function ErrorView({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 text-5xl">:(</div>
      <p className="text-lg text-gray-600">{message}</p>
    </div>
  );
}

function ResultsView({
  query,
  products,
  sections,
}: {
  query: string;
  products: Product[];
  sections: SearchSection[];
}) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg text-gray-600">
          Geen resultaten gevonden voor &ldquo;{query}&rdquo;
        </p>
        <p className="mt-1 text-sm text-gray-400">
          Probeer een andere zoekterm
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-4 text-sm text-gray-500">
        {products.length} {products.length === 1 ? "resultaat" : "resultaten"}{" "}
        voor &ldquo;{query}&rdquo;
      </p>
      {sections.length > 0 ? (
        <ProductGrid sections={sections} />
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
}

// ─── Picnic Logo ─────────────────────────────────────────────────────────────

function PicnicLogo({ size = "small" }: { size?: "small" | "large" }) {
  const textSize = size === "large" ? "text-5xl" : "text-2xl";

  return (
    <span
      className={`${textSize} font-bold tracking-tight text-picnic-red select-none`}
      aria-label="Picnic Web"
    >
      Picnic Web
    </span>
  );
}
