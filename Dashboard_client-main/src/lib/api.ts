/**
 * Admin API client — all calls proxy through Next.js /api/backend/**
 * which forwards to the Spring Boot backend at http://localhost:8082
 */

const BACKEND_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8082';

export const BACKEND = BACKEND_BASE;

const withQuery = (
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
) => {
  if (!params) return path;
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && `${value}`.trim() !== '') {
      search.append(key, String(value));
    }
  });
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
};

export async function fetchBackend<T>(path: string, init?: RequestInit): Promise<T> {
  const adminToken = typeof window !== 'undefined' ? (localStorage.getItem('adminToken') ?? '') : '';
  const res = await fetch(`${BACKEND_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(adminToken ? { 'X-Admin-Token': adminToken } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Admin endpoints ──────────────────────────────────────────────────────────

export interface AdminStats {
  totalUsers: number;
  totalCredits: number;
  totalInstallments: number;
  totalArticles: number;
  totalOrders: number;
  creditOrders: number;
  totalInvoices: number;
  unreadCreditNotifications: number;
  pendingKyc: number;
  approvedKyc: number;
  pendingCredits: number;
  approvedCredits: number;
  rejectedCredits: number;
}

export const getAdminStats = () => fetchBackend<AdminStats>('/api/admin/stats');

export interface AdminUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profession?: string;
  kycStatus: string;
  createdAt: string;
}

export const getAdminUsers = () => fetchBackend<AdminUser[]>('/api/admin/users');
export const deleteAdminUser = (userId: number) => fetchBackend<{ success: boolean; message: string }>(`/api/admin/users/${userId}`, { method: 'DELETE' });

export interface AdminCredit {
  id: number;
  userId: number;
  productName: string;
  totalAmount: number;
  downPayment: number;
  financedAmount: number;
  interestRate: number;
  interestAmount: number;
  totalPayable: number;
  numberOfInstallments: number;
  monthlyAmount: number;
  status: string;
  createdAt: string;
}

export const getAdminCredits = () => fetchBackend<AdminCredit[]>('/api/admin/credits');

export interface AdminInstallment {
  id: number;
  creditRequestId: number;
  userId: number;
  productName?: string;
  dueDate: string;
  amount: number;
  status: string;
  paidDate?: string;
}

export const getAdminInstallments = () => fetchBackend<AdminInstallment[]>('/api/admin/installments');

export interface AdminKycDocument {
  id: number;
  userId: number;
  cinFrontUrl?: string;
  cinBackUrl?: string;
  selfieUrl?: string;
  cinNumber: string;
  status: string;
  adminComment?: string;
  faceMatchScore?: number;
  createdAt: string;
}

export const getAdminKycDocuments = () => fetchBackend<AdminKycDocument[]>('/api/admin/kyc/pending');

export const approveKyc = (documentId: number, comment?: string) =>
  fetchBackend<AdminKycDocument>(
    withQuery(`/api/admin/kyc/${documentId}/approve`, { comment }),
    { method: 'PUT' },
  );

export const rejectKyc = (documentId: number, comment: string) =>
  fetchBackend<AdminKycDocument>(
    withQuery(`/api/admin/kyc/${documentId}/reject`, { comment }),
    { method: 'PUT' },
  );

export const approveCredit = (creditId: number) =>
  fetchBackend<AdminCredit>(`/api/admin/credits/${creditId}/approve`, { method: 'PUT' });

export const rejectCredit = (creditId: number) =>
  fetchBackend<AdminCredit>(`/api/admin/credits/${creditId}/reject`, { method: 'PUT' });

// ── Articles management ─────────────────────────────────────────────────────

export interface AdminArticle {
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

export interface AdminArticleInput {
  productName: string;
  description: string;
  price: number;
  imageUrl: string;
  boutiqueName: string;
  category: string;
  sourceUrl?: string;
}

export interface ProductImportResult {
  name: string;
  price: string;
  description: string;
  images: string[];
  brand: string;
  category: string;
  sourceUrl: string;
  aiExtracted: boolean;
  valid: boolean;
  errorMessage?: string;
}

export const getAdminArticles = (params?: { category?: string; boutiqueName?: string; search?: string }) =>
  fetchBackend<AdminArticle[]>(withQuery('/api/admin/articles', params));

export const createAdminArticle = (payload: AdminArticleInput) =>
  fetchBackend<AdminArticle>('/api/admin/articles', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updateAdminArticle = (id: number, payload: AdminArticleInput) =>
  fetchBackend<AdminArticle>(`/api/admin/articles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

export const deleteAdminArticle = (id: number) =>
  fetchBackend<{ success: boolean; message: string }>(`/api/admin/articles/${id}`, {
    method: 'DELETE',
  });

export const uploadArticleImage = async (file: File): Promise<string> => {
  const adminToken = typeof window !== 'undefined' ? (localStorage.getItem('adminToken') ?? '') : '';
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${BACKEND_BASE}/api/admin/articles/upload-image`, {
    method: 'POST',
    body: formData,
    headers: adminToken ? { 'X-Admin-Token': adminToken } : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(text || `HTTP ${res.status}`);
  }
  const data = (await res.json()) as { imageUrl?: string; error?: string };
  if (data.error) throw new Error(data.error);
  return data.imageUrl ?? '';
};

export const importProductFromUrl = async (url: string): Promise<ProductImportResult> => {
  // Call the Next.js server-side scraping route (no Spring Boot dependency)
  const res = await fetch('/api/scrape-product', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  const data = await res.json() as ProductImportResult;
  return data;
};

// ── Invoices / factures ─────────────────────────────────────────────────────

export interface AdminInvoice {
  id: number;
  invoiceNumber: string;
  transactionId: string;
  orderId: number;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  articleName: string;
  boutiqueName: string;
  totalPrice: number;
  financedAmount: number;
  interestRate: number;
  totalPayable: number;
  merchantMarginRate: number;
  merchantPayoutAmount: number;
  platformProfitAmount: number;
  paymentType: string;
  numberOfInstallments: number;
  purchaseDate: string;
  status: string;
  statement: string;
  createdAt: string;
}

export const getAdminInvoices = () => fetchBackend<AdminInvoice[]>('/api/admin/invoices');

export const getAdminInvoice = (invoiceId: number) =>
  fetchBackend<AdminInvoice>(`/api/admin/invoices/${invoiceId}`);

export const downloadAdminInvoicePdf = async (invoiceId: number, invoiceNumber: string): Promise<void> => {
  const adminToken = typeof window !== 'undefined' ? (localStorage.getItem('adminToken') ?? '') : '';
  const res = await fetch(`${BACKEND_BASE}/api/admin/invoices/${invoiceId}/pdf`, {
    method: 'GET',
    headers: adminToken ? { 'X-Admin-Token': adminToken } : {},
  });
  if (!res.ok) {
    const text = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(text || `HTTP ${res.status}`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `facture-${invoiceNumber}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ── Credit purchase notifications ───────────────────────────────────────────

export interface AdminCreditNotification {
  id: number;
  title: string;
  message: string;
  type: 'NEW_CREDIT_PURCHASE' | 'INVOICE_GENERATED';
  read: boolean;
  orderId?: number;
  transactionId?: string;
  createdAt: string;
}

export const getAdminNotifications = () =>
  fetchBackend<AdminCreditNotification[]>('/api/admin/notifications');

export const getAdminUnreadNotifications = () =>
  fetchBackend<AdminCreditNotification[]>('/api/admin/notifications/unread');

export const getAdminUnreadNotificationsCount = () =>
  fetchBackend<{ count: number }>('/api/admin/notifications/unread-count');

export const markAdminNotificationAsRead = (notificationId: number) =>
  fetchBackend<{ success: boolean; message: string }>(`/api/admin/notifications/${notificationId}/read`, {
    method: 'PUT',
  });
