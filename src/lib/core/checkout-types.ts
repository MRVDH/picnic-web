export type CheckoutStartData = {
  orderId: string;
  totalPrice: number;
  totalCount: number;
  totalDeposit: number;
  totalSavings: number;
  transactionExpiry: string;
};

export type CheckoutIssueData = {
  code: string;
  title: string;
  message: string;
  resolveKey: string;
  blocking: boolean;
  issueType: string;
  requiresAgeVerification: boolean;
};

export type CheckoutPaymentData = {
  paymentId: string;
  transactionId: string;
  redirectUrl: string;
};

export type CheckoutStatusData = {
  checkoutStatus: string;
};

export type PaymentProfileData = {
  preferredPaymentOptionId: string;
  storedOptions: {
    id: string;
    displayName: string;
    account: string | null;
    paymentMethod: string;
    iconUrl: string;
  }[];
};

export type CheckoutStartApiResponse = CheckoutStartData;
export type CheckoutIssueApiResponse = { issue: CheckoutIssueData };
export type CheckoutPaymentApiResponse = CheckoutPaymentData;
export type CheckoutStatusApiResponse = CheckoutStatusData;
export type PaymentProfileApiResponse = PaymentProfileData;
