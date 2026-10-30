const util = require('util');
const conf = require('./config');

// mozlog's intel dependency uses util.isError, removed in Node 23
if (!util.isError) util.isError = e => e instanceof Error;

const isProduction = conf.env === 'production';

const mozlog = require('mozlog')({
  app: 'FirefoxSend',
  level: isProduction ? 'INFO' : 'verbose',
  fmt: isProduction ? 'heka' : 'pretty',
  debug: !isProduction
});

module.exports = mozlog;
