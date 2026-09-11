import { describe, expect, it } from 'vitest';
import { CapabilityRegistry } from '../../src/services/CapabilityRegistry.js';
import type {
  CapabilityComponent,
  ExecutionContext,
  TwgtTask,
} from '../../src/contracts/CapabilityComponent.js';

const baseComponent: CapabilityComponent = {
  id: 'github-repository-inspector',
  type: 'tool',
  capabilities: ['repository.read', 'workflow.read'],
  execution: { environments: ['cloud'], requiresNetwork: true },
  invocation: { routerVisible: true, runtimeManaged: true },
  policy: {
    defaultAccess: 'read-only',
    privacy: 'trusted-cloud',
    humanApprovalFor: ['repository.write', 'merge'],
  },
  resourceProfile: {
    cpuClass: 'low',
    batteryCost: 'low',
    bandwidthCost: 'low',
    expectedLatencyMs: 100,
    expectedCost: 0,
    monetaryCostClass: 'free',
  },
  telemetry: ['duration_ms', 'success'],
  evidence: { destination: 'github' },
  lifecycle: { owner: 'TWGT', versioned: true },
};

const task: TwgtTask = {
  id: 'task-1',
  intent: 'repository.review',
  priority: 'normal',
  privacy: 'trusted-cloud',
  requires: ['repository.read', 'workflow.read'],
};

const context: ExecutionContext = {
  network: 'wifi',
  metered: false,
  batteryPct: 80,
  charging: false,
};

function component(
  id: string,
  overrides: Partial<CapabilityComponent> = {},
): CapabilityComponent {
  return {
    ...baseComponent,
    ...overrides,
    id,
    execution: { ...baseComponent.execution, ...overrides.execution },
    invocation: { ...baseComponent.invocation, ...overrides.invocation },
    policy: { ...baseComponent.policy, ...overrides.policy },
    resourceProfile: { ...baseComponent.resourceProfile, ...overrides.resourceProfile },
    evidence: { ...baseComponent.evidence, ...overrides.evidence },
    lifecycle: { ...baseComponent.lifecycle, ...overrides.lifecycle },
  };
}

describe('CapabilityRegistry admission', () => {
  it('rejects duplicate registrations', () => {
    const registry = new CapabilityRegistry();
    registry.register(baseComponent);
    expect(() => registry.register(baseComponent)).toThrow(/already registered/);
  });

  it.each([
    component(''),
    component('bad-latency', { resourceProfile: { expectedLatencyMs: -1 } }),
    component('bad-cost', { resourceProfile: { expectedCost: Number.NaN } }),
    component('bad-memory', { resourceProfile: { memoryMb: -1 } }),
    component('bad-bandwidth', {
      resourceProfile: { bandwidthCost: 'invalid' as 'high' },
    }),
  ])('rejects malformed component input', (candidate) => {
    expect(() => new CapabilityRegistry().register(candidate)).toThrow();
  });

  it.each([
    [{ ...task, maxCost: -1 }, context],
    [{ ...task, maxLatencyMs: -1 }, context],
    [task, { ...context, batteryPct: -1 }],
    [task, { ...context, batteryPct: 101 }],
  ] as const)('rejects malformed task or context input', (invalidTask, invalidContext) => {
    const registry = new CapabilityRegistry();
    registry.register(baseComponent);
    expect(() => registry.resolve(invalidTask, invalidContext)).toThrow();
  });
});

