import { CognitiveCycleError } from './CognitiveCycleError';
import {
  CognitivePhase,
  type CycleInput,
  type CycleLogger,
  type CycleResult,
  type Interpreter,
  type Observer,
  type Responder,
} from './types';

export interface CognitiveCycleDependencies<
  TSignal = unknown,
  TInsight = unknown,
  TAction = unknown,
> {
  readonly observer: Observer<TSignal>;
  readonly interpreter: Interpreter<TSignal, TInsight>;
  readonly responder: Responder<TInsight, TAction>;
  readonly logger?: CycleLogger;
}

/**
 * Orchestrates a single Observe -> Understand -> Respond cognitive cycle.
 *
 * Each phase is delegated to an injected collaborator, so strategies can be
 * swapped without touching the control flow. Any phase failure is wrapped in a
 * {@link CognitiveCycleError} and re-thrown so callers can react rather than
 * receiving a partial, misleading result.
 */
export class CognitiveCycleService<TSignal = unknown, TInsight = unknown, TAction = unknown> {
  private readonly observer: Observer<TSignal>;
  private readonly interpreter: Interpreter<TSignal, TInsight>;
  private readonly responder: Responder<TInsight, TAction>;
  private readonly logger?: CycleLogger;

  constructor(dependencies: CognitiveCycleDependencies<TSignal, TInsight, TAction>) {
    this.observer = dependencies.observer;
    this.interpreter = dependencies.interpreter;
    this.responder = dependencies.responder;
    this.logger = dependencies.logger;
  }

  /**
   * Run one full cognitive cycle over the provided input.
   */
  public async run(input: CycleInput<TSignal>): Promise<CycleResult<TSignal, TInsight, TAction>> {
    const startedAt = new Date();

    this.logger?.debug(`Cognitive cycle started with ${input.signals.length} signal(s).`);

    const observation = await this.runPhase(CognitivePhase.OBSERVE, () =>
      this.observer.observe(input),
    );

    const understanding = await this.runPhase(CognitivePhase.UNDERSTAND, () =>
      this.interpreter.understand(observation),
    );

    const response = await this.runPhase(CognitivePhase.RESPOND, () =>
      this.responder.respond(understanding),
    );

    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();

    this.logger?.info(
      `Cognitive cycle completed in ${durationMs}ms with ${response.actions.length} action(s).`,
    );

    return {
      observation,
      understanding,
      response,
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      durationMs,
    };
  }

  private async runPhase<TPhaseResult>(
    phase: CognitivePhase,
    execute: () => Promise<TPhaseResult> | TPhaseResult,
  ): Promise<TPhaseResult> {
    try {
      return await execute();
    } catch (error) {
      const wrapped = new CognitiveCycleError(phase, error);
      this.logger?.error('Cognitive cycle phase failed.', wrapped);
      throw wrapped;
    }
  }
}
