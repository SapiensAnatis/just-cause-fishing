'use strict';

global.fishing = {
    // *crickets chirping*
}

process.on('uncaughtException', e => console.error(e.stack || e));

