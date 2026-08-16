import {
  PAGINATION_DEFAULT_PAGE_SIZE,
  PAGINATION_MAX_PAGE_SIZE,
} from './constants';

/** Keeps manually parsed pagination safe for both HTTP callers and service users. */
export function normalizePagination(
  input: { pageNo?: number; pageSize?: number },
  defaultPageSize = PAGINATION_DEFAULT_PAGE_SIZE,
) {
  const pageNo = Number.isFinite(input.pageNo) && input.pageNo! > 0
    ? Math.floor(input.pageNo!)
    : 1;
  const pageSize = Number.isFinite(input.pageSize) && input.pageSize! > 0
    ? Math.min(Math.floor(input.pageSize!), PAGINATION_MAX_PAGE_SIZE)
    : defaultPageSize;

  return { pageNo, pageSize, skip: (pageNo - 1) * pageSize };
}
