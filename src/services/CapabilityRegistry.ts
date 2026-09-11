import type {
  CapabilityComponent,
  ExecutionContext,
  ResolvedComponent,
  TwgtTask,
} from '../contracts/CapabilityComponent.js';

const VALID_LEVELS = new Set(['low', 'medium', 'high']);
const VALID_COST_CLASSES = new Set(['free', 'low', 'variable', 'premium']);
const VALID_PRIVACY_CLASSES = new Set(['local', 'trusted-cloud', 'public']);
const VALID_NETWORKS = new Set(['wifi', 'mobile', 'offline']);
const VALID_ENVIRONMENTS = new Set(['android-edge', 'cloud', 'github-action', 'external-api']);
const VALID_ACCESS_LEVELS = new Set(['read-only', 'execute', 'write']);
export const MOBILE_DEFERRED_CAPABILITIES: ReadonlySet<string> = new Set([
  'container.pull',
  'repository.clone.large',
  'model.download',
  'backup.bulk',
]);

const isNonNegativeFinite = (value: number): boolean =>
  Number.isFinite(value) && value >= 0;

export class CapabilityRegistry {
  private readonly components = new Map<string, CapabilityComponent>();

  register(component: CapabilityComponent): void {
    this.validateComponent(component);
    if (this.components.has(component.id)) {
      throw new Error('Component already registered: ' + component.id);
    }
    this.components.set(component.id, component);
  }

  list(): CapabilityComponent[] {
    return [...this.components.values()];
  }

  get(id: string): CapabilityComponent | undefined {
    return this.components.get(id);
  }

  capabilities(): string[] {
    return [...new Set(this.list().flatMap((component) => component.capabilities))].sort();
  }

  resolve(task: TwgtTask, context: ExecutionContext): ResolvedComponent[] {
    this.validateTask(task);
    this.validateContext(context);
    for (const component of this.components.values()) this.validateComponent(component);
    const required = new Set(task.requires ?? []);

    return this.list()
      .filter((component) => component.invocation.routerVisible)
      .filter((component) => [...required].every((capability) => component.capabilities.includes(capability)))
      .filter((component) => this.networkAllowed(component, task, context))
      .filter((component) => this.privacyAllowed(task, component))
      .filter((component) => this.withinTaskLimits(task, component))
      .map((component) => this.score(component, task, context))
      .sort((a, b) =>
        b.score - a.score ||
        (a.component.id < b.component.id ? -1 : a.component.id > b.component.id ? 1 : 0),
      );
  }

  private validateComponent(component: CapabilityComponent): void {
    if (typeof component.id !== 'string' || component.id.trim().length === 0) {
      throw new Error('Component id must be a non-empty string');
    }
    if (
      !Array.isArray(component.capabilities) ||
      component.capabilities.length === 0 ||
      component.capabilities.some((capability) => typeof capability !== 'string' || capability.trim().length === 0)
    ) {
      throw new Error('Component must declare at least one non-empty capability: ' + component.id);
    }

    if (typeof component.execution !== 'object' || component.execution === null) {
      throw new Error('Component execution must be an object: ' + component.id);
    }
    if (typeof component.execution.requiresNetwork !== 'boolean') {
      throw new Error('Component execution.requiresNetwork must be a boolean: ' + component.id);
    }
    if (
      !Array.isArray(component.execution.environments) ||
      component.execution.environments.length === 0 ||
      component.execution.environments.some((environment) => !VALID_ENVIRONMENTS.has(environment))
    ) {
      throw new Error('Component must declare at least one valid execution environment: ' + component.id);
    }

    if (typeof component.invocation !== 'object' || component.invocation === null) {
      throw new Error('Component invocation must be an object: ' + component.id);
    }
    if (
      typeof component.invocation.routerVisible !== 'boolean' ||
      typeof component.invocation.runtimeManaged !== 'boolean'
    ) {
      throw new Error('Component invocation routerVisible and runtimeManaged must be boolean: ' + component.id);
    }

    if (typeof component.policy !== 'object' || component.policy === null) {
      throw new Error('Component policy must be an object: ' + component.id);
    }
    if (!VALID_PRIVACY_CLASSES.has(component.policy.privacy)) {
      throw new Error('Component privacy class is invalid: ' + component.id);
    }
    if (!VALID_ACCESS_LEVELS.has(component.policy.defaultAccess)) {
      throw new Error('Component policy defaultAccess is invalid: ' + component.id);
    }
    if (
      !Array.isArray(component.policy.humanApprovalFor) ||
      component.policy.humanApprovalFor.some(
        (operation) => typeof operation !== 'string' || operation.trim().length === 0,
      )
    ) {
      throw new Error('Component policy humanApprovalFor must be an array of non-empty strings: ' + component.id);
    }

    if (
      !Array.isArray(component.telemetry) ||
      component.telemetry.some((metric) => typeof metric !== 'string' || metric.trim().length === 0)
    ) {
      throw new Error('Component telemetry must be an array of non-empty strings: ' + component.id);
    }

    if (typeof component.resourceProfile !== 'object' || component.resourceProfile === null) {
      throw new Error('Component resourceProfile must be an object: ' + component.id);
    }
    const profile = component.resourceProfile;
    for (const [name, value] of [
      ['memoryMb', profile.memoryMb],
      ['expectedLatencyMs', profile.expectedLatencyMs],
      ['expectedCost', profile.expectedCost],
    ] as const) {
      if (value !== undefined && !isNonNegativeFinite(value)) {
        throw new Error('Component ' + name + ' must be a non-negative finite number: ' + component.id);
      }
    }
    for (const [name, value] of [
      ['cpuClass', profile.cpuClass],
      ['batteryCost', profile.batteryCost],
      ['bandwidthCost', profile.bandwidthCost],
    ] as const) {
      if (value !== undefined && !VALID_LEVELS.has(value)) {
        throw new Error('Component ' + name + ' is invalid: ' + component.id);
      }
    }
    if (
      profile.monetaryCostClass !== undefined &&
      !VALID_COST_CLASSES.has(profile.monetaryCostClass)
    ) {
      throw new Error('Component monetaryCostClass is invalid: ' + component.id);
    }
  }

