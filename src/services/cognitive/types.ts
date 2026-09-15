/**
 * Cognitive Cycle engine contracts.
 *
 * The cycle models the OUR operational loop from the KAI-OS handover:
 * Observe -> Understand -> Respond. Each phase is a small, replaceable unit so
 * that reasoning strategies can evolve without rewriting the orchestrator.
 */

/**
 * The three ordered phases of a single cognitive cycle.
 */
export enum CognitivePhase {
  OBSERVE = 'OBSERVE',
  UNDERSTAND = 'UNDERSTAND',
  RESPOND = 'RESPOND',
}

/**
 * Raw material fed into a cycle: the signals gathered from the environment.
 */
export interface CycleInput<TSignal = unknown> {
  readonly signals: readonly TSignal[];
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/**
 * Structured result of the OBSERVE phase.
 */
export interface Observation<TSignal = unknown> {
  readonly signals: readonly TSignal[];
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly observedAt: string;
}

/**
 * Structured result of the UNDERSTAND phase.
 */
export interface Understanding<TInsight = unknown> {
  readonly insights: readonly TInsight[];
  readonly confidence: number;
  readonly reasonedAt: string;
}

/**
 * Structured result of the RESPOND phase.
 */
export interface CycleResponse<TAction = unknown> {
  readonly actions: readonly TAction[];
  readonly respondedAt: string;
}

/**
 * Gathers signals and context into an Observation.
 */
export interface Observer<TSignal = unknown> {
  observe(input: CycleInput<TSignal>): Promise<Observation<TSignal>> | Observation<TSignal>;
}

/**
 * Analyses an Observation and produces reasoned insight.
 */
export interface Interpreter<TSignal = unknown, TInsight = unknown> {
  understand(
    observation: Observation<TSignal>,
  ): Promise<Understanding<TInsight>> | Understanding<TInsight>;
}

/**
 * Turns Understanding into concrete actions.
 */
export interface Responder<TInsight = unknown, TAction = unknown> {
  respond(
    understanding: Understanding<TInsight>,
  ): Promise<CycleResponse<TAction>> | CycleResponse<TAction>;
}

/**
 * The complete, evidence-carrying outcome of one cognitive cycle.
 */
export interface CycleResult<TSignal = unknown, TInsight = unknown, TAction = unknown> {
  readonly observation: Observation<TSignal>;
  readonly understanding: Understanding<TInsight>;
  readonly response: CycleResponse<TAction>;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly durationMs: number;
}

/**
 * Minimal structural logger the engine can report through. Deliberately
 * compatible with the platform LoggerService without importing it, keeping the
 * engine decoupled and easy to test.
 */
export interface CycleLogger {
  debug(message: string): void;
  info(message: string): void;
  error(message: string, error?: unknown): void;
}
