export type ComponentType = 'model' | 'tool' | 'skill' | 'worker' | 'adapter' | 'sensor';
export type ExecutionEnvironment = 'android-edge' | 'cloud' | 'github-action' | 'external-api';
export type PrivacyClass = 'local' | 'trusted-cloud' | 'public';

export interface ResourceProfile {
  cpuClass?: 'low' | 'medium' | 'high';
  memoryMb?: number;
  batteryCost?: 'low' | 'medium' | 'high';
  bandwidthCost?: 'low' | 'medium' | 'high';
  expectedLatencyMs?: number;
  monetaryCostClass?: 'free' | 'low' | 'variable' | 'premium';
}

export interface CapabilityComponent {
  id: string;
  type: ComponentType;
  capabilities: string[];
  execution: {
    environments: ExecutionEnvironment[];
    requiresNetwork: boolean;
  };
  invocation: {
    routerVisible: boolean;
    runtimeManaged: boolean;
  };
  policy: {
    defaultAccess: 'read-only' | 'execute' | 'write';
    privacy: PrivacyClass;
    humanApprovalFor: string[];
  };
  resourceProfile: ResourceProfile;
  telemetry: string[];
  evidence: {
    destination: 'github' | 'local' | 'telemetry';
  };
  lifecycle: {
    owner: string;
    versioned: boolean;
    fallback?: string;
    replacementContract?: string;
  };
}

export interface TwgtTask {
  id: string;
  intent: string;
  priority: 'low' | 'normal' | 'high';
  privacy: PrivacyClass;
  maxCost?: number;
  maxLatencyMs?: number;
  requires?: string[];
  contextRefs?: string[];
}

export interface ExecutionContext {
  network: 'wifi' | 'mobile' | 'offline';
  metered: boolean;
  batteryPct: number;
  charging: boolean;
}

export interface ResolvedComponent {
  component: CapabilityComponent;
  score: number;
  reasons: string[];
}
