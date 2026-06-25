import api from './api';
import type {
  CreatePackagePayload,
  CreditBalance,
  CreditConfig,
  CreditTransaction,
  DetailedCreditBalance,
  ListTransactionsQuery,
  Paginated,
  PurchasePackageResponse,
  PurchasedPackage,
  ServicePackage,
  UpdateCreditConfigPayload,
  UpdatePackagePayload,
} from '@/types/api';

type ApiEnvelope<T> = { success: boolean; data: T };
type ServiceResponse<T> = Promise<{ data: T }>;

function unwrap<T>(request: Promise<{ data: T | ApiEnvelope<T> }>): ServiceResponse<T> {
  return request.then((response) => {
    const body = response.data as T | ApiEnvelope<T>;
    const data =
      body &&
      typeof body === 'object' &&
      'success' in body &&
      'data' in body
        ? (body as ApiEnvelope<T>).data
        : (body as T);

    return { data };
  });
}

/**
 * Packages & Employer Credit API — backend `PackagesModule`.
 *
 * Three controllers share the `/packages` and `/employers` prefixes:
 *   • PackagesController        (public + EMPLOYER) — catalogue, purchase, my, history
 *   • PackagesAdminController   (ADMIN)             — CRUD + global credit ledger
 *   • EmployerCreditController  (EMPLOYER)          — credit balance + transactions
 */
const packageService = {
  // ─── Public / Employer (prefix /packages) ──────────────────────────────────

  /** GET /packages — active packages available for purchase (public). */
  listActive() {
    return unwrap(api.get<ServicePackage[]>('/packages'));
  },

  /** GET /packages/:id — single package detail (public). */
  getById(id: string) {
    return unwrap(api.get<ServicePackage>(`/packages/${id}`));
  },

  /** GET /packages/my — employer's currently active purchased packages. */
  myPurchased() {
    return unwrap(api.get<PurchasedPackage[]>('/packages/my'));
  },

  /** GET /packages/history — employer's package purchase invoice history. */
  myHistory() {
    return unwrap(api.get<CreditTransaction[]>('/packages/history'));
  },

  /** POST /packages/purchase — buy a credit package (Employer). */
  purchase(packageId: string) {
    return unwrap(api.post<PurchasePackageResponse>('/packages/purchase', { packageId }));
  },

  // ─── Employer credit wallet (prefix /employers) ─────────────────────────────

  /** GET /employers/credit-balance — current credit balance. */
  creditBalance() {
    return unwrap(api.get<CreditBalance>('/employers/credit-balance'));
  },

  /** GET /payments/balance — detailed credit balance + expiring points. */
  detailedBalance() {
    return unwrap(api.get<DetailedCreditBalance>('/payments/balance'));
  },

  /** GET /payments/credit-config — current employer-facing credit costs. */
  creditConfig() {
    return unwrap(api.get<CreditConfig>('/payments/credit-config'));
  },

  /** POST /employers/credit/transactions — paginated credit ledger (filterable). */
  creditTransactions(query: ListTransactionsQuery = {}) {
    return unwrap(api.post<Paginated<CreditTransaction>>('/employers/credit/transactions', query));
  },

  // ─── Admin (prefix /packages/admin) ─────────────────────────────────────────

  /** GET /packages/admin — all packages (active + inactive). */
  adminListAll() {
    return unwrap(api.get<ServicePackage[]>('/packages/admin'));
  },

  /** GET /packages/credits/admin — global credit ledger across all tenants. */
  adminCreditLedger(page = 1, limit = 10) {
    return unwrap(
      api.get<Paginated<CreditTransaction>>('/packages/credits/admin', {
        params: { page, limit },
      }),
    );
  },

  /** GET /packages/credits/admin/config — master credit cost settings. */
  adminGetCreditConfig() {
    return unwrap(api.get<CreditConfig>('/packages/credits/admin/config'));
  },

  /** POST /packages/credits/admin/config — update master credit cost settings. */
  adminUpdateCreditConfig(payload: UpdateCreditConfigPayload) {
    return unwrap(api.post<CreditConfig>('/packages/credits/admin/config', payload));
  },

  /** POST /packages/admin — create a new package. */
  adminCreate(payload: CreatePackagePayload) {
    return unwrap(api.post<ServicePackage>('/packages/admin', payload));
  },

  /** PUT /packages/admin/:id — update an existing package. */
  adminUpdate(id: string, payload: UpdatePackagePayload) {
    return unwrap(api.put<ServicePackage>(`/packages/admin/${id}`, payload));
  },

  /** DELETE /packages/admin/:id — soft-delete / deactivate a package. */
  adminRemove(id: string) {
    return unwrap(api.delete<{ message: string }>(`/packages/admin/${id}`));
  },
};

export default packageService;
