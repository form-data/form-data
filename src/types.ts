import { RequestOptions } from 'http';
import { ReadableOptions } from 'stream';

export interface Headers {
  [key: string]: any;
}

export interface Options extends ReadableOptions {
  writable?: boolean;
  readable?: boolean;
  dataSize?: number;
  maxDataSize?: number;
  pauseStreams?: boolean;
}

export interface AppendOptions {
  header?: string | Headers;
  knownLength?: number;
  filename?: string;
  filepath?: string;
  contentType?: string;
}

export interface SubmitOptions extends RequestOptions {
  protocol?: 'https:' | 'http:';
}