  private validateTask(task: TwgtTask): void {
    if (typeof task !== 'object' || task === null) {
      throw new Error('Task must be an object');
    }
    if (typeof task.id !== 'string' || task.id.trim().length === 0) {
      throw new Error('Task id must be a non-empty string');
    }
    if (typeof task.intent !== 'string' || task.intent.trim().length === 0) {
      throw new Error('Task intent must be a non-empty string');
    }
    if (!VALID_PRIVACY_CLASSES.has(task.privacy)) {
      throw new Error('Task privacy class is invalid');
    }
    for (const [name, value] of [
      ['requires', task.requires],
      ['contextRefs', task.contextRefs],
    ] as const) {
      if (
        value !== undefined &&
        (!Array.isArray(value) ||
          value.some((entry) => typeof entry !== 'string' || entry.trim().length === 0))
      ) {
        throw new Error('Task ' + name + ' must be an array of non-empty strings');
      }
    }
    for (const [name, value] of [
      ['maxCost', task.maxCost],
      ['maxLatencyMs', task.maxLatencyMs],
    ] as const) {
      if (value !== undefined && !isNonNegativeFinite(value)) {
        throw new Error('Task ' + name + ' must be a non-negative finite number');
      }
    }
  }

  private validateContext(context: ExecutionContext): void {
    if (typeof context !== 'object' || context === null) {
      throw new Error('Execution context must be an object');
    }
    if (!VALID_NETWORKS.has(context.network)) {
      throw new Error('Execution context network is invalid');
    }
    if (typeof context.metered !== 'boolean' || typeof context.charging !== 'boolean') {
      throw new Error('Execution context metered and charging values must be boolean');
    }
    if (!Number.isFinite(context.batteryPct) || context.batteryPct < 0 || context.batteryPct > 100) {
      throw new Error('Execution context batteryPct must be between 0 and 100');
    }
  }

  private networkAllowed(
    component: CapabilityComponent,
    task: TwgtTask,
    context: ExecutionContext,
  ): boolean {
    if (context.network === 'offline' && component.execution.requiresNetwork) return false;
    if (
      context.network === 'mobile' &&
      (task.requires ?? []).some((capability) => MOBILE_DEFERRED_CAPABILITIES.has(capability))
    ) {
      return false;
    }
    return !(context.metered && component.resourceProfile.bandwidthCost === 'high');
  }

  private withinTaskLimits(task: TwgtTask, component: CapabilityComponent): boolean {
    if (
      task.maxLatencyMs !== undefined &&
      (component.resourceProfile.expectedLatencyMs === undefined ||
        !isNonNegativeFinite(component.resourceProfile.expectedLatencyMs) ||
        component.resourceProfile.expectedLatencyMs > task.maxLatencyMs)
    ) {
      return false;
    }
    if (
      task.maxCost !== undefined &&
      (component.resourceProfile.expectedCost === undefined ||
        !isNonNegativeFinite(component.resourceProfile.expectedCost) ||
        component.resourceProfile.expectedCost > task.maxCost)
    ) {
      return false;
    }
    return true;
  }

  private privacyAllowed(task: TwgtTask, component: CapabilityComponent): boolean {
    if (task.privacy === 'local') {
      return component.policy.privacy === 'local';
    }
    if (task.privacy === 'trusted-cloud') {
      return component.policy.privacy !== 'public';
    }
    return true;
  }

  private score(
    component: CapabilityComponent,
    task: TwgtTask,
    context: ExecutionContext,
  ): ResolvedComponent {
    let score = 100;
    const reasons: string[] = ['capability-fit'];

    if (context.network === 'mobile' && component.resourceProfile.bandwidthCost === 'high') {
      score -= 30;
      reasons.push('mobile-bandwidth-penalty');
    }

    if (!context.charging && context.batteryPct < 25 && component.resourceProfile.batteryCost === 'high') {
      score -= 30;
      reasons.push('battery-penalty');
    }

    if (component.resourceProfile.monetaryCostClass === 'premium') {
      score -= 20;
      reasons.push('cost-penalty');
    }

    if (component.execution.environments.includes('android-edge') && task.privacy === 'local') {
      score += 20;
      reasons.push('locality-bonus');
    }

    return {
      component,
      score,
      reasons,
      approvalRequired: component.policy.defaultAccess !== 'read-only',
    };
  }
}
