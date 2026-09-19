import { describe, expect, it } from 'vitest';
import { Bootstrap } from '@core/Bootstrap';

describe('Bootstrap', () => {
  it('constructs without throwing', () => {
    expect(() => new Bootstrap()).not.toThrow();
  });
});
