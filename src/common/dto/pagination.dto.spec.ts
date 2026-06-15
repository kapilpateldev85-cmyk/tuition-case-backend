import 'reflect-metadata';
import { createPaginatedResponse } from './pagination.dto';

describe('createPaginatedResponse', () => {
  it('returns paginated shape with correct totalPages', () => {
    const result = createPaginatedResponse(['a', 'b'], 25, 2, 10);

    expect(result).toEqual({
      items: ['a', 'b'],
      total: 25,
      page: 2,
      limit: 10,
      totalPages: 3,
    });
  });

  it('returns zero totalPages when total is zero', () => {
    const result = createPaginatedResponse([], 0, 1, 10);

    expect(result.totalPages).toBe(0);
  });
});
