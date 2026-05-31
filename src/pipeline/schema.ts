/**
 * Pipeline definition types and validation.
 * Replicates Bailian bl CLI's workflow/v1 schema.
 */

export type StepType =
  | 'text/chat'
  | 'music/info'
  | 'music/url'
  | 'playlist/tracks'
  | 'playlist/summary'
  | 'user/history'
  | 'user/profile'
  | 'album/show'
  | 'search'
  | 'recommend/songs'
  | 'script/js'
  | 'logic/switch'
  | 'logic/select'
  | 'logic/assert';

export interface RetryDef {
  maxAttempts: number;
  backoff?: 'none' | 'linear' | 'exponential';
}

export interface StepDef {
  id: string;
  type: StepType;
  input: Record<string, any>;
  dependsOn?: string[];
  when?: any;
  retry?: RetryDef;
  timeout?: number;
}

export interface InputDef {
  type: string;
  description?: string;
  default?: any;
}

export interface PipelineDef {
  version: string;
  inputs?: Record<string, InputDef>;
  steps: StepDef[];
}

export interface StepResult {
  id: string;
  type: string;
  status: 'succeeded' | 'failed' | 'skipped';
  output?: any;
  error?: any;
  startedAt: string;
  finishedAt: string;
  dependencies: string[];
}

export interface PipelineEvent {
  type:
    | 'pipeline.started'
    | 'pipeline.succeeded'
    | 'pipeline.failed'
    | 'step.started'
    | 'step.succeeded'
    | 'step.failed'
    | 'step.skipped'
    | 'step.retrying'
    | 'step.input.resolved';
  timestamp: string;
  status: string;
  step?: any;
  error?: any;
}
