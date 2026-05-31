/**
 * DAG dependency graph and topological sort for Pipeline steps.
 * Uses Kahn's algorithm.
 * Replicates Bailian bl CLI pipeline graph engine.
 */

import { StepDef } from './schema.js';

interface StepNode {
  step: StepDef;
  dependencies: string[];
  dependents: string[];
  index: number;
  total: number;
}

/**
 * Build the dependency graph from step definitions.
 * Extracts both explicit (dependsOn) and implicit ($from references in input) dependencies.
 */
export function buildGraph(steps: StepDef[]): StepNode[] {
  const nodes: StepNode[] = steps.map((step, index) => ({
    step,
    dependencies: [],
    dependents: [],
    index,
    total: steps.length,
  }));

  const nodeMap = new Map(nodes.map(n => [n.step.id, n]));

  for (const node of nodes) {
    const deps = new Set<string>();

    // Explicit dependsOn
    for (const dep of node.step.dependsOn ?? []) {
      deps.add(dep);
    }

    // Implicit: extract $from references from input
    extractFromRefs(node.step.input, deps);

    // Implicit: from when condition
    if (node.step.when) {
      extractFromRefs(node.step.when, deps);
    }

    node.dependencies = Array.from(deps);

    // Validate dependencies exist
    for (const dep of node.dependencies) {
      if (!nodeMap.has(dep)) {
        throw new Error(`Step "${node.step.id}" references missing step "${dep}"`);
      }
      if (dep === node.step.id) {
        throw new Error(`Step "${node.step.id}" references itself`);
      }
      nodeMap.get(dep)!.dependents.push(node.step.id);
    }
  }

  return nodes;
}

/**
 * Topological sort using Kahn's algorithm.
 * Returns steps in execution order.
 * Throws if cycle detected.
 */
export function topologicalSort(nodes: StepNode[]): StepNode[] {
  const inDegree = new Map<string, number>();
  const adjList = new Map<string, string[]>();

  for (const node of nodes) {
    inDegree.set(node.step.id, 0);
    adjList.set(node.step.id, []);
  }

  for (const node of nodes) {
    for (const dep of node.dependencies) {
      adjList.get(dep)?.push(node.step.id);
      inDegree.set(node.step.id, (inDegree.get(node.step.id) || 0) + 1);
    }
  }

  const queue = nodes.filter(n => (inDegree.get(n.step.id) || 0) === 0);
  const sorted: StepNode[] = [];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const node = queue.shift()!;
    sorted.push(node);
    visited.add(node.step.id);

    for (const dependent of adjList.get(node.step.id) || []) {
      const newDegree = (inDegree.get(dependent) || 0) - 1;
      inDegree.set(dependent, newDegree);
      if (newDegree === 0) {
        const depNode = nodes.find(n => n.step.id === dependent);
        if (depNode) queue.push(depNode);
      }
    }
  }

  if (visited.size !== nodes.length) {
    const unvisited = nodes.filter(n => !visited.has(n.step.id)).map(n => n.step.id);
    throw new Error(`Pipeline contains cycle involving steps: ${unvisited.join(', ')}`);
  }

  return sorted;
}

/** Recursively extract $from references from an object/expression */
function extractFromRefs(obj: any, output: Set<string>): void {
  if (Array.isArray(obj)) {
    for (const item of obj) extractFromRefs(item, output);
    return;
  }

  if (obj && typeof obj === 'object') {
    // Direct $from reference
    if ('$from' in obj && typeof obj.$from === 'string') {
      output.add(obj.$from);
    }
    // Recurse into all properties
    for (const val of Object.values(obj)) {
      extractFromRefs(val, output);
    }
  }
}
