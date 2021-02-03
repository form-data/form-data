// Definitions by: Carlos Ballesteros Velasco <https://github.com/soywiz>
//                 Leon Yu <https://github.com/leonyu>
//                 BendingBender <https://github.com/BendingBender>
//                 Maple Miao <https://github.com/mapleeit>

/// <reference types="node" />
import * as stream from 'stream';
import * as http from 'http';

export = FormData;

interface Options extends stream.ReadableOptions {
  writable?: boolean;
  readable?: boolean;
  dataSize?: number;
  maxDataSize?: number;
  pauseStreams?: boolean;
}

declare class FormData extends stream.Readable {
  constructor(options?: Options);
  append(key: string, value: unknown, options?: FormData.AppendOptions | string): void;
  getHeaders(userHeaders?: FormData.Headers): FormData.Headers;
  submit(
    params: string | FormData.SubmitOptions,
    callback?: (error: Error | null, response: http.IncomingMessage) => void
  ): http.ClientRequest;
  getBuffer(): Buffer;
  setBoundary(boundary: string): void;
  getBoundary(): string;
  getLength(callback: (err: Error | null, length: number) => void): void;
  getLengthSync(): number;
  hasKnownLength(): boolean;
}

declare namespace FormData {
  type Headers = Record<string, number | string | string[]>;

  interface AppendOptions {
    header?: string | Headers;
    knownLength?: number;
    filename?: string;
    filepath?: string;
    contentType?: string;
  }

  interface SubmitOptions extends http.RequestOptions {
    protocol?: 'https:' | 'http:';
  }
}
