import { Platform } from "react-native";
import Constants from "expo-constants";

// ── Auth token store ─────────────────────────────────────────────────────────
// Set after login/register so all subsequent requests carry the JWT.
let _authToken: string | null = null;

type AuthErrorHandler = (message: string) => void;
let _authErrorHandler: AuthErrorHandler | null = null;

export const setAuthToken = (token: string | null) => {
  _authToken = token;
};

export const setAuthErrorHandler = (handler: AuthErrorHandler | null) => {
  _authErrorHandler = handler;
};

export const getAuthToken = () => _authToken;

const getLanHostFromExpo = () => {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as { manifest2?: { extra?: { expoClient?: { hostUri?: string } } } }).manifest2?.extra
      ?.expoClient?.hostUri ??
    (Constants as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost;

  if (!hostUri) {
    return null;
  }

  return hostUri.split(":")[0] ?? null;
};

const lanHost = getLanHostFromExpo();
const defaultBaseUrl =
  lanHost != null
    ? `http://${lanHost}:8082`
    : Platform.OS === "android"
      ? "http://10.0.2.2:8082"
      : "http://localhost:8082";

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? defaultBaseUrl;

export const resolvePublicAssetUrl = (url?: string | null, fallback = "https://images.unsplash.com/photo-1556740749-887f6717d7e4?w=800") => {
  if (!url) return fallback;
  if (url.startsWith("http")) return url;
  return `${API_BASE_URL}${url}`;
};

export interface AuthRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  profession?: string;
}

export interface AuthResponse {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  message: string;
  token: string | null;
  emailVerified?: boolean;
}

export interface Merchant {
  id: number;
  name: string;
  category: string;
  address: string;
  phone: string;
  email: string;
  logoUrl: string;
  active: boolean;
  createdAt: string;
}

export type InstallmentStatus = "PENDING" | "PAID" | "OVERDUE";

export interface Installment {
  id: number;
  creditRequestId: number;
  productName?: string;
  totalAmount?: number;
  dueDate: string;
  amount: number;
  status: InstallmentStatus;
  paidDate?: string;
  penalty?: number;
}

export interface CreditScore {
  id: number;
  score: number;
  maxCreditAmount: number;
  decision: string;
  salary: number;
  employmentType: string;
  yearsOfExperience: number;
  monthlyExpenses: number;
}

export interface CreditSimulationPayload {
  totalAmount: number;
  downPayment: number;
  numberOfInstallments: number;
}

export interface CreditSimulationResult {
  totalAmount: number;
  downPayment: number;
  financedAmount: number;
  remainingPrincipal: number;
  remainingAmount: number;
  interestRate: number;
  interestAmount: number;
  totalPayable: number;
  numberOfInstallments: number;
  monthlyAmount: number;
}

export interface CreditRequestPayload {
  totalAmount: number;
  downPayment: number;
  numberOfInstallments: number;
  productName?: string;
}

export interface CreditRequestResult {
  id: number;
  userId: number;
  totalAmount: number;
  downPayment: number;
  financedAmount: number;
  remainingPrincipal: number;
  interestRate: number;
  interestAmount: number;
  totalPayable: number;
  numberOfInstallments: number;
  monthlyAmount: number;
  productName?: string;
  status: string;
  createdAt: string;
}

export interface CreditBalanceResult {
  totalLimit: number;
  usedCredit: number;
  availableCredit: number;
  outstandingPrincipal?: number;
  outstandingPayable?: number;
}

export interface Payment {
  id: number;
  userId: number;
  installmentId: number;
  amount: number;
  transactionReference: string;
  paymentMethod: string;
  paidAt: string;
}

export type CardType = "VISA" | "MASTERCARD";
export type CardStatus = "ACTIVE" | "BLOCKED";

export interface CardDto {
  id: number;
  userId: number;
  maskedNumber: string;
  last4: string;
  expiryDate: string;
  cardholderName?: string;
  type: CardType;
  defaultCard: boolean;
  status: CardStatus;
  createdAt: string;
}

