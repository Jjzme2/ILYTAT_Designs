/**
 * Babel configuration for Jest testing
 * 
 * This configuration allows Jest to process ES Modules and modern JavaScript features
 */
module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: {
        node: 'current'
      }
    }]
  ],
  plugins: []
};
