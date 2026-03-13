"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SearchBar } from "@/components/SearchBar";
import { FusionPageRenderer } from "@/components/pml/FusionPageRenderer";

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query) {
      // Load empty search page
      fetch("/api/pages/empty-search-page-root")
        .then(res => res.json())
        .then(data => { if (!data.error) setPage(data); })
        .catch(() => {});
      return;
    }

    setLoading(true);
    fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setPage(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [query]);

  return (
    <div className="page-content">
      <div className="search-page-header">
        <SearchBar />
      </div>

      {loading && (
        <div className="page-loading">
          <div className="pml-spinner" />
        </div>
      )}

      {error && (
        <div className="page-error">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && page && <FusionPageRenderer body={page?.body} />}

      {!loading && !error && !page && !query && (
        <div className="search-empty">
          <p>Zoek naar producten, recepten en meer</p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="page-loading"><div className="pml-spinner" /></div>}>
      <SearchResults />
    </Suspense>
  );
}