export interface AddCardRequest {
  cardNumber: string;
  expiryDate: string;
  cardholderName?: string;
  type: CardType;
  cvv: string;
  defaultCard?: boolean;
}

export interface FinancialProfileDto {
  id: number;
  userId: number;
  monthlySalary: number;
  salaryDay: number;
  employmentStatus: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  createdAt: string;
  updatedAt: string;
}

export interface CreateFinancialProfileRequest {
  monthlySalary: number;
  salaryDay: number;
  employmentStatus: string;
}

export interface DashboardData {
  totalLimit: number;
  usedCredit: number;
  availableCredit: number;
  activeLoans: number;
  nextPaymentAmount: number;
  nextPaymentDate: string | null;
  creditScore: number;
  kycStatus: "DONE" | "PENDING";
  cardStatus: "DONE" | "MISSING";
  profileStatus: "DONE" | "MISSING";
  nextStep: "COMPLETE_KYC" | "ADD_CARD" | "COMPLETE_FINANCIAL_PROFILE" | "READY_FOR_CREDIT";
}

export interface PayAllResult {
  paidInstallments: number;
  totalPaidAmount: number;
  debtBefore: number;
  debtAfter: number;
}

export interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  profession?: string;
  profilePhotoUrl?: string;
  kycStatus: string;
  createdAt: string;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  data?: unknown;
}

export interface KycStatusResult {
  id: number;
  userId: number;
  cinFrontUrl: string;
  cinBackUrl: string;
  selfieUrl: string;
  cinNumber: string;
  status: string;
  adminComment?: string;
  createdAt: string;
}

export interface SupportTicket {
  id: number;
  userId: number;
  subject: string;
  message?: string;
  response?: string;
  status: string;
  createdAt: string;
}

export interface SupportFaq {
  id: number;
  category: string;
  question: string;
  answer: string;
}

export interface UploadFileAsset {
  uri: string;
  fileName?: string;
  mimeType?: string;
}

export interface ShopCatalogShop {
  id: number;
  name: string;
  logoUrl: string;
  storeUrl: string;
}

export interface ShopCatalogArticle {
  id: number;
  shopId: number;
  name: string;
  imageUrl: string;
  sourceUrl?: string;
}

export interface ShopCatalogProduct {
  id: number;
  shopId: number;
  articleId: number;
  name: string;
  imageUrl: string;
  priceTnd: number;
  productUrl: string;
}

