/**
 * Form-data 类型声明
 */

declare module 'form-data' {
  import { Readable } from 'stream';

  interface AppendOptions {
    filename?: string;
    contentType?: string;
    knownLength?: number;
  }

  class FormData {
    append(key: string, value: unknown, options?: AppendOptions | string): void;
    getHeaders(): Record<string, string>;
    getBuffer(): Buffer;
    getBoundary(): string;
    getLength(callback: (err: Error | null, length: number) => void): void;
    getLengthSync(): number;
    hasKnownLength(): boolean;
    pipe<T extends NodeJS.WritableStream>(destination: T): T;
  }

  export = FormData;
}

