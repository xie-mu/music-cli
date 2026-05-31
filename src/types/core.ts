/** Base configuration interface - three-layer merge (config.json ← env ← flags) */
export interface Config {
  output: OutputFormat;
  timeout: number;
  quiet: boolean;
  verbose: boolean;
  dryRun: boolean;
  nonInteractive: boolean;
  noColor: boolean;
  cookieFile: string;
  cookie?: string;
  countryCode: string;
  player?: string;
  downloadDir: string;
  stateDir: string;
  [key: string]: any;
}

/** CLI option definition */
export interface OptionDef {
  flag: string;
  description: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array';
  default?: any;
}

/** Command interface - each CLI command is an Agent Tool */
export interface Command {
  name: string;
  description: string;
  usage: string;
  options: OptionDef[];
  examples: string[];
  permission?: 'public' | 'auth' | 'write' | 'sensitive';
  capability?: string;
  returns?: string;
  run(config: Config, flags: Record<string, any>): Promise<void>;
}

/** NetEase Cloud Music API response wrapper */
export interface NeteaseResponse<T = any> {
  code: number;
  message?: string;
  [key: string]: any;
}

/** Generic pagination options */
export interface PageOptions {
  page?: number;
  pageSize?: number;
}

/** Output format type */
export type OutputFormat = 'text' | 'json' | 'markdown';

/** Tool Schema for Function Calling (OpenAI/Anthropic format) */
export interface ToolSchema {
  name: string;
  description: string;
  permission?: Command['permission'];
  capability?: string;
  returns?: string;
  input_schema: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
}
