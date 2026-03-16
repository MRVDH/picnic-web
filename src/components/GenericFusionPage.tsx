"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FusionPageRenderer } from "@/components/pml/FusionPageRenderer";

export function GenericFusionPage({ pageId }: { pageId: string }) {
  const router = useRouter();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Split pageId from query params
    const [id, qs] = pageId.split("?");
    const url = qs ? `/api/pages/${id}?${qs}` : `/api/pages/${id}`;

    fetch(url)
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
  }, [pageId]);

  if (loading) {
    return (
      <div className="page-loading">
        <div className="pml-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-error">
        <p>Er ging iets mis bij het laden van de pagina.</p>
        <p className="page-error__detail">{error}</p>
      </div>
    );
  }

  return (
    <div className="page-content">
      {page?.header?.title && (
        <div className="page-header">
          <button
            className="page-header__back"
            onClick={() => router.back()}
            aria-label="Ga terug"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <h1 className="page-header__title">{page.header.title}</h1>
        </div>
      )}
      <FusionPageRenderer body={page?.body} />
    </div>
  );
}
