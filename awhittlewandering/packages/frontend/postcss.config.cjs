/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */
module.exports = {
  // Use an array instead of an object so PostCSS loaders that expect
  // `plugins.slice()` receive an actual array and don't throw
  // “plugins.slice is not a function”.
  plugins: [require("tailwindcss"), require("autoprefixer")],
};
