/* eslint-env browser */
/* istanbul ignore next */
module.exports = typeof self == 'object' ? self.FormData : window.FormData;
