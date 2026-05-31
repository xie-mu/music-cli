/**
 * Pipeline execution engine.
 * Validates → builds graph → topo sorts → executes steps → emits events.
 * Replicates Bailian bl CLI pipeline execution.
 */

import { existsSync, readFileSync } from 'node:fs';
import { parse as parseYaml } from 'yaml';
import { StepDef, StepResult, PipelineDef } from './schema.js';
import { buildGraph, topologicalSort } from './graph.js';
import { evaluate, resolveExpressions, EvalContext } from './expression.js';
import { NeteaseError } from '../error.js';
import { Config } from '../types/core.js';

type StepExecutor = (type: string, input: any, config: Config) => Promise<any>;

export class PipelineEngine {
  private executors = new Map<string, StepExecutor>();

  register(type: string, executor: StepExecutor): void {
    this.executors.set(type, executor);
  }

  /**
   * Load and parse a pipeline YAML/JSON file.
   */
  load(filePath: string): PipelineDef {
    if (!existsSync(filePath)) {
      throw new NeteaseError('USAGE', `Pipeline file not found: ${filePath}`);
    }
    const content = readFileSync(filePath, 'utf-8');

    // Try JSON first, then YAML
    let def: any;
    try {
      def = JSON.parse(content);
    } catch {
      def = parseYaml(content);
    }

    validate(def);
    return def as PipelineDef;
  }

  /**
   * Run a pipeline.
   */
  async run(
    def: PipelineDef,
    input: Record<string, any>,
    config: Config
  ): Promise<{ status: string; steps: StepResult[] }> {
    const stepOutputs = new Map<string, any>();
    const results: StepResult[] = [];

    // Build and sort graph
    const nodes = buildGraph(def.steps);
    const sorted = topologicalSort(nodes);

    const context: EvalContext = {
      input,
      stepOutputs,
      env: { ...process.env },
    };

    for (const node of sorted) {
      const startedAt = new Date().toISOString();

      // Check if dependencies failed → skip
      const depResults = node.dependencies.map(d => stepOutputs.get(d));
      if (depResults.some(result => result === undefined)) {
        results.push({
          id: node.step.id,
          type: node.step.type,
          status: 'skipped',
          dependencies: node.dependencies,
          startedAt,
          finishedAt: new Date().toISOString(),
        });
        continue;
      }

      // Evaluate when condition
      if (node.step.when !== undefined) {
        const conditionMet = evaluate(node.step.when, context);
        if (!conditionMet) {
          results.push({
            id: node.step.id,
            type: node.step.type,
            status: 'skipped',
            dependencies: node.dependencies,
            startedAt,
            finishedAt: new Date().toISOString(),
          });
          continue;
        }
      }

      // Resolve input expressions
      const resolvedInput = resolveExpressions(node.step.input, context);

      if (config.dryRun) {
        const dryRunOutput = { dryRun: true, input: resolvedInput };
        stepOutputs.set(node.step.id, dryRunOutput);
        results.push({
          id: node.step.id,
          type: node.step.type,
          status: 'succeeded',
          output: dryRunOutput,
          dependencies: node.dependencies,
          startedAt,
          finishedAt: new Date().toISOString(),
        });
        continue;
      }

      // Execute step
      try {
        const output = await this.executeStep(node.step, resolvedInput, config);
        stepOutputs.set(node.step.id, output);
        results.push({
          id: node.step.id,
          type: node.step.type,
          status: 'succeeded',
          output,
          dependencies: node.dependencies,
          startedAt,
          finishedAt: new Date().toISOString(),
        });
      } catch (err) {
        results.push({
          id: node.step.id,
          type: node.step.type,
          status: 'failed',
          error: err instanceof Error ? err.message : String(err),
          dependencies: node.dependencies,
          startedAt,
          finishedAt: new Date().toISOString(),
        });
        // Stop execution on failure
        for (const remaining of sorted.slice(sorted.indexOf(node) + 1)) {
          results.push({
            id: remaining.step.id,
            type: remaining.step.type,
            status: 'skipped',
            dependencies: remaining.dependencies,
            startedAt: new Date().toISOString(),
            finishedAt: new Date().toISOString(),
          });
        }
        return { status: 'failed', steps: results };
      }
    }

    return { status: 'succeeded', steps: results };
  }

  private async executeStep(
    step: StepDef,
    input: any,
    config: Config
  ): Promise<any> {
    const maxAttempts = step.retry?.maxAttempts ?? 1;
    const executor = this.executors.get(step.type);

    if (!executor) {
      throw new Error(`Unknown step type: "${step.type}"`);
    }

    let lastError: any;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const timeoutSec = step.timeout;
      const result = timeoutSec
          ? await Promise.race([
              executor(step.type, input, config),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error(`Step "${step.id}" timed out after ${timeoutSec}s`)), timeoutSec * 1000)
              ),
            ])
          : await executor(step.type, input, config);
        return result;
      } catch (err) {
        lastError = err;
        if (attempt < maxAttempts) {
          const delay = calculateBackoff(step.retry?.backoff ?? 'none', attempt, 1000);
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }

    throw lastError;
  }
}

function calculateBackoff(strategy: string, attempt: number, baseDelay: number): number {
  switch (strategy) {
    case 'linear': return baseDelay * attempt;
    case 'exponential': return baseDelay * Math.pow(2, attempt - 1);
    default: return 0;
  }
}

/** Validate pipeline definition structure */
function validate(def: any): void {
  const errors: string[] = [];

  if (!def || typeof def !== 'object') {
    errors.push('pipeline definition must be an object');
    throw new NeteaseError('USAGE', 'Pipeline validation failed', errors.join('\n'));
  }

  if (def.version !== 'workflow/v1') {
    errors.push(`version must be "workflow/v1", got "${def.version}"`);
  }

  if (!Array.isArray(def.steps) || def.steps.length === 0) {
    errors.push('steps must be a non-empty array');
  } else {
    const ids = new Set<string>();
    for (const [i, step] of def.steps.entries()) {
      if (!step.id) errors.push(`step[${i}] missing required "id"`);
      if (!step.type) errors.push(`step[${i}] missing required "type"`);
      if (step.id && ids.has(step.id)) errors.push(`duplicate step id: "${step.id}"`);
      if (step.id) ids.add(step.id);
    }
  }

  if (errors.length > 0) {
    throw new NeteaseError('USAGE', 'Pipeline validation failed', errors.join('\n'));
  }
}
