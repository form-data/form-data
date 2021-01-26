/* eslint-env browser */
module.exports = typeof self == 'object' ? self.FormData : typeof window !== 'undefined' ? window.FormData : undefined;
