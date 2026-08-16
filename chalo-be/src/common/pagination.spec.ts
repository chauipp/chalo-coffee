import { normalizePagination } from './pagination';

describe('normalizePagination', () => {
  it.each([
    ['default and invalid values', {}, { pageNo: 1, pageSize: 20, skip: 0 }, 20],
    ['custom endpoint default', { pageSize: 0 }, { pageNo: 1, pageSize: 10, skip: 0 }, 10],
    ['max page size and integer page', { pageNo: 2.9, pageSize: 1_000 }, { pageNo: 2, pageSize: 100, skip: 100 }, 20],
    ['negative values', { pageNo: -3, pageSize: -1 }, { pageNo: 1, pageSize: 20, skip: 0 }, 20],
  ] as const)('%s is normalised deterministically', (_label, input, expected, defaultPageSize) => {
    expect(normalizePagination(input, defaultPageSize)).toEqual(expected);
  });
});
