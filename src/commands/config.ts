import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { NeteaseConfig, saveConfigFile, getDefaultConfig, readConfigFile, getDefaultCookieFile } from '../config.js';
import { Command, ToolSchema } from '../types/core.js';
import { getCommandRouter } from '../router.js';

/** Build Tool Schema from a Command definition (OpenAI/Anthropic Function Calling format) */
function buildToolSchema(command: Command): ToolSchema {
  const properties: Record<string, any> = {};
  const required: string[] = [];

  for (const opt of command.options) {
    const propKey = opt.flag.split(' ')[0].replace(/^--/, '').replace(/-./g, c => c[1].toUpperCase());
    let type = 'string';
    if (opt.type === 'number') type = 'number';
    else if (opt.type === 'boolean') type = 'boolean';
    else if (opt.type === 'array') type = 'array';
    properties[propKey] = { type, description: opt.description };
    if (opt.required) required.push(propKey);
  }

  return {
    name: `netease_${command.name.replace(/\s+/g, '_')}`,
    description: command.description,
    permission: command.permission,
    capability: command.capability,
    returns: command.returns,
    input_schema: { type: 'object', properties, required },
  };
}

export const configShowCommand: Command = {
  name: 'config show',
  description: '显示当前配置',
  usage: 'nm config show',
  options: [],
  examples: ['nm config show', 'nm config show --output json'],
  async run(config, flags) {
    const display: Record<string, any> = {
      output: config.output,
      timeout: config.timeout,
      quiet: config.quiet,
      cookieFile: config.cookieFile,
      countryCode: config.countryCode,
      player: config.player || '(auto)',
      downloadDir: config.downloadDir,
      stateDir: config.stateDir,
    };
    // Mask sensitive data
    if (config.cookie) display.cookie = config.cookie.slice(0, 20) + '...';
    process.stdout.write(JSON.stringify(display, null, 2) + '\n');
  },
};

export const configSetCommand: Command = {
  name: 'config set',
  description: '设置配置项',
  usage: 'nm config set --key <key> --value <value>',
  options: [
    { flag: '--key <key>', description: '配置键 (output/timeout/cookieFile/countryCode/player/downloadDir/stateDir)', required: true },
    { flag: '--value <value>', description: '配置值', required: true },
  ],
  examples: ['nm config set --key output --value json', 'nm config set --key timeout --value 60'],
  async run(config, flags) {
    const key = flags.key;
    const value = flags.value;
    if (!key || value === undefined) {
      process.stderr.write('请提供 --key 和 --value\n');
      return;
    }
    const fileConfig = readConfigFile();
    (fileConfig as any)[key] = value;
    saveConfigFile(fileConfig);
    process.stdout.write(`已设置 ${key} = ${value}\n`);
  },
};

export const configExportSchemaCommand: Command = {
  name: 'config export-schema',
  description: '导出全部命令的 Function Calling Schema（Agent 工具协议）',
  usage: 'nm config export-schema [--command <name>]',
  options: [
    { flag: '--command <name>', description: '仅导出指定命令的 Schema（如 "music info"）' },
  ],
  examples: ['nm config export-schema', 'nm config export-schema --command "music info"'],
  async run(config, flags) {
    const router = getCommandRouter();
    const allCommands = router.getAllCommands();

    if (flags.command) {
      const cmd = router.getCommand(flags.command as string);
      if (!cmd) {
        process.stderr.write(`未找到命令: ${flags.command}\n`);
        return;
      }
      process.stdout.write(JSON.stringify(buildToolSchema(cmd), null, 2) + '\n');
      return;
    }

    const schemas = allCommands
      .filter(cmd => cmd.name !== 'config export-schema')
      .map(cmd => buildToolSchema(cmd));

    process.stdout.write(JSON.stringify(schemas, null, 2) + '\n');
  },
};
