import { describe, expect, it } from 'vitest';
import { CapabilityRegistry } from '../../src/services/CapabilityRegistry.js';
import type { CapabilityComponent, TwgtTask } from '../../src/contracts/CapabilityComponent.js';

const githubInspector: CapabilityComponent = {
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

describe('CapabilityRegistry', () => {
  it('resolves a matching network capability', () => {
    const registry = new CapabilityRegistry();
    registry.register(githubInspector);

    const result = registry.resolve(task, {
      network: 'wifi',
      metered: false,
      batteryPct: 80,
      charging: false,
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.component.id).toBe('github-repository-inspector');
  });

  it('does not route a network-required component while offline', () => {
    const registry = new CapabilityRegistry();
    registry.register(githubInspector);

    expect(
      registry.resolve(task, {
        network: 'offline',
        metered: false,
        batteryPct: 80,
        charging: false,
      }),
    ).toHaveLength(0);
  });

  it('rejects duplicate registrations', () => {
    const registry = new CapabilityRegistry();
    registry.register(githubInspector);
    expect(() => registry.register(githubInspector)).toThrow(/already registered/);
  });
});
