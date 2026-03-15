import { getTrustLevel } from '@/lib/creditScore';

describe('getTrustLevel', () => {
  it('returns "new" for score 0', () => {
    expect(getTrustLevel(0)).toBe('new');
  });

  it('returns "new" for score 10 (upper boundary)', () => {
    expect(getTrustLevel(10)).toBe('new');
  });

  it('returns "trustworthy" for score 11 (lower boundary)', () => {
    expect(getTrustLevel(11)).toBe('trustworthy');
  });

  it('returns "trustworthy" for score 30 (upper boundary)', () => {
    expect(getTrustLevel(30)).toBe('trustworthy');
  });

  it('returns "reputable" for score 31 (lower boundary)', () => {
    expect(getTrustLevel(31)).toBe('reputable');
  });

  it('returns "reputable" for score 50 (upper boundary)', () => {
    expect(getTrustLevel(50)).toBe('reputable');
  });

  it('returns "excellent" for score 51 (lower boundary)', () => {
    expect(getTrustLevel(51)).toBe('excellent');
  });

  it('returns "excellent" for score 100 (upper boundary)', () => {
    expect(getTrustLevel(100)).toBe('excellent');
  });

  it('returns "top_worker" for score 101', () => {
    expect(getTrustLevel(101)).toBe('top_worker');
  });

  it('returns "new" for negative scores', () => {
    expect(getTrustLevel(-5)).toBe('new');
  });
});
