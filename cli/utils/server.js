/*jslint node: true */
'use strict';

const path = require('path');
const portfinder = require('portfinder');
const express = require('express');
const https = require('https');
const cors = require('cors');
const logger = require('@blackbaud/skyux-logger');
const certResolver = require('./cert-resolver');

const app = express();

let server;

/**
 * Starts the httpServer
 * @name start
 */
function start(argv, root, distPath) {
  return new Promise((resolve, reject) => {

    const dist = path.resolve(process.cwd(), distPath || 'dist');

    logger.info('Creating web server');
    app.use(cors());

    logger.info(`Exposing static directory: ${dist}`);
    app.use(express.static(dist));
    if (root) {
      logger.info(`Mapping server requests from ${root} to ${dist}`);
      app.use(root, express.static(dist));
    }

    const options = {
      cert: certResolver.readCert(argv),
      key: certResolver.readKey(argv)
    };

    server = https.createServer(options, app);
    server.on('error', reject);

    logger.info('Requesting open port...');
    portfinder
      .getPortPromise()
      .then(port => {
        logger.info(`Open port found: ${port}`);
        logger.info('Starting web server...');
        server.listen(port, 'localhost', () => {
          logger.info('Web server running.');
          resolve(port);
        });
      })
      .catch(reject);
  });
}

/**
 * Kills the server if it exists
 * @name kill
 */
function stop() {
  if (server) {
    logger.info('Stopping http server');
    server.close();
    server = null;
  }
}

module.exports = {
  start: start,
  stop: stop
};
