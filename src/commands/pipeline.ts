import { existsSync, readFileSync } from 'node:fs';
import { NeteaseError } from '../error.js';
import { formatOutput } from '../formatter.js';
import { PipelineDef } from '../pipeline/schema.js';
import { PipelineEngine } from '../pipeline/executor.js';
import { Config, Command } from '../types/core.js';
import { registerNeteasePipelineBuiltins } from '../pipeline/builtins.js';

export const pipelineValidateCommand: Command = {
  name: 'pipeline validate',
  description: '验证 Pipeline 定义文件',
  usage: 'nm pipeline validate <file.yaml>',
  options: [
    { flag: '--file <path>', description: 'Pipeline 定义文件路径' },
  ],
  examples: ['nm pipeline validate workflow.yaml'],
  async run(config, flags) {
    const filePath = flags.file || flags._positional?.[0];
    if (!filePath) throw new NeteaseError('USAGE', '请指定 Pipeline 文件路径', 'nm pipeline validate <file.yaml>');

    if (!existsSync(filePath)) {
      throw new NeteaseError('USAGE', `文件不存在: ${filePath}`);
    }

    const engine = new PipelineEngine();
    const def = engine.load(filePath);
    process.stdout.write(`✅ Pipeline 验证通过\n`);
    process.stdout.write(`   版本: ${def.version}\n`);
    process.stdout.write(`   步骤数: ${def.steps.length}\n`);
    if (def.inputs) {
      process.stdout.write(`   输入参数: ${Object.keys(def.inputs).join(', ')}\n`);
    }
  },
};

export const pipelineRunCommand: Command = {
  name: 'pipeline run',
  description: '执行 Pipeline 工作流',
  usage: 'nm pipeline run <file.yaml> [--input \'{"key":"value"}\']',
  options: [
    { flag: '--file <path>', description: 'Pipeline 定义文件路径' },
    { flag: '--input <json>', description: '输入参数 JSON' },
  ],
  examples: [
    'nm pipeline run workflow.yaml',
    'nm pipeline run workflow.yaml --dry-run',
    'nm pipeline run workflow.yaml --input \'{"playlistId": "3778678"}\'',
  ],
  async run(config, flags) {
    const filePath = flags.file || flags._positional?.[0];
    if (!filePath) throw new NeteaseError('USAGE', '请指定 Pipeline 文件路径', 'nm pipeline run <file.yaml>');

    const engine = new PipelineEngine();
    registerNeteasePipelineBuiltins(engine);

    // Register built-in step executors
    engine.register('script/js', async (type, input) => {
      const code = input.code;
      const args = input.args || {};
      if (!code) throw new Error('script/js step requires "code" input');
      const fn = new Function('args', code);
      return fn(args);
    });

    engine.register('logic/switch', async (type, input) => {
      const cases = input.cases || [];
      for (const c of cases) {
        if (c.condition) {
          const evalFn = new Function('context', `const ctx = ${JSON.stringify(c)}; return true;`);
          // In a real implementation, evaluate condition against context
          // For now, check if we should use the first case
          if (evalFn({})) return { selected: c.key, value: c.value, matched: true };
        }
      }
      return { selected: 'default', value: input.defaultValue, matched: false };
    });

    engine.register('logic/select', async (type, input) => {
      const candidates = input.candidates || [];
      for (const c of candidates) {
        if (c.value !== undefined && c.value !== null) {
          return { source: c.source, value: c.value, matched: true };
        }
      }
      return { source: 'default', value: input.defaultValue, matched: false };
    });

    // Load and run
    const def = engine.load(filePath);
    const pipelineInput = flags.input ? JSON.parse(flags.input) : {};

    const result = await engine.run(def, pipelineInput, config);
    process.stdout.write(formatOutput(result, flags.output || config.output) + '\n');
  },
};
