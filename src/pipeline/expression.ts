/**
 * Expression system for Pipeline workflow definitions.
 * Supports: $input, $from, $env, $secret, $concat, $coalesce, $js
 * Replicates Bailian bl CLI expression system.
 */

export interface EvalContext {
  input: Record<string, any>;
  stepOutputs: Map<string, any>;
  env: Record<string, string | undefined>;
}

export function evaluate(
  expr: any,
  context: EvalContext
): any {
  // Handle template strings first
  if (typeof expr === 'string' && expr.includes('${')) {
    return resolveTemplateString(expr, context);
  }

  // Handle arrays
  if (Array.isArray(expr)) {
    return expr.map(e => evaluate(e, context));
  }

  // Handle primitives
  if (expr === null || expr === undefined || typeof expr !== 'object') {
    return expr;
  }

  // $input.path - reference pipeline input
  if ('$input' in expr) {
    return resolvePath(context.input, expr.$input);
  }

  // $from.step_id[.path] - reference step output
  if ('$from' in expr) {
    const stepId = expr.$from;
    const output = context.stepOutputs.get(stepId);
    if (output === undefined) {
      throw new Error(`Step "${stepId}" output not found`);
    }
    return expr.path ? resolvePath(output, expr.path) : output;
  }

  // $env.NAME - reference environment variable
  if ('$env' in expr) {
    return process.env[expr.$env] ?? null;
  }

  // $secret.NAME - reference secret (masked in output)
  if ('$secret' in expr) {
    return process.env[expr.$secret] ?? null;
  }

  // $concat - string concatenation
  if ('$concat' in expr) {
    return expr.$concat.map((e: any) => String(evaluate(e, context))).join('');
  }

  // $coalesce - first non-null value
  if ('$coalesce' in expr) {
    for (const e of expr.$coalesce) {
      const v = evaluate(e, context);
      if (v !== null && v !== undefined) return v;
    }
    return null;
  }

  // $js - inline JavaScript execution
  if ('$js' in expr) {
    const args: Record<string, any> = {};
    if (expr.args) {
      for (const [k, v] of Object.entries(expr.args)) {
        args[k] = evaluate(v, context);
      }
    }
    try {
      const fn = new Function('args', `return (${expr.$js})`);
      return fn(args);
    } catch (err) {
      throw new Error(`$js execution failed: ${err}`);
    }
  }

  // Plain object - recursively evaluate all values
  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(expr)) {
    result[key] = evaluate(val, context);
  }
  return result;
}

/** Resolve a dot-path from an object (e.g., "tracks[0].id") */
function resolvePath(obj: any, path: string): any {
  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;

    // Array index access: tracks[0]
    const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
    if (arrayMatch) {
      current = current[arrayMatch[1]];
      if (Array.isArray(current)) {
        current = current[Number(arrayMatch[2])];
      } else {
        return undefined;
      }
    } else {
      current = current[part];
    }
  }

  return current;
}

/**
 * Resolve template string with ${...} interpolation.
 * e.g., "${input.playlistId}" → "3778678"
 *       "${from.fetchTracks}" → step output
 */
function resolveTemplateString(template: string, context: EvalContext): string {
  return template.replace(/\$\{([^}]+)\}/g, (match, path) => {
    const trimmed = path.trim();
    // Convert template path to expression and evaluate
    if (trimmed.startsWith('input.')) {
      const val = resolvePath(context.input, trimmed.slice(6));
      return val !== undefined && val !== null ? String(val) : match;
    }
    if (trimmed.startsWith('from.')) {
      const dotIdx = trimmed.indexOf('.', 5);
      if (dotIdx === -1) {
        const stepId = trimmed.slice(5);
        const output = context.stepOutputs.get(stepId);
        return output !== undefined ? JSON.stringify(output) : match;
      }
      const stepId = trimmed.slice(5, dotIdx);
      const path = trimmed.slice(dotIdx + 1);
      const output = context.stepOutputs.get(stepId);
      if (output === undefined) return match;
      const val = resolvePath(output, path);
      return val !== undefined && val !== null ? String(val) : match;
    }
    return match;
  });
}

/** Recursively resolve all expressions in an input object */
export function resolveExpressions(
  input: Record<string, any>,
  context: EvalContext
): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(input)) {
    result[key] = evaluate(val, context);
  }
  return result;
}


