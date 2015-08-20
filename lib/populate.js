// populates missing values
module.exports = populate;

function populate(dst, src) {
  for (var prop in src) {
    if (src.hasOwnProperty(prop) && !dst[prop]) {
      dst[prop] = src[prop];
    }
  }
  return dst;
}
