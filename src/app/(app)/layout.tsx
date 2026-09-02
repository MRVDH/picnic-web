import { SharedHeader } from "@/components/layout/shared-header";
import { HeaderSectionsProvider } from "@/contexts/header-sections-context";

/**
 * Layout for every authenticated route. The header and mobile tab bar live
 * here, so they stay mounted while only the page content below swaps on
 * navigation. Login sits outside this group and renders without them.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <HeaderSectionsProvider>
      <SharedHeader />
      {children}
    </HeaderSectionsProvider>
  );
}
