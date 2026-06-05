export { apiRequest, ApiError, isApiConfigured, getApiBaseUrl } from "./client";
export {
  clearApiBearerToken,
  getApiBearerToken,
  setApiBearerToken,
  notifyApiSessionExpired,
  API_SESSION_EXPIRED_EVENT,
} from "./auth-token";
export * from "./admin-types";
export { ADMIN_ROUTES, AUTH_ROUTES } from "./routes";
export {
  unwrapListData,
  unwrapPaginationMeta,
  type ListPayload,
  type PaginatedResponse,
  type PaginationMeta,
} from "./pagination";
export {
  formatUserFacingError,
  humanizeErrorMessage,
  messageFromApiError,
  GENERIC_ERROR_MESSAGE,
  SESSION_REQUIRED_MESSAGE,
} from "./errors";
export {
  mapAdminBookToMockLivre,
  mapAdminPlanToMockPlan,
  mapAdminSubscriptionToMockAbonnement,
  mapAdminUserToMockUser,
} from "./adapters";
