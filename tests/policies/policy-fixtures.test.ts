import { describe, expect, it } from 'vitest';
import edgePolicy from '../../src/policies/edge-execution-policy.json';
import inspectorFixture from '../../src/registries/components/github-repository-inspector.json';
import {
  CapabilityRegistry,
  MOBILE_DEFERRED_CAPABILITIES,
} from '../../src/services/CapabilityRegistry.js';
import type { CapabilityComponent } from '../../src/contracts/CapabilityComponent.js';

describe('edge-execution-policy fixture', () => {
  it('declares a structurally valid policy document', () => {
    expect(edgePolicy.version).toBe(1);
    expect(typeof edgePolicy.androidEdge.persistentProcess).toBe('boolean');
    expect(typeof edgePolicy.androidEdge.heavyweightBuild).toBe('boolean');
    expect(typeof edgePolicy.androidEdge.largeModel).toBe('boolean');
    expect(typeof edgePolicy.androidEdge.largeVectorStore).toBe('boolean');
    expect(
      edgePolicy.androidEdge.preferredCapabilities.every(
        (capability: unknown) => typeof capability === 'string' && capability.trim().length > 0,
      ),
    ).toBe(true);

    for (const network of ['metered', 'wifi', 'mobile', 'offline'] as const) {
      expect(edgePolicy.network[network]).toBeDefined();
      for (const list of Object.values(edgePolicy.network[network] ?? {}) as string[][]) {
        expect(list.every((entry) => typeof entry === 'string' && entry.trim().length > 0)).toBe(true);
      }
    }
  });

  it('keeps the enforced mobile deferral set in parity with the policy document', () => {
    const documented = [...edgePolicy.network.mobile.defer].sort();
    const enforced = [...MOBILE_DEFERRED_CAPABILITIES].sort();
    expect(documented).toEqual(enforced);
  });
});

describe('github-repository-inspector fixture', () => {
  it('declares only read-only capabilities and a read-only default access', () => {
    expect(inspectorFixture.id).toBe('github-repository-inspector');
    expect(inspectorFixture.policy.defaultAccess).toBe('read-only');
    for (const capability of inspectorFixture.capabilities) {
      expect(capability).toMatch(/read$/);
    }
    expect(inspectorFixture.capabilities).not.toContain('repository.write');
    expect(inspectorFixture.capabilities).not.toContain('merge');
    expect(inspectorFixture.execution.requiresNetwork).toBe(true);
    expect(inspectorFixture.evidence.destination).toBe('github');
  });

  it('is a valid registry component that resolves read-only and never offline', () => {
    const registry = new CapabilityRegistry();
    registry.register(inspectorFixture as unknown as CapabilityComponent);

    const wifiContext = { network: 'wifi' as const, metered: false, batteryPct: 80, charging: false };
    const offlineContext = { network: 'offline' as const, metered: false, batteryPct: 80, charging: false };
    const readTask = {
      id: 'task-fixture',
      intent: 'repository.inspect',
      priority: 'normal' as const,
      privacy: 'trusted-cloud' as const,
      requires: ['repository.read'],
    };

    const resolved = registry.resolve(readTask, wifiContext);
    expect(resolved.map((entry) => entry.component.id)).toEqual(['github-repository-inspector']);
    expect(resolved[0]?.approvalRequired).toBe(false);
    expect(registry.resolve(readTask, offlineContext)).toEqual([]);
  });
});
