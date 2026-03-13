"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { GenericFusionPage } from "@/components/GenericFusionPage";

function DynamicPageContent({ pageId }: { pageId: string }) {
  const searchParams = useSearchParams();
  const qs = searchParams.toString();
  const fullPageId = qs ? `${pageId}?${qs}` : pageId;

  return <GenericFusionPage pageId={fullPageId} />;
}

export default function DynamicPage({ params }: { params: Promise<{ pageId: string }> }) {
  const resolvedParams = React.use(params);

  return (
    <Suspense fallback={<div className="page-loading"><div className="pml-spinner" /></div>}>
      <DynamicPageContent pageId={resolvedParams.pageId} />
    </Suspense>
  );
}
