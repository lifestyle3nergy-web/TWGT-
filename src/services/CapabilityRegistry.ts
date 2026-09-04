import type {
  CapabilityComponent,
  ExecutionContext,
  ResolvedComponent,
  TwgtTask,
} from '../contracts/CapabilityComponent.js';

export class CapabilityRegistry {
  private readonly components = new Map<string, CapabilityComponent>();

  register(component: CapabilityComponent): void {
    if (this.components.has(component.id)) {
      throw new Error(`Component already registered: ${component.id}`);
    }
    if (component.capabilities.length === 0) {
      throw new Error(`Component must declare at least one capability: ${component.id}`);
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
    const required = new Set(task.requires ?? []);

    return this.list()
      .filter((component) => component.invocation.routerVisible)
      .filter((component) => [...required].every((capability) => component.capabilities.includes(capability)))
      .filter((component) => !(context.network === 'offline' && component.execution.requiresNetwork))
      .filter((component) => this.privacyAllowed(task, component))
      .map((component) => this.score(component, task, context))
      .sort((a, b) => b.score - a.score);
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

    const latency = component.resourceProfile.expectedLatencyMs ?? 0;
    if (task.maxLatencyMs !== undefined && latency > task.maxLatencyMs) {
      score -= 40;
      reasons.push('latency-penalty');
    }

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

    return { component, score, reasons };
  }
}