export interface PartnerArticle {
  id: number;
  productName: string;
  description: string;
  price: number;
  imageUrl: string;
  boutiqueName: string;
  category: string;
  active: boolean;
  sourceUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface ShopCatalogDerivedPayload {
  shops: ShopCatalogShop[];
  articles: ShopCatalogArticle[];
  products: ShopCatalogProduct[];
}

const EMPTY_CATALOG: ShopCatalogDerivedPayload = { shops: [], articles: [], products: [] };
let shopCatalogCache: ShopCatalogDerivedPayload | null = null;
let shopCatalogCachedAt = 0;
const SHOP_CATALOG_TTL_MS = 30_000; // 30 seconds — auto-refresh after admin changes

/** Call this to force the next shop/article fetch to hit the backend. */
export const invalidateShopCatalogCache = () => {
  shopCatalogCache = null;
  shopCatalogCachedAt = 0;
};

export type PurchasePaymentType = "CASH" | "CREDIT";

export interface PurchaseOrderPayload {
  articleId: number;
  paymentType: PurchasePaymentType;
  installmentMonths?: number;
  productName?: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  boutiqueName?: string;
  category?: string;
}

export interface PurchaseInstallmentItem {
  installmentId: number;
  dueDate: string;
  amount: number;
  status: "PENDING" | "PAID" | "OVERDUE";
}

export interface PurchaseOrderResult {
  id: number;
  transactionId: string;
  userId: number;
  articleId: number;
  articleName: string;
  boutiqueName: string;
  category: string;
  totalPrice: number;
  downPayment: number;
  financedAmount: number;
  interestRate: number;
  interestAmount: number;
  totalPayable: number;
  monthlyAmount?: number;
  installmentMonths?: number;
  paymentType: PurchasePaymentType;
  status: "COMPLETED" | "CREDIT_ACTIVE" | "CREDIT_REJECTED";
  merchantPaid: boolean;
  merchantMarginRate: number;
  merchantPayoutAmount: number;
  platformProfitAmount: number;
  merchantPayoutReference?: string;
  merchantPaidAt?: string;
  creditRequestId?: number;
  invoiceId?: number;
  createdAt: string;
  schedule: PurchaseInstallmentItem[];
}

const getErrorMessage = async (response: Response) => {
  try {
    const body = await response.json();

    if (typeof body?.message === "string") {
      return body.message;
    }

    if (typeof body?.error === "string") {
      return body.error;
    }

    if (body && typeof body === "object") {
      const firstValidationError = Object.values(body).find((value) => typeof value === "string");
      if (typeof firstValidationError === "string") {
        return firstValidationError;
      }
    }
  } catch {
    // Ignore JSON parsing error and fallback to status-based message.
  }

  if (response.status === 401 || response.status === 403) {
    return "Session expirée. Veuillez vous reconnecter.";
  }

  if (response.status === 400) {
    return "Bad request (400). Check your credentials or request data.";
  }

  return `Request failed with status ${response.status}`;
};

const withQuery = (path: string, query?: Record<string, string | number | boolean | undefined>) => {
  if (!query) {
    return path;
  }

  const searchParams = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, String(value));
    }
  });

  const qs = searchParams.toString();
  if (!qs) {
    return path;
  }

  return `${path}?${qs}`;
};

const requestJson = async <T>(
  path: string,
  options?: RequestInit,
  query?: Record<string, string | number | boolean | undefined>,
): Promise<T> => {
  const authHeaders: Record<string, string> = {};
  if (_authToken) {
    authHeaders["Authorization"] = `Bearer ${_authToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${withQuery(path, query)}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...(options?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const message = await getErrorMessage(response);
    if (response.status === 401 || response.status === 403) {
      _authErrorHandler?.(message);
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
};

export const login = async (payload: AuthRequest): Promise<AuthResponse> => {
  return requestJson<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const register = async (payload: RegisterRequest): Promise<AuthResponse> => {
  return requestJson<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const verifyEmail = async (email: string, code: string): Promise<AuthResponse> => {
  return requestJson<AuthResponse>("/api/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
};

export const resendVerification = async (email: string): Promise<{ message: string }> => {
  return requestJson<{ message: string }>("/api/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
};

export const getMerchants = async () => requestJson<Merchant[]>("/api/merchants", { method: "GET" });

export const getCreditBalance = async (userId: number) =>
  requestJson<CreditBalanceResult>("/api/credits/balance", { method: "GET" }, { userId });

const buildShopCatalogFromArticles = (rawArticles: PartnerArticle[]): ShopCatalogDerivedPayload => {
  const activeArticles = rawArticles.filter((item) => item.active !== false);

  const boutiqueNames = Array.from(
    new Set(activeArticles.map((item) => (item.boutiqueName?.trim() || "Boutique"))),
  ).sort((a, b) => a.localeCompare(b));

  const shopIds = new Map<string, number>();
  boutiqueNames.forEach((name, index) => {
    shopIds.set(name, index + 1);
  });

  const shops: ShopCatalogShop[] = boutiqueNames.map((name) => {
    const firstArticle = activeArticles.find((item) => (item.boutiqueName?.trim() || "Boutique") === name);
    return {
      id: shopIds.get(name) ?? 0,
      name,
      logoUrl: resolvePublicAssetUrl(firstArticle?.imageUrl),
      storeUrl: firstArticle?.sourceUrl || `https://www.google.com/search?q=${encodeURIComponent(name + " tunisia")}`,
    };
  });

  const articles: ShopCatalogArticle[] = activeArticles.map((item) => ({
    id: item.id,
    shopId: shopIds.get(item.boutiqueName?.trim() || "Boutique") ?? 0,
    name: item.productName,
    imageUrl: resolvePublicAssetUrl(item.imageUrl),
    sourceUrl: item.sourceUrl,
  }));

  const products: ShopCatalogProduct[] = activeArticles.map((item) => ({
    id: item.id,
    shopId: shopIds.get(item.boutiqueName?.trim() || "Boutique") ?? 0,
    articleId: item.id,
    name: item.productName,
    imageUrl: resolvePublicAssetUrl(item.imageUrl),
    priceTnd: Number(item.price),
    productUrl: item.sourceUrl || `https://www.google.com/search?q=${encodeURIComponent(item.productName + " " + item.boutiqueName)}`,
  }));

  return {
    shops,
    articles,
    products,
  };
};

