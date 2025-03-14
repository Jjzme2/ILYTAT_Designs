/**
 * Basic example test for Jest demonstration
 */

describe('Basic Jest functionality', () => {
  test('basic assertions work', () => {
    expect(true).toBe(true);
    expect(1 + 1).toBe(2);
    expect('hello world').toContain('hello');
    expect([1, 2, 3]).toHaveLength(3);
  });

  test('async operations work', async () => {
    const result = await Promise.resolve('success');
    expect(result).toBe('success');
  });
});
