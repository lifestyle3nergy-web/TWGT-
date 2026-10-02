import { describe, expect, it } from "vitest";
import canonicalize from "canonicalize";

describe("RFC 8785 JCS conformance", () => {
  it("canonicalizes object properties deterministically", () => {
    const input = {
      z: 1,
      a: 2,
      nested: {
        z: true,
        a: false,
      },
    };

    expect(canonicalize(input)).toBe(
      '{"a":2,"nested":{"a":false,"z":true},"z":1}',
    );
  });

  it("canonicalizes arrays without changing array order", () => {
    const input = {
      values: [3, 1, 2],
    };

    expect(canonicalize(input)).toBe('{"values":[3,1,2]}');
  });

  it("canonicalizes strings and Unicode", () => {
    const input = {
      euro: "€",
      text: "é",
    };

    expect(canonicalize(input)).toBe('{"euro":"€","text":"é"}');
  });

  it("removes insignificant whitespace", () => {
    const input = {
      b: [1, 2],
      a: "value",
    };

    expect(canonicalize(input)).toBe('{"a":"value","b":[1,2]}');
  });

  it("canonicalizes numeric values using JCS serialization", () => {
    const vectors: Array<[number, string]> = [
      [0, "0"],
      [-0, "0"],
      [5e-324, "5e-324"],
      [-5e-324, "-5e-324"],
      [1e21, "1e+21"],
      [1e23, "1e+23"],
      [1e-6, "0.000001"],
      [333333333.3333333, "333333333.3333333"],
      [9007199254740992, "9007199254740992"],
    ];

    for (const [input, expected] of vectors) {
      expect(canonicalize(input)).toBe(expected);
    }
  });

  it("produces identical canonical output regardless of object insertion order", () => {
    const first = {
      z: 3,
      a: 1,
      m: 2,
    };

    const second = {
      m: 2,
      z: 3,
      a: 1,
    };

    expect(canonicalize(first)).toBe(canonicalize(second));
  });

  it("rejects non-finite numbers", () => {
    expect(() => canonicalize(NaN)).toThrow();
    expect(() => canonicalize(Infinity)).toThrow();
    expect(() => canonicalize(-Infinity)).toThrow();
  });

  it("returns undefined for undefined input", () => {
    expect(canonicalize(undefined)).toBeUndefined();
  });
});