const getShopCatalogPayload = async (): Promise<ShopCatalogDerivedPayload> => {
  const now = Date.now();
  if (shopCatalogCache && now - shopCatalogCachedAt < SHOP_CATALOG_TTL_MS) {
    return shopCatalogCache;
  }

  try {
    const backendArticles = await requestJson<PartnerArticle[]>("/api/articles", { method: "GET" });
    shopCatalogCache = buildShopCatalogFromArticles(backendArticles);
    shopCatalogCachedAt = Date.now();
    return shopCatalogCache;
  } catch {
    // On network error, keep the last known good cache (don't reset its expiry)
    // If no prior cache exists, return empty but only cache it for 5 s so
    // the next pull-to-refresh (once the server comes back up) retries quickly.
    if (!shopCatalogCache) {
      shopCatalogCache = EMPTY_CATALOG;
      shopCatalogCachedAt = Date.now() - (SHOP_CATALOG_TTL_MS - 5_000); // expire in 5 s
    }
    return shopCatalogCache;
  }
};

export const getShopCatalogShops = async () => {
  const payload = await getShopCatalogPayload();
  return payload.shops;
};

export const getShopCatalogShop = async (shopId: number) => {
  const payload = await getShopCatalogPayload();
  return payload.shops.find((shop) => shop.id === shopId) ?? null;
};

export const getShopCatalogArticles = async (shopId: number) => {
  const payload = await getShopCatalogPayload();
  return payload.articles.filter((article) => article.shopId === shopId);
};

export const getShopCatalogArticleProducts = async (shopId: number, articleId: number) => {
  const payload = await getShopCatalogPayload();
  return payload.products.filter((product) => product.shopId === shopId && product.articleId === articleId);
};

export const getShopCatalogArticle = async (shopId: number, articleId: number) => {
  const payload = await getShopCatalogPayload();
  return payload.articles.find((article) => article.shopId === shopId && article.id === articleId) ?? null;
};

export const getPartnerArticles = async () =>
  requestJson<PartnerArticle[]>("/api/articles", { method: "GET" });

export const getPopularArticles = async (limit = 3) =>
  requestJson<PartnerArticle[]>("/api/articles/popular", { method: "GET" }, { limit });

export const getMyCreditScore = async (userId: number) =>
  requestJson<CreadiScoreResult>("/api/creadi-score/latest", { method: "GET" }, { userId });

export const getMyInstallments = async (userId: number) =>
  requestJson<Installment[]>("/api/credits/my-installments", { method: "GET" }, { userId });

export const getMyCreditRequests = async (userId: number) =>
  requestJson<CreditRequestResult[]>("/api/credits/my", { method: "GET" }, { userId });

