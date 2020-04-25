import CombinedStream from 'combined-stream';

import { once } from 'events';
import { request as httpRequest } from 'http';
import { request as httpsRequest } from 'https';

import { LINE_BREAK, DEFAULT_CONTENT_TYPE } from './constants';
import { generateBoundary, getMultiPartHeader, lengthRetriever } from './helpers';

import { Options, AppendOptions, SubmitOptions } from './types';
import { ClientRequest, IncomingMessage } from 'http';

const kBoundary = Symbol('boundary');
const lineBreakBuffer = Buffer.from(LINE_BREAK);

export class FormData extends CombinedStream {
  protected valueLength = 0;

  protected overheadLength = 0;

  protected valuesToMeasure: any[] = [];

  protected error?: Error;

  protected [kBoundary]: string;

  public constructor(options?: Options) {
    super();

    if (!(this instanceof FormData)) {
      throw new TypeError('Failed to construct \'FormData\': Please use the \'new\' operator.');
    }

    Object.assign(this, options);
  }

  /**
   * Returns custom tag
   */
  public get [Symbol.toStringTag](): string {
    return this.constructor.name;
  }

  // Public API to check if length of added values is known
  // https://github.com/form-data/form-data/issues/196
  // https://github.com/form-data/form-data/issues/262
  public hasKnownLength(): boolean {
    return this.valuesToMeasure.length === 0;
  }

  public get boundary(): string {
    if (!this[kBoundary]) {
      this[kBoundary] = generateBoundary();
    }

    return this[kBoundary];
  }

