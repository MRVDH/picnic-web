// Parsers for the app's Portemonnee pages: portemonnee-page (balance,
// payment methods, payment history) and saldo-overview-page (the
// Picnic-tegoed history). All texts come localized from Picnic.
import type {
  BalanceHistoryRow,
  BalanceHistorySection,
  BalancePageData,
  WalletBalance,
  WalletLabel,
  WalletPageData,
  WalletPaymentRow,
} from "@/lib/core/wallet-types";
import {
  type PmlNode,
  cleanMarkdown,
  collectMarkdowns,
  extractInnerColor,
  findNodeById,
} from "@/lib/pml/pml-helpers";

const WALLET_BALANCE_ID = "saldo-balance-container";
const PAYMENT_METHODS_ID = "payment-methods-section";
const PAYMENTS_HEADER_ID = "payments-header";
const PAYMENT_LIST_PREFIX = "payment-list-pml-";
const BALANCE_PAGE_BALANCE_ID = "saldo-overview-wallet-balance";
const BALANCE_SECTION_PREFIX = "saldo-history-section-";
const BALANCE_AMOUNT_SIZE = 40;

const TRANSACTION_ID_PATTERN = /[;,]transactionId=([^,;&]+)/;
const DELIVERY_ID_PATTERN = /[;,]delivery_id=([^,;&]+)/;

/** Parse the raw portemonnee-page Fusion page. */
export function parseWalletPage(rawPage: unknown): WalletPageData {
  const header = (rawPage as { header?: { title?: unknown } } | null)?.header;

  const methodsNode = findNodeById(rawPage, PAYMENT_METHODS_ID);
  const paymentMethods = methodsNode
    ? {
        label: cleanMarkdown(collectMarkdowns(methodsNode)[0] ?? ""),
        iconUrls: collectImageUrls(methodsNode),
      }
    : null;

  const payments: WalletPaymentRow[] = [];
  for (const list of findAllByIdPrefix(rawPage, PAYMENT_LIST_PREFIX)) {
    for (const touchable of collectTouchables(list)) {
      const row = extractPaymentRow(touchable);
      if (row) payments.push(row);
    }
  }

  return {
    title: typeof header?.title === "string" ? header.title : "",
    balance: extractBalance(findNodeById(rawPage, WALLET_BALANCE_ID)),
    paymentMethods,
    paymentsTitle: cleanMarkdown(
      collectMarkdowns(findNodeById(rawPage, PAYMENTS_HEADER_ID))[0] ?? ""
    ),
    payments,
  };
}

/** Parse the raw saldo-overview-page Fusion page. */
export function parseBalancePage(rawPage: unknown): BalancePageData {
  const sections: BalanceHistorySection[] = findAllByIdPrefix(rawPage, BALANCE_SECTION_PREFIX).map(
    (section) => {
      // The section's first text is the day; each TOUCHABLE is one balance change.
      const title = cleanMarkdown(collectMarkdowns(section)[0] ?? "");
      const rows = collectTouchables(section).flatMap((touchable) => {
        const row = extractBalanceRow(touchable);
        return row ? [row] : [];
      });
      return { title, rows };
    }
  );

  return {
    balance: extractBalance(findNodeById(rawPage, BALANCE_PAGE_BALANCE_ID)),
    sections,
  };
}

// ─── Blocks ──────────────────────────────────────────────────────────────────

/**
 * The balance card: a label, the amount (size 40) and an explanation made of
 * colored RICH_TEXT parts.
 */
function extractBalance(node: PmlNode | null): WalletBalance | null {
  if (!node) return null;
  const texts = collectRichTexts(node);
  const amountIndex = texts.findIndex((t) => t.size === BALANCE_AMOUNT_SIZE);
  if (amountIndex < 0) return null;

  return {
    label: cleanMarkdown(texts.slice(0, amountIndex).map((t) => t.markdown)[0] ?? ""),
    amount: cleanMarkdown(texts[amountIndex].markdown),
    info: texts.slice(amountIndex + 1).map((t) => ({
      text: cleanMarkdown(t.markdown),
      color: extractInnerColor(t.markdown) ?? t.color,
    })),
  };
}

/**
 * A payment row: left the date and optional labels (a CONTAINER with a
 * background around a RICH_TEXT), right the amount in its color.
 */
