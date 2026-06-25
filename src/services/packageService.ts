import api from './api';
import type {
  CreatePackagePayload,
  CreditBalance,
  CreditTransaction,
  ListTransactionsQuery,
  Paginated,
  PurchasedPackage,
  ServicePackage,
  UpdatePackagePayload,
} from '@/types/api';

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
    return api.get<ServicePackage[]>('/packages');
  },

  /** GET /packages/:id — single package detail (public). */
  getById(id: string) {
    return api.get<ServicePackage>(`/packages/${id}`);
  },

  /** GET /packages/my — employer's currently active purchased packages. */
  myPurchased() {
    return api.get<PurchasedPackage[]>('/packages/my');
  },

  /** GET /packages/history — employer's package purchase invoice history. */
  myHistory() {
    return api.get<CreditTransaction[]>('/packages/history');
  },

  /** POST /packages/purchase — buy a credit package (Employer). */
  purchase(packageId: string) {
    return api.post<{ message: string }>('/packages/purchase', { packageId });
  },

  // ─── Employer credit wallet (prefix /employers) ─────────────────────────────

  /** GET /employers/credit-balance — current credit balance. */
  creditBalance() {
    return api.get<CreditBalance>('/employers/credit-balance');
  },

  /** POST /employers/credit/transactions — paginated credit ledger (filterable). */
  creditTransactions(query: ListTransactionsQuery = {}) {
    return api.post<Paginated<CreditTransaction>>('/employers/credit/transactions', query);
  },

  // ─── Admin (prefix /packages/admin) ─────────────────────────────────────────

  /** GET /packages/admin — all packages (active + inactive). */
  adminListAll() {
    return api.get<ServicePackage[]>('/packages/admin');
  },

  /** GET /packages/credits/admin — global credit ledger across all tenants. */
  adminCreditLedger(page = 1, limit = 10) {
    return api.get<Paginated<CreditTransaction>>('/packages/credits/admin', {
      params: { page, limit },
    });
  },

  /** POST /packages/admin — create a new package. */
  adminCreate(payload: CreatePackagePayload) {
    return api.post<ServicePackage>('/packages/admin', payload);
  },

  /** PUT /packages/admin/:id — update an existing package. */
  adminUpdate(id: string, payload: UpdatePackagePayload) {
    return api.put<ServicePackage>(`/packages/admin/${id}`, payload);
  },

  /** DELETE /packages/admin/:id — soft-delete / deactivate a package. */
  adminRemove(id: string) {
    return api.delete<{ message: string }>(`/packages/admin/${id}`);
  },
};

export default packageService;
