import { parseCookbookPage } from "@/lib/recipe/parse-cookbook";
import type { PicnicClientInstance } from "@/lib/core/picnic-client";
import type { RecipeItem } from "@/lib/core/types";

/** Fusion page holding the user's saved recipes. */
const SAVED_PAGE_ID = "saved-deep-dive-page-content";

type SendRequestClient = {
  sendRequest: (method: string, path: string, body: unknown, fusion: boolean) => Promise<unknown>;
};

/**
 * Fetch the recipes the user has saved on their Picnic account.
 *
 * Picnic owns this list — it is the single source of truth for saved state, and
 * it is what the "saved recipes" cookbook category shows.
 */
export async function fetchSavedRecipes(client: PicnicClientInstance): Promise<RecipeItem[]> {
  const rawPage = await (client as unknown as SendRequestClient).sendRequest(
    "GET",
    `/pages/${SAVED_PAGE_ID}`,
    null,
    true
  );
  return parseCookbookPage(rawPage);
}
