/* eslint-env browser */
module.exports = {
  FormData: typeof self == 'object'
    ? self.FormData
    : window.FormData
};