  protected get lastBoundary(): string {
    return `--${this.boundary}--${LINE_BREAK}`;
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  public append(field: string, rawValue: any, rawOptions: AppendOptions | string = {}): void {
    // https://github.com/felixge/node-form-data/issues/38
    if (Array.isArray(rawValue)) {
      // Please convert your array into string
      // the way web server expects it
      this.throwError(new Error('Arrays are not supported.'));

      return;
    }

    const value = typeof rawValue === 'number'
      ? String(rawValue)
      : rawValue;

    const options: AppendOptions = typeof rawOptions === 'string'
      ? {
        filename: rawOptions
      }
      : rawOptions;

    const header = getMultiPartHeader(
      this.boundary,
      field,
      value,
      options
    );

    super.append(header);
    super.append(value);

    super.append((next: Function): void => {
      let footer = LINE_BREAK;

      const lastPart = this._streams.length === 0;
      if (lastPart) {
        footer += this.lastBoundary;
      }

      next(footer);
    });

    // pass along options.knownLength
    this.trackLength(header, value, options);
  }

  protected trackLength(header: string, value: any, options: AppendOptions): void {
    let valueLength = 0;

    // used w/ getLengthSync(), when length is known.
    // e.g. for streaming directly from a remote server,
    // w/ a known file a size, and not wanting to wait for
    // incoming file to finish to get its size.
    if (options.knownLength !== undefined) {
      valueLength += Number(options.knownLength);
    } else if (Buffer.isBuffer(value)) {
      valueLength = value.length;
    } else if (typeof value === 'string') {
      valueLength = Buffer.byteLength(value);
    }

    this.valueLength += valueLength;

    // @check why add CRLF? does this account for custom/multiple CRLFs?
    this.overheadLength += Buffer.byteLength(header) + LINE_BREAK.length;

    // empty or either doesn't have path or not an http response
    if (!value || (!value.path && !(value.readable && value.hasOwnProperty('httpVersion')))) {
      return;
    }

    // no need to bother with the length
    if (!options.knownLength) {
      this.valuesToMeasure.push(value);
    }
  }

  public getHeaders(userHeaders: Record<string, string> = {}): Record<string, string> {
    const formHeaders: Record<string, string> = {
      'content-type': `multipart/form-data; boundary=${this.boundary}`
    };

    for (const [name, header] of Object.entries(userHeaders)) {
      formHeaders[name.toLowerCase()] = header;
    }

    return formHeaders;
  }

  public getBuffer(): Buffer {
    const { boundary } = this;

    const chunks: Buffer[] = [];
    let size = 0;

    // Create the form content. Add Line breaks to the end of data.
    for (const data of this._streams) {
      if (typeof data === 'function') {
        continue;
      }

      // Add content to the buffer.
      const chunk = !Buffer.isBuffer(data)
        ? Buffer.from(data)
        : data;

      chunks.push(chunk);
      size += chunk.length;

      // Add break after content.
      if (typeof data !== 'string' || data.substring(2, boundary.length + 2) !== boundary) {
        chunks.push(lineBreakBuffer);
        size += lineBreakBuffer.length;
      }
    }

    const lastBoundary = Buffer.from(this.lastBoundary);
    size += lastBoundary.length;

    // Add the footer and return the Buffer object.
    return Buffer.concat([...chunks, lastBoundary], size);
  }

  public getLengthSync(): number {
    let knownLength = this.overheadLength + this.valueLength;

    // Don't get confused, there are 3 "internal" streams for each keyval pair
    // so it basically checks if there is any value added to the form
    if (this._streams.length !== 0) {
      knownLength += this.lastBoundary.length;
    }

    // https://github.com/form-data/form-data/issues/40
    if (!this.hasKnownLength()) {
      // Some async length retrievers are present
      // therefore synchronous length calculation is false.
      // Please use getLength(callback) to get proper length
      this.throwError(new Error('Cannot calculate proper length in synchronous way.'));
    }

    return knownLength;
  }

  public getLength(callback: (err: Error | null, knownLength: number) => void): void {
    let knownLength = this.overheadLength + this.valueLength;

    if (this._streams.length !== 0) {
      knownLength += this.lastBoundary.length;
    }

    if (this.valuesToMeasure.length === 0) {
      return process.nextTick(callback, null, knownLength);
    }

    Promise.all(this.valuesToMeasure.map(lengthRetriever))
      .then((values) => {
        callback(null, knownLength + values.reduce((prev, curr) => prev + curr, 0));
      })
      .catch((error) => {
        callback(error, null as any);
      });
  }

  public submit(rawParams: string | SubmitOptions, callback?: (error: Error | null, response: IncomingMessage) => void): ClientRequest {
    const options: SubmitOptions = {
      method: 'POST'
    };

    // parse provided url if it's string
    // or treat it as options object
    if (typeof rawParams === 'string') {
      const url = new URL(rawParams);

      Object.assign(options, {
        port: url.port,
        path: url.pathname,
        host: url.hostname,
        protocol: url.protocol
      });
    // use custom params
    } else {
      Object.assign(options, rawParams);

      if (!options.port) {
        // if no port provided use default one
        options.port = options.protocol === 'https:'
          ? 443
          : 80;
      }
    }

    // put that good code in getHeaders to some use
    options.headers = this.getHeaders(options.headers as Record<string, string>);

    // https if specified, fallback to http in any other case
    const request = options.protocol === 'https:'
      ? httpsRequest(options)
      : httpRequest(options);

    this.getLength((error, length) => {
      if (error) {
        this.throwError(error);

        return;
      }

      request.setHeader('Content-Length', length);

      this.pipe(request);

      if (callback) {
        once(request, 'response')
          .then(([response]) => {
            callback(null, response);
          })
          .catch((requestError: Error) => {
            callback(requestError, null as any);
          });
      }
    });

    return request;
  }

  protected throwError(error: Error): void {
    if (!this.error) {
      this.error = error;

      this.pause();
      this.emit('error', error);
    }
  }

  /**
   * Deprecated API
   */

  private get _overheadLength(): number {
    return this.overheadLength;
  }

  private get _valueLength(): number {
    return this.valueLength;
  }

  private get _valuesToMeasure(): any[] {
    return this.valuesToMeasure;
  }

  private set _valuesToMeasure(value: any[]) {
    this.valuesToMeasure = value;
  }

  private _lastBoundary(): string {
    return this.lastBoundary;
  }

  private getBoundary(): string {
    return this.boundary;
  }

  private static LINE_BREAK = LINE_BREAK;

  private static DEFAULT_CONTENT_TYPE = DEFAULT_CONTENT_TYPE;
}
