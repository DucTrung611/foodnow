import { PaginatedResult } from '../types/paginated-result.type';

export function paginate(
  page: number,
  limit: number,
): { skip: number; take: number } {
  return { skip: (page - 1) * limit, take: limit };
}

export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
