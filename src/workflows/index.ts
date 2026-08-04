// src/workflows/index.ts — tiny workflow runner skeleton

export type WorkflowStep = {
  id: string;
  name: string;
  run: (input: any) => Promise<any>;
};

export class WorkflowEngine {
  steps: Map<string, WorkflowStep> = new Map();

  register(step: WorkflowStep) {
    this.steps.set(step.id, step);
  }

  async run(stepId: string, input: any) {
    const step = this.steps.get(stepId);
    if (!step) throw new Error('Step not found: ' + stepId);
    return step.run(input);
  }
}
