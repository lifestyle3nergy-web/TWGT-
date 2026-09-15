import { CognitivePhase } from './types';

/**
 * Raised when a cognitive cycle phase fails. Preserves the originating phase
 * and the underlying cause so failures propagate with full context instead of
 * being silently swallowed.
 */
export class CognitiveCycleError extends Error {
  public readonly phase: CognitivePhase;

  constructor(phase: CognitivePhase, cause: unknown) {
    super(`Cognitive cycle failed during ${phase} phase: ${describeCause(cause)}`, {
      cause,
    });

    this.name = 'CognitiveCycleError';
    this.phase = phase;

    // Restore the prototype chain when targeting older transpilation output.
    Object.setPrototypeOf(this, CognitiveCycleError.prototype);
  }
}

function describeCause(cause: unknown): string {
  if (cause instanceof Error) {
    return cause.message;
  }

  return String(cause);
}
