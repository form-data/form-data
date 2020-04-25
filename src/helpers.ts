import { lookup as mimeLookup } from 'mime-types';

import { once } from 'events';
import { promises as fs } from 'fs';
import { normalize as pathNormalize, basename as pathBasename } from 'path';

import { AppendOptions } from './types';
import { DEFAULT_CONTENT_TYPE, LINE_BREAK } from './constants';

export const generateBoundary = (): string => {
  let boundary = '--------------------------';

  for (let i = 0; i < 24; i += 1) {
    boundary += Math.floor(Math.random() * 10).toString(16);
  }

  return boundary;
};

export const getFilename = (value: any, options: AppendOptions): string | undefined => {
  if (typeof options.filepath === 'string') {
    return pathNormalize(options.filepath).replace(/\\/g, '/');
  }

  if (options.filename || value.name || value.path) {
    return pathBasename(options.filename || value.name || value.path);
  }

  if (value.readable && Reflect.has(value, 'httpVersion')) {
    return pathBasename(value.client._httpMessage.path || '');
  }

  return undefined;
};

export const getContentDisposition = (value: any, options: AppendOptions): string | undefined => {
  const filename = getFilename(value, options);

  if (filename) {
    return `filename="${filename}"`;
  }

  return undefined;
};

export const getContentType = (value: any, options: AppendOptions): string | undefined => (
  // use custom content-type above all
  options.contentType

  // or try `name` from formidable, browser
  || (value.name && mimeLookup(value.name))

  // or try `path` from fs-, request- streams
  || (value.path && mimeLookup(value.path))

  // or if it's http-reponse
  || (value.readable && Reflect.has(value, 'httpVersion') && value.headers['content-type'])

  // or guess it from the filepath or filename
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  || (options.filepath || options.filename) && mimeLookup(options.filepath! || options.filename!)

  // fallback to the default content type if `value` is not simple value
  || (typeof value == 'object' && DEFAULT_CONTENT_TYPE)

  // common fallback
  || undefined
);

export const getMultiPartHeader = (boundary: string, field: string, value: any, options: AppendOptions): string => {
  // custom header specified (as string)?
  // it becomes responsible for boundary
  // (e.g. to handle extra CRLFs on .NET servers)
  if (typeof options.header === 'string') {
    return options.header;
  }

  const contentDisposition = getContentDisposition(value, options);
  const contentType = getContentType(value, options);

  const headers: Record<string, string | string[]> = {
    // add custom disposition as third element or keep it two elements if not
    'Content-Disposition': ['form-data', `name="${field}"`].concat(contentDisposition || []),
    // if no content type. allow it to be empty array
    'Content-Type': contentType
      ? [contentType]
      : []
  };

  // allow custom headers.
  for (const [name, header] of Object.entries(options.header || {})) {
    if (!headers[name]) {
      headers[name] = header;
    }
  }

  let contents = '';
  for (const [prop, rawHeader] of Object.entries(headers)) {
    // skip nullish headers.
    if (rawHeader === null || rawHeader === undefined) {
      continue;
    }

    const header = !Array.isArray(rawHeader)
      ? [rawHeader]
      : rawHeader;

    if (header.length !== 0) {
      contents += `${prop}: ${header.join('; ')}${LINE_BREAK}`;
    }
  }

  return `--${boundary}${LINE_BREAK}${contents}${LINE_BREAK}`;
};

export const lengthRetriever = async (value: any): Promise<number> => {
  if (Reflect.has(value, 'fd')) {
    // take read range into a account
    // `end` = Infinity –> read file till the end
    //
    // TODO: Looks like there is bug in Node fs.createReadStream
    // it doesn't respect `end` options without `start` options
    // Fix it when node fixes it.
    // https://github.com/joyent/node/issues/7819
    if (value.end !== undefined && value.end !== Infinity && value.start !== undefined) {
      // when end specified
      // no need to calculate range
      // inclusive, starts with 0
      return value.end + 1 - (value.start ? value.start : 0);
    // not that fast snoopy
    } else {
      // still need to fetch file size from fs
      const stat = await fs.stat(value.path);

      // update final size based on the range options
      return stat.size - (value.start ? value.start : 0);
    }
  // or http response
  } else if (Reflect.has(value, 'httpVersion')) {
    return Number(value.headers['content-length']);
  // or request stream http://github.com/mikeal/request
  } else if (Reflect.has(value, 'httpModule')) {
    const promise = once(value, 'response');

    value.resume();

    const [response] = await promise;

    value.pause();

    return Number(response.headers['content-length']);
  }

  throw new Error('Unknown stream');
};
