// Parser for GET /wallet/transactions/{id} (picnic-api
// `payment.getWalletTransactionDetails`): the payment the app shows as
// "Betaling", with the order lines it covers.
import { mapOrderLineToCartItem } from "@/lib/cart/parse-cart";
import { asArray, asNumber, asString, isObject } from "@/lib/core/type-guards";
import type { TransactionDetailData, TransactionSubstitution } from "@/lib/core/wallet-types";
import { mapReturnedContainers } from "@/lib/delivery/parse-delivery-detail";

type RecordNode = Record<string, unknown>;

/** Parse a wallet transaction into the payment detail. */
export function parseTransactionDetail(id: string, raw: unknown): TransactionDetailData {
  const data: RecordNode = isObject(raw) ? raw : {};
  const lines = asArray(data["shop_items"]).filter(isObject);

  const substitutions = asArray(data["article_issue_refunds"])
    .filter(isObject)
    .flatMap((refund) => {
      const substitution = mapSubstitution(refund, lines);
      return substitution ? [substitution] : [];
    });

  // Substituted products show up in the substitution rows instead, like the app.
  const substitutedIds = new Set(
    asArray(data["article_issue_refunds"])
      .filter(isObject)
      .filter((refund) => asArray(refund["substitutions"]).length > 0)
      .map((refund) => asString(refund["article_id"]))
  );
  const items = lines
    .filter((line) => !lineArticleIds(line).some((articleId) => substitutedIds.has(articleId)))
    .map(mapOrderLineToCartItem)
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const depositTotal = asArray(data["deposits"])
    .filter(isObject)
    .reduce((sum, deposit) => sum + asNumber(deposit["value"]) * asNumber(deposit["count"]), 0);
  const returnedContainers = mapReturnedContainers(data["returned_containers"]);

  const displayName = asString(data["payment_option_display_name"]);
  const timestamp = asNumber(data["payment_execution_timestamp"]);

  return {
    id,
    deliveryId: asString(data["delivery_id"]) || null,
    paidAt: timestamp > 0 ? timestamp : null,
    amount: asNumber(data["amount_in_cents"]),
    type: asString(data["transaction_type"]),
    status: asString(data["transaction_status"]),
    items,
    substitutions,
    depositTotal,
    // Returned container prices are already per line (quantity included).
    returnedDepositTotal: returnedContainers.reduce((sum, container) => sum + container.price, 0),
    returnedContainers,
    paymentMethod: displayName
      ? {
          displayName,
          account: asString(data["payment_option_account"]) || null,
          iconUrl: asString(data["payment_method_icon_url"]) || null,
        }
      : null,
  };
}

/**
 * A refund with substitutions: the missing article (looked up in the order
 * lines for its name and image) and what replaced it.
 */
function mapSubstitution(refund: RecordNode, lines: RecordNode[]): TransactionSubstitution | null {
  const replacements = asArray(refund["substitutions"])
    .filter(isObject)
    .map((sub) => ({
      name: asString(sub["name"]),
      imageId: asString(asArray(sub["image_ids"])[0]) || null,
      quantity: asNumber(sub["quantity"], 1),
    }));
  if (replacements.length === 0) return null;

  const articleId = asString(refund["article_id"]);
  const article = findArticle(lines, articleId);

  return {
    original: {
      name: asString(article?.["name"]),
      imageId: asString(asArray(article?.["image_ids"])[0]) || null,
      quantity: asNumber(refund["quantity"], 1),
    },
    refundAmount: asNumber(refund["amount"]),
    replacements,
  };
}

function findArticle(lines: RecordNode[], articleId: string): RecordNode | null {
  for (const line of lines) {
    for (const article of asArray(line["items"]).filter(isObject)) {
      if (asString(article["id"]) === articleId) return article;
    }
  }
  return null;
}

function lineArticleIds(line: RecordNode): string[] {
  return asArray(line["items"])
    .filter(isObject)
    .map((article) => asString(article["id"]));
}
