module.exports = {
  default: {
    requireModule: ['ts-node/register', 'tsconfig-paths/register'],
    require: ['features/**/*.steps.ts', 'features/support/**/*.ts'],
    format: ['progress-bar', 'html:reports/cucumber-report.html'],
    paths: ['features/**/*.feature'],
    publishQuiet: true,
  },
};