function extractPaymentRow(touchable: PmlNode): WalletPaymentRow | null {
  const target = readTarget(touchable);
  const transactionId = target ? TRANSACTION_ID_PATTERN.exec(target)?.[1] : null;
  const stack = touchable.child as PmlNode | undefined;
  const [left, right] = Array.isArray(stack?.children) ? (stack.children as PmlNode[]) : [];
  if (!transactionId || !left || !right) return null;

  const leftParts = Array.isArray(left.children) ? (left.children as PmlNode[]) : [];
  const date = leftParts.find((part) => part.type === "RICH_TEXT");
  const labels: WalletLabel[] = leftParts
    .filter((part) => part.type === "CONTAINER")
    .flatMap((part) => {
      const text = collectMarkdowns(part)[0];
      return text
        ? [{ text: cleanMarkdown(text), backgroundColor: readString(part.backgroundColor) }]
        : [];
    });

  const amount = collectMarkdowns(right)[0] ?? "";

  return {
    transactionId,
    date: cleanMarkdown(typeof date?.markdown === "string" ? date.markdown : ""),
    labels,
    amount: { text: cleanMarkdown(amount), color: extractInnerColor(amount) },
  };
}

/** A balance change: the label, then the sign and amount as separate texts. */
function extractBalanceRow(touchable: PmlNode): BalanceHistoryRow | null {
  const [label, ...amountParts] = collectMarkdowns(touchable).map(cleanMarkdown);
  if (!label) return null;
  const target = readTarget(touchable);

  return {
    label,
    amount: amountParts.join(" ").trim(),
    deliveryId: target ? (DELIVERY_ID_PATTERN.exec(target)?.[1] ?? null) : null,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Every node whose id starts with the prefix, in document order (not nested in each other). */
function findAllByIdPrefix(node: unknown, prefix: string, out: PmlNode[] = []): PmlNode[] {
  if (typeof node !== "object" || node === null) return out;
  if (Array.isArray(node)) {
    for (const item of node) findAllByIdPrefix(item, prefix, out);
    return out;
  }
  const record = node as PmlNode;
  if (typeof record.id === "string" && record.id.startsWith(prefix)) {
    out.push(record);
    return out;
  }
  for (const value of Object.values(record)) findAllByIdPrefix(value, prefix, out);
  return out;
}

function collectTouchables(node: unknown, out: PmlNode[] = []): PmlNode[] {
  if (typeof node !== "object" || node === null) return out;
  if (Array.isArray(node)) {
    for (const item of node) collectTouchables(item, out);
    return out;
  }
  const record = node as PmlNode;
  if (record.type === "TOUCHABLE") {
    out.push(record);
    return out;
  }
  for (const value of Object.values(record)) collectTouchables(value, out);
  return out;
}

type RichText = { markdown: string; size: number | null; color: string | null };

/** RICH_TEXT nodes with their own markdown, in document order. */
function collectRichTexts(node: unknown, out: RichText[] = []): RichText[] {
  if (typeof node !== "object" || node === null) return out;
  if (Array.isArray(node)) {
    for (const item of node) collectRichTexts(item, out);
    return out;
  }
  const record = node as PmlNode;
  if (record.type === "RICH_TEXT" && typeof record.markdown === "string") {
    const attrs = (record.textAttributes ?? {}) as { size?: unknown; color?: unknown };
    out.push({
      markdown: record.markdown,
      size: typeof attrs.size === "number" ? attrs.size : null,
      color: readString(attrs.color),
    });
  }
  for (const value of Object.values(record)) collectRichTexts(value, out);
  return out;
}

/** Image URLs (not CDN ids) in the subtree, e.g. payment method icons. */
function collectImageUrls(node: unknown, out: string[] = []): string[] {
  if (typeof node !== "object" || node === null) return out;
  if (Array.isArray(node)) {
    for (const item of node) collectImageUrls(item, out);
    return out;
  }
  const record = node as PmlNode;
  const url = (record.source as { url?: unknown } | undefined)?.url;
  if (record.type === "IMAGE" && typeof url === "string" && !out.includes(url)) out.push(url);
  for (const value of Object.values(record)) collectImageUrls(value, out);
  return out;
}

function readTarget(node: PmlNode): string | null {
  return readString((node.onPress as { target?: unknown } | undefined)?.target);
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value !== "" ? value : null;
}
