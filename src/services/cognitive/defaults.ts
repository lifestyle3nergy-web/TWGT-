import {
  type CycleInput,
  type CycleResponse,
  type Interpreter,
  type Observation,
  type Observer,
  type Responder,
  type Understanding,
} from './types';

/**
 * Baseline observer: captures the incoming signals and stamps the observation
 * time. Serves as a neutral starting point for richer perception strategies.
 */
export class PassthroughObserver<TSignal = unknown> implements Observer<TSignal> {
  public observe(input: CycleInput<TSignal>): Observation<TSignal> {
    return {
      signals: [...input.signals],
      metadata: { ...(input.metadata ?? {}) },
      observedAt: new Date().toISOString(),
    };
  }
}

/**
 * Baseline interpreter: treats each observed signal as a single insight and
 * derives confidence from how much evidence was available.
 */
export class EchoInterpreter<TSignal = unknown> implements Interpreter<TSignal, TSignal> {
  public understand(observation: Observation<TSignal>): Understanding<TSignal> {
    return {
      insights: [...observation.signals],
      confidence: observation.signals.length > 0 ? 1 : 0,
      reasonedAt: new Date().toISOString(),
    };
  }
}

/**
 * Baseline responder: emits one action per insight. Intended to be replaced by
 * responders that execute, generate, or communicate real outcomes.
 */
export class NoopResponder<TInsight = unknown> implements Responder<TInsight, TInsight> {
  public respond(understanding: Understanding<TInsight>): CycleResponse<TInsight> {
    return {
      actions: [...understanding.insights],
      respondedAt: new Date().toISOString(),
    };
  }
}
