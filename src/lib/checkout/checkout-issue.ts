import type { CheckoutIssueData } from "@/lib/core/checkout-types";

type CheckoutIssueLike = {
  name?: string;
  code?: string;
  title?: string;
  issueMessage?: string;
  resolveKey?: string;
  blocking?: boolean;
  issueType?: string;
  isAgeVerificationIssue?: () => boolean;
};

export function isCheckoutIssueError(error: unknown): error is CheckoutIssueLike {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as CheckoutIssueLike).name === "CheckoutIssueError"
  );
}

export function mapCheckoutIssue(error: CheckoutIssueLike): CheckoutIssueData {
  const requiresAgeVerification =
    typeof error.isAgeVerificationIssue === "function"
      ? error.isAgeVerificationIssue()
      : error.issueType === "LEGACY_ALCOHOL_AGE_VERIFICATION_REQUIRED";

  return {
    code: error.code ?? "CART_HAS_ISSUES",
    title: error.title ?? "Checkout issue",
    message: error.issueMessage ?? "Unable to proceed with checkout.",
    resolveKey: error.resolveKey ?? "",
    blocking: error.blocking ?? true,
    issueType: error.issueType ?? "UNKNOWN",
    requiresAgeVerification,
  };
}