describe('CapabilityRegistry hard constraints', () => {
  it('filters candidates over or missing the maximum latency', () => {
    const registry = new CapabilityRegistry();
    registry.register(component('within', { resourceProfile: { expectedLatencyMs: 50 } }));
    registry.register(component('over', { resourceProfile: { expectedLatencyMs: 51 } }));
    registry.register(component('unknown', { resourceProfile: { expectedLatencyMs: undefined } }));

    expect(registry.resolve({ ...task, maxLatencyMs: 50 }, context).map((entry) => entry.component.id))
      .toEqual(['within']);
  });

  it('filters candidates over or missing the maximum cost', () => {
    const registry = new CapabilityRegistry();
    registry.register(component('within', { resourceProfile: { expectedCost: 2 } }));
    registry.register(component('over', { resourceProfile: { expectedCost: 2.01 } }));
    registry.register(component('unknown', { resourceProfile: { expectedCost: undefined } }));

    expect(registry.resolve({ ...task, maxCost: 2 }, context).map((entry) => entry.component.id))
      .toEqual(['within']);
  });

  it('treats metering independently from transport', () => {
    const highBandwidth = component('high-bandwidth', {
      resourceProfile: { bandwidthCost: 'high' },
    });

    const unmeteredMobile = new CapabilityRegistry();
    unmeteredMobile.register(highBandwidth);
    expect(unmeteredMobile.resolve(task, { ...context, network: 'mobile' })).toHaveLength(1);

    const meteredWifi = new CapabilityRegistry();
    meteredWifi.register(highBandwidth);
    expect(meteredWifi.resolve(task, { ...context, metered: true })).toHaveLength(0);
  });

  it('defers transport-specific mobile capabilities without treating mobile as metered', () => {
    const registry = new CapabilityRegistry();
    registry.register(component('download', { capabilities: ['model.download'] }));

    expect(
      registry.resolve(
        { ...task, requires: ['model.download'] },
        { ...context, network: 'mobile', metered: false },
      ),
    ).toHaveLength(0);
  });

  it('rejects network-required components offline', () => {
    const registry = new CapabilityRegistry();
    registry.register(baseComponent);
    expect(registry.resolve(task, { ...context, network: 'offline' })).toHaveLength(0);
  });

  it('enforces local and trusted-cloud privacy boundaries', () => {
    const registry = new CapabilityRegistry();
    registry.register(component('local', { policy: { ...baseComponent.policy, privacy: 'local' } }));
    registry.register(component('trusted', { policy: { ...baseComponent.policy, privacy: 'trusted-cloud' } }));
    registry.register(component('public', { policy: { ...baseComponent.policy, privacy: 'public' } }));

    expect(registry.resolve({ ...task, privacy: 'local' }, context).map((entry) => entry.component.id))
      .toEqual(['local']);
    expect(
      registry.resolve({ ...task, privacy: 'trusted-cloud' }, context).map((entry) => entry.component.id),
    ).toEqual(['local', 'trusted']);
  });
});

describe('CapabilityRegistry decisions', () => {
  it('returns no match for missing capabilities', () => {
    const registry = new CapabilityRegistry();
    registry.register(baseComponent);
    expect(registry.resolve({ ...task, requires: ['model.generate'] }, context)).toEqual([]);
  });

  it('penalizes high battery cost below the threshold when not charging', () => {
    const registry = new CapabilityRegistry();
    registry.register(component('battery-heavy', { resourceProfile: { batteryCost: 'high' } }));
    const [result] = registry.resolve(task, { ...context, batteryPct: 24 });
    expect(result?.reasons).toContain('battery-penalty');
  });

  it('orders equal scores deterministically by component id', () => {
    const registry = new CapabilityRegistry();
    registry.register(component('zeta'));
    registry.register(component('alpha'));
    registry.register(component('middle'));

    expect(registry.resolve(task, context).map((entry) => entry.component.id))
      .toEqual(['alpha', 'middle', 'zeta']);
  });
});


describe('CapabilityRegistry reviewed edge cases', () => {
  it('rejects unknown task and component privacy classes', () => {
    const registry = new CapabilityRegistry();
    expect(() =>
      registry.register(
        component('invalid-privacy', {
          policy: {
            ...baseComponent.policy,
            privacy: 'unknown' as CapabilityComponent['policy']['privacy'],
          },
        }),
      ),
    ).toThrow(/privacy class is invalid/);

    registry.register(baseComponent);
    expect(() =>
      registry.resolve(
        { ...task, privacy: 'unknown' as TwgtTask['privacy'] },
        context,
      ),
    ).toThrow(/privacy class is invalid/);
  });

  it('rejects incomplete or invalid connectivity contexts', () => {
    const registry = new CapabilityRegistry();
    registry.register(baseComponent);

    for (const invalid of [
      { ...context, network: 'unknown' as ExecutionContext['network'] },
      { ...context, metered: undefined as unknown as boolean },
      { ...context, charging: undefined as unknown as boolean },
    ]) {
      expect(() => registry.resolve(task, invalid)).toThrow();
    }
  });

  it('revalidates mutable estimates before applying hard limits', () => {
    const registry = new CapabilityRegistry();
    const mutable = component('mutable');
    registry.register(mutable);
    mutable.resourceProfile.expectedCost = Number.NaN;

    expect(() => registry.resolve({ ...task, maxCost: 1 }, context)).toThrow(
      /expectedCost/,
    );
  });

  it('defers only the mobile capability requested by the task', () => {
    const registry = new CapabilityRegistry();
    registry.register(
      component('multi-capability', {
        capabilities: ['repository.read', 'model.download'],
      }),
    );

    expect(
      registry.resolve(
        { ...task, requires: ['repository.read'] },
        { ...context, network: 'mobile' },
      ),
    ).toHaveLength(1);
    expect(
      registry.resolve(
        { ...task, requires: ['model.download'] },
        { ...context, network: 'mobile' },
      ),
    ).toHaveLength(0);
  });

  it('uses a total code-unit order for canonically equivalent identifiers', () => {
    const registry = new CapabilityRegistry();
    registry.register(component('é'));
    registry.register(component('e\u0301'));

    expect(registry.resolve(task, context).map((entry) => entry.component.id))
      .toEqual(['e\u0301', 'é']);
  });
});