export const simulateCredit = async (payload: CreditSimulationPayload) =>
  requestJson<CreditSimulationResult>("/api/credits/simulate", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const requestCredit = async (userId: number, payload: CreditRequestPayload) =>
  requestJson<CreditRequestResult>(
    "/api/credits/request",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    { userId },
  );

export const checkoutArticlePurchase = async (userId: number, payload: PurchaseOrderPayload) =>
  requestJson<PurchaseOrderResult>(
    "/api/purchases/checkout",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    { userId },
  );

export const getMyPurchases = async (userId: number) =>
  requestJson<PurchaseOrderResult[]>("/api/purchases/my", { method: "GET" }, { userId });

export const getMyPayments = async (userId: number) =>
  requestJson<Payment[]>("/api/payments/my-payments", { method: "GET" }, { userId });

export const getPaymentMethods = async (userId: number) =>
  requestJson<{ id: number; type: string; last4: string; label: string; defaultMethod: boolean }[]>(
    "/api/payments/methods",
    { method: "GET" },
    { userId },
  );

export const payInstallment = async (userId: number, installmentId: number, amount: number) =>
  requestJson<Payment>(
    `/api/payments/installments/${installmentId}/pay`,
    {
      method: "POST",
      body: JSON.stringify({
        installmentId,
        amount,
        paymentMethod: "CARD",
      }),
    },
    { userId },
  );

export const payAllInstallments = async (userId: number) =>
  requestJson<PayAllResult>(
    "/api/payments/payAll",
    {
      method: "POST",
    },
    { userId },
  );

export const getProfile = async (userId: number) =>
  requestJson<UserProfile>("/api/users/profile", { method: "GET" }, { userId });

export const getDashboard = async (userId: number) =>
  requestJson<DashboardData>("/api/dashboard", { method: "GET" }, { userId });

export const getCards = async (userId: number) =>
  requestJson<Card[]>("/api/cards", { method: "GET" }, { userId });

export const getUserCards = async (userId: number) =>
  requestJson<CardDto[]>("/api/cards/user", { method: "GET" }, { userId });

export const getDefaultCard = async (userId: number) => {
  try {
    return await requestJson<CardDto>("/api/cards/default", { method: "GET" }, { userId });
  } catch (error) {
    if (error instanceof Error && error.message.includes("status 404")) {
      return null;
    }
    throw error;
  }
};

export const addCard = async (userId: number, payload: AddCardRequest) =>
  requestJson<CardDto>(
    "/api/cards/add",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    { userId },
  );

export const setDefaultCard = async (userId: number, cardId: number) =>
  requestJson<CardDto>(
    `/api/cards/set-default`,
    {
      method: "PUT",
      body: JSON.stringify({ cardId }),
    },
    { userId },
  );

export const blockCard = async (userId: number, cardId: number) =>
  requestJson<CardDto>(
    `/api/cards/block`,
    {
      method: "DELETE",
      body: JSON.stringify({ cardId }),
    },
    { userId },
  );

export const getFinancialProfile = async (userId: number) => {
  try {
    return await requestJson<FinancialProfileDto>("/api/profile/get", { method: "GET" }, { userId });
  } catch (error) {
    if (error instanceof Error && error.message.includes("status 404")) {
      return null;
    }
    throw error;
  }
};

export const createFinancialProfile = async (userId: number, payload: CreateFinancialProfileRequest) =>
  requestJson<FinancialProfileDto>(
    "/api/profile/create",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    { userId },
  );

export const checkHasFinancialProfile = async (userId: number) =>
  requestJson<{ exists: boolean }>("/api/profile/has-profile", { method: "GET" }, { userId });

export const requestBnplCredit = async (userId: number, productName: string, amount: number, months: number) =>
  requestJson<CreditRequestResult>(
    "/api/credits/request",
    {
      method: "POST",
      body: JSON.stringify({
        totalAmount: amount,
        downPayment: Math.round(amount * 0.2),
        numberOfInstallments: months,
        productName,
      }),
    },
    { userId },
  );

export const payInstallmentBnpl = async (userId: number, installmentId: number) =>
  requestJson<Installment>(
    `/api/payments/installments/${installmentId}/pay`,
    {
      method: "POST",
    },
    { userId },
  );

// saveFinancialProfile: upserts the profile (create or update via same endpoint)
export const saveFinancialProfile = async (userId: number, payload: CreateFinancialProfileRequest) =>
  createFinancialProfile(userId, payload);

// Legacy type aliases - kept for compatibility
export type Card = CardDto;
export type EmploymentStatus = "FULL_TIME" | "PART_TIME" | "SELF_EMPLOYED" | "STUDENT" | "UNEMPLOYED" | "OTHER";
export type FinancialProfile = FinancialProfileDto;
export type FinancialProfilePayload = CreateFinancialProfileRequest;

export interface CreateCardPayload {
  cardNumber: string;
  expiryDate: string;
  cardholderName?: string;
  type: CardType;
  cvv: string;
  defaultCard?: boolean;
}

export const updateProfile = async (userId: number, payload: Partial<Pick<UserProfile, "firstName" | "lastName" | "email" | "phone" | "address" | "profession">>) =>
  requestJson<UserProfile>(
    "/api/users/me",
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
    { userId },
  );

export const getKycStatus = async (userId: number) => {
  try {
    return await requestJson<KycStatusResult>("/api/kyc/status", { method: "GET" }, { userId });
  } catch (error) {
    if (error instanceof Error && error.message.includes("status 404")) {
      return null;
    }
    throw error;
  }
};

export interface KycVerificationResult {
  documentId: number;
  userId: number;
  status: "APPROVED" | "REJECTED" | "PENDING";
  confidence: number;
  risk: string;
  message: string;
  /** Extracted by Didit AI from the identity document */
  extractedFirstName?: string;
  extractedLastName?: string;
  extractedDateOfBirth?: string;
  /** Document / CIN number extracted by Didit */
  extractedIdentityNumber?: string;
  diditIdentityId?: string;
}

export const deleteAccount = async (userId: number) =>
  requestJson<ApiResponse>("/api/users/delete", { method: "DELETE" }, { userId });

export const submitKycVerification = async (
  userId: number,
  cinFront: UploadFileAsset,
  cinBack: UploadFileAsset,
  selfie: UploadFileAsset | null,
  maritalStatus: string,
  numberOfChildren: number,
  cinNumber?: string,
) => {
  const formData = new FormData();
  formData.append("userId", String(userId));
  formData.append("cinNumber", cinNumber?.trim() ?? "");
  formData.append("maritalStatus", maritalStatus);
  formData.append("numberOfChildren", String(numberOfChildren));

  formData.append("cinFront", {
    uri: cinFront.uri,
    name: cinFront.fileName ?? "cin-front.jpg",
    type: cinFront.mimeType ?? "image/jpeg",
  } as unknown as Blob);

  formData.append("cinBack", {
    uri: cinBack.uri,
    name: cinBack.fileName ?? "cin-back.jpg",
    type: cinBack.mimeType ?? "image/jpeg",
  } as unknown as Blob);

  if (selfie) {
    formData.append("selfie", {
      uri: selfie.uri,
      name: selfie.fileName ?? "selfie.jpg",
      type: selfie.mimeType ?? "image/jpeg",
    } as unknown as Blob);
  }

  const response = await fetch(`${API_BASE_URL}/api/kyc/verify`, {
    method: "POST",
    body: formData,
    headers: _authToken ? { Authorization: `Bearer ${_authToken}` } : undefined,
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json() as Promise<KycVerificationResult>;
};

export const getSupportFaq = async () => requestJson<SupportFaq[]>("/api/support/faq", { method: "GET" });

export const getSupportTickets = async (userId: number) =>
  requestJson<SupportTicket[]>("/api/support/tickets", { method: "GET" }, { userId });

export const createSupportTicket = async (userId: number, payload: { subject: string; message: string }) =>
  requestJson<SupportTicket>(
    "/api/support/tickets",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    { userId },
  );

export const requestForgotPassword = async (identifier: string) =>
  requestJson<ApiResponse>(
    "/api/auth/forgot-password/request",
    {
      method: "POST",
      body: JSON.stringify({ identifier }),
    },
  );

export const confirmForgotPassword = async (identifier: string, code: string, newPassword: string) =>
  requestJson<ApiResponse>(
    "/api/auth/forgot-password/confirm",
    {
      method: "POST",
      body: JSON.stringify({ identifier, code, newPassword }),
    },
  );

export const getUnreadNotificationCount = async (userId: number) =>
  requestJson<number>("/api/notifications/unread-count", { method: "GET" }, { userId });

export interface AppNotification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export const getNotifications = async (userId: number) =>
  requestJson<AppNotification[]>("/api/notifications", { method: "GET" }, { userId });

export const markNotificationAsRead = async (notificationId: number) =>
  requestJson<{ success: boolean; message: string }>(
    `/api/notifications/${notificationId}/read`,
    { method: "PUT" },
  );

// ── Creadi Score (FICO-style 0-1000) ────────────────────────

export type ScoreLevel = "EXCELLENT" | "GOOD" | "MEDIUM" | "HIGH_RISK";
export type RiskLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export interface ScoreHistoryItem {
  score: number;
  level: ScoreLevel;
  date: string;
}

export interface CreadiScoreResult {
  userId: number;
  score: number;
  level: ScoreLevel;
  risk: RiskLevel;
  reason: string;

  kycScore: number;
  salaryScore: number;
  maritalScore: number;
  childrenScore: number;
  behaviorScore: number;

  badge: string | null;
  maxCreditLimit: number;

  history: ScoreHistoryItem[];
  improvementTips: string[];

  calculatedAt: string;
}

export const calculateCreadiScore = async (userId: number) =>
  requestJson<CreadiScoreResult>(`/api/creadi-score/calculate/${userId}`, { method: "POST" });

export const getCreadiScoreLatest = async (userId: number) =>
  requestJson<CreadiScoreResult>("/api/creadi-score/latest", { method: "GET" }, { userId });

export const uploadProfilePhoto = async (userId: number, photo: UploadFileAsset) => {
  const formData = new FormData();
  formData.append("file", {
    uri: photo.uri,
    name: photo.fileName ?? "profile.jpg",
    type: photo.mimeType ?? "image/jpeg",
  } as unknown as Blob);

  const authHeaders: Record<string, string> = {};
  if (_authToken) {
    authHeaders["Authorization"] = `Bearer ${_authToken}`;
  }

  const response = await fetch(
    `${API_BASE_URL}/api/users/photo?userId=${userId}`,
    { method: "POST", body: formData, headers: authHeaders },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json() as Promise<UserProfile>;
};

// ── Transaction history ──────────────────────────────────────────────────────

export interface Transaction {
  id: number;
  userId: number;
  amount: number;
  type: "PAYMENT" | "CREDIT" | "REFUND";
  status: "SUCCESS" | "FAILED";
  description: string;
  reference: string;
  createdAt: string;
}

export const getTransactions = async (userId: number) =>
  requestJson<Transaction[]>("/api/transactions", { method: "GET" }, { userId });

// ── Autopay ──────────────────────────────────────────────────────────────────

export const getAutopayStatus = async (userId: number) =>
  requestJson<{ enabled: boolean }>("/api/payments/autopay", { method: "GET" }, { userId });

export const setAutopay = async (userId: number, enabled: boolean) =>
  requestJson<{ success: boolean; message: string }>(
    "/api/payments/autopay",
    {
      method: "PUT",
      body: JSON.stringify({ enabled }),
    },
    { userId },
  );

// ── Account Status (replaces wallet-balance — balance is secret) ─────────────

export interface AccountStatus {
  autopay: boolean;
  nextInstallmentDate: string | null;
  nextInstallmentAmount: number | null;
  paidCount: number;
  totalCount: number;
  pendingCount: number;
  overdueCount: number;
  /** BON_PAYEUR | RISQUE | NEUTRE */
  payerStatus: "BON_PAYEUR" | "RISQUE" | "NEUTRE";
}

export const getAccountStatus = async (userId: number) =>
  requestJson<AccountStatus>("/api/users/account-status", { method: "GET" }, { userId });

export const getWalletBalance = async (userId: number) =>
  requestJson<{ balance: number }>("/api/payments/wallet-balance", { method: "GET" }, { userId });
