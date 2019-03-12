/**
 *
 * snips adapter
 *
 */

'use strict';

const utils = require('@iobroker/adapter-core'); // Get common adapter utils
const adapterName = require('./package.json').name.split('.').pop();
let adapter;

let client = null;

function getAppName() {
    const parts = __dirname.replace(/\\/g, '/').split('/');
    return parts[parts.length - 1].split('.')[0];
}
utils.appName = getAppName();

function startAdapter(options) {
    options = options || {};
    Object.assign(options, { name: adapterName });

    adapter = new utils.Adapter(options);

    adapter.on('message', function (obj) {
        if (obj) processMessage(obj);
        processMessages();
    });

    adapter.on('ready', function () {
        adapter.config.maxTopicLength = 100;
        main();
    });

    adapter.on('unload', function (callback) {
        if (client) client.destroy();
        callback();
    });

    // is called if a subscribed state changes
    adapter.on('stateChange', (id, state) => {
        adapter.log.debug('stateChange ' + id + ': ' + JSON.stringify(state));
        switch (id) {
            case (adapter.namespace + '.send.say.text'):
                adapter.log.info('from Text2Command : ' + state.val);
                if (state.val.indexOf(adapter.config.filter) == -1) {
                    if (client) client.onStateChange('hermes/tts/say', state.val, 'say');
                }
                break;
            case (adapter.namespace + '.send.inject.room'):
                if (client) client.onStateChange('hermes/injection/perform', state.val, 'inject_room');
                break;
            case (adapter.namespace + '.send.inject.device'):
                if (client) client.onStateChange('hermes/injection/perform', state.val, 'inject_device');
                break;
            case (adapter.namespace + '.send.inject.color'):
                if (client) client.onStateChange('hermes/injection/perform', state.val, 'inject_color');
                break;
            case (adapter.namespace + '.send.inject.expletive'):
                if (client) client.onStateChange('hermes/injection/perform', state.val, 'inject_expletive');
                break;
            case (adapter.namespace + '.send.inject.broadcast'):
                if (client) client.onStateChange('hermes/injection/perform', state.val, 'inject_broadcast');
                break;
            case (adapter.namespace + '.send.inject.genre'):
                if (client) client.onStateChange('hermes/injection/perform', state.val, 'inject_genre');
                break;
            case (adapter.namespace + '.send.inject.interpret'):
                if (client) client.onStateChange('hermes/injection/perform', state.val, 'inject_interpret');
                break;
            case (adapter.namespace + '.send.feedback.sound'):
                if (client) client.onStateChange('hermes/feedback/sound', state.val, 'sound');
                break;
        }
    });
    return adapter;
}

function processMessage(obj) {
    if (!obj || !obj.command) return;
    switch (obj.command) {
        case 'test': {
            // Try to connect to mqtt broker
            if (obj.callback && obj.message) {
                const mqtt = require('mqtt');
                const _url = 'mqtt://' + (obj.message.user ? (obj.message.user + ':' + obj.message.pass + '@') : '') + obj.message.url + (obj.message.port ? (':' + obj.message.port) : '') + '?clientId=ioBroker.' + adapter.namespace;
                const _client = mqtt.connect(_url);
                // Set timeout for connection
                const timeout = setTimeout(() => {
                    _client.end();
                    adapter.sendTo(obj.from, obj.command, 'timeout', obj.callback);
                }, 2000);

                // If connected, return success
                _client.on('connect', () => {
                    _client.end();
                    clearTimeout(timeout);
                    adapter.sendTo(obj.from, obj.command, 'connected', obj.callback);
                });
            }
        }
    }
}

function processMessages() {
    adapter.getMessage((err, obj) => {
        if (obj) {
            processMessage(obj.command, obj.message);
            processMessages();
        }
    });
}

function main() {
    adapter.config.defaultQoS = 0;
    adapter.config.retain === true;
    adapter.config.retransmitInterval = 2000;
    adapter.config.retransmitCount = 10;

    if (adapter.config.retransmitInterval < adapter.config.sendInterval) {
        adapter.config.retransmitInterval = adapter.config.sendInterval * 5;
    }

    adapter.setObjectNotExists(adapter.namespace + '.receive.text', {
        type: 'state',
        common: {
            name: 'received text',
            desc: 'receive text from snips',
            type: 'string',
            role: 'text',
            read: true,
            write: true
        },
        native: {}
    });

    adapter.setObjectNotExists(adapter.namespace + '.receive.compiledText', {
        type: 'state',
        common: {
            name: 'compiled text',
            desc: "receive compiled text from snip's intents",
            type: 'string',
            role: 'text',
            read: true,
            write: true
        },
        native: {}
    });

    adapter.setObjectNotExists(adapter.namespace + '.receive.slotDevice', {
        type: 'state',
        common: {
            name: 'received compiled device',
            desc: "receive recognized device from snip's intents",
            type: 'string',
            role: 'text',
            read: true,
            write: true
        },
        native: {}
    });

    adapter.setObjectNotExists(adapter.namespace + '.receive.slotRoom', {
        type: 'state',
        common: {
            name: 'received compiled room',
            desc: "receive recognized room from snip's intents",
            type: 'string',
            role: 'text',
            read: true,
            write: true
        },
        native: {}
    });

    adapter.setObjectNotExists(adapter.namespace + '.receive.slotValuetype', {
        type: 'state',
        common: {
            name: 'received compiled valuetype',
            desc: "receive recognized valuetype from snip's intents",
            type: 'string',
            role: 'text',
            read: true,
            write: true
        },
        native: {}
    });

    adapter.setObjectNotExists(adapter.namespace + '.receive.slotColor', {
        type: 'state',
        common: {
            name: 'received compiled color',
            desc: "receive recognized color from snip's intents",
            type: 'string',
            role: 'text',
            read: true,
            write: true
        },
        native: {}
    });

    adapter.setObjectNotExists(adapter.namespace + '.receive.slotBroadcast', {
        type: 'state',
        common: {
            name: 'received compiled broadcaster',
            desc: "receive recognized broadcaster from snip's intents",
            type: 'string',
            role: 'text',
            read: true,
            write: true
        },
        native: {}
    });

    adapter.setObjectNotExists(adapter.namespace + '.receive.slotCommand', {
        type: 'state',
        common: {
            name: 'received compiled command',
            desc: "receive recognized command from snip's intents",
            type: 'string',
            role: 'text',
            read: true,
            write: true
        },
        native: {}
    });

    adapter.setObjectNotExists(adapter.namespace + '.receive.slotValue', {
        type: 'state',
        common: {
            name: 'received compiled value',
            desc: "receive recognized value from snip's intents",
            type: 'number',
            role: 'value',
            read: true,
            write: true
        },
        native: {}
    });

    adapter.setObjectNotExists(adapter.namespace + '.receive.slotStatus', {
        type: 'state',
        common: {
            name: 'received compiled status',
            desc: "receive recognized status from snip's intents",
            type: 'string',
            role: 'text',
            read: true,
            write: true
        },
        native: {}
    });

    adapter.setObjectNotExists(adapter.namespace + '.receive.slotDuration', {
        type: 'state',
        common: {
            name: 'received compiled duration',
            desc: "receive recognized duration from snip's intents",
            type: 'string',
            role: 'text',
            read: true,
            write: true
        },
        native: {}
    });

    adapter.setObjectNotExists(adapter.namespace + '.receive.slotGenre', {
        type: 'state',
        common: {
            name: 'received compiled genre',
            desc: "receive recognized genre from snip's intents",
            type: 'string',
            role: 'text',
            read: true,
            write: true
        },
        native: {}
    });

    adapter.setObjectNotExists(adapter.namespace + '.receive.slotInterpret', {
        type: 'state',
        common: {
            name: 'received compiled interpret',
            desc: "receive recognized interpret from snip's intents",
            type: 'string',
            role: 'text',
            read: true,
            write: true
        },
        native: {}
    });

    adapter.setObjectNotExists(adapter.namespace + '.receive.slotTime', {
        type: 'state',
        common: {
            name: 'received compiled time',
            desc: "receive recognized time from snip's intents",
            type: 'number',
            role: 'value.datetime',
            read: true,
            write: true
        },
        native: {}
    });

    adapter.setObjectNotExists(adapter.namespace + '.send.say.text', {
        type: 'state',
        common: {
            name: 'text for output',
            desc: 'send text to snips',
            type: 'string',
            role: 'text',
            read: true,
            write: true
        },
        native: {}
    });

    adapter.setObjectNotExists(adapter.namespace + '.send.inject.room', {
        type: 'state',
        common: {
            name: 'room inject',
            desc: 'send inject for room-slot to snips',
            type: 'string',
            role: 'text',
            read: true,
            write: true
        },
        native: {}
    });

    adapter.setObjectNotExists(adapter.namespace + '.send.inject.device', {
        type: 'state',
        common: {
            name: 'device inject',
            desc: 'send inject for device-slot to snips',
            type: 'string',
            role: 'text',
            read: true,
            write: true
        },
        native: {}
    });

    adapter.setObjectNotExists(adapter.namespace + '.send.inject.color', {
        type: 'state',
        common: {
            name: 'color inject',
            desc: 'send inject for color-slot to snips',
            type: 'string',
            role: 'text',
            read: true,
            write: true
        },
        native: {}
    });

    adapter.setObjectNotExists(adapter.namespace + '.send.inject.broadcast', {
        type: 'state',
        common: {
            name: 'broadcast inject',
            desc: 'send inject for broadcaster-slot to snips',
            type: 'string',
            role: 'text',
            read: true,
            write: true
        },
        native: {}
    });

    adapter.setObjectNotExists(adapter.namespace + '.send.inject.expletive', {
        type: 'state',
        common: {
            name: 'expletive inject',
            desc: 'send inject for expletive-slot to snips (e.g. Guten Morgen)',
            type: 'string',
            role: 'text',
            read: true,
            write: true
        },
        native: {}
    });

    adapter.setObjectNotExists(adapter.namespace + '.send.inject.genre', {
        type: 'state',
        common: {
            name: 'genre inject',
            desc: 'send inject for genre-slot to snips',
            type: 'string',
            role: 'text',
            read: true,
            write: true
        },
        native: {}
    });

    adapter.setObjectNotExists(adapter.namespace + '.send.inject.interpret', {
        type: 'state',
        common: {
            name: 'interpret inject',
            desc: 'send inject for interpret-slot to snips',
            type: 'string',
            role: 'text',
            read: true,
            write: true
        },
        native: {}
    });

    adapter.setObjectNotExists(adapter.namespace + '.send.feedback.sound', {
        type: 'state',
        common: {
            name: 'soundfeedback',
            desc: 'soundfeedback on/off',
            type: 'boolean',
            role: 'state',
            read: true,
            write: true
        },
        native: {}
    });

    adapter.setObjectNotExists(adapter.namespace + '.hotword.wait', {
        type: 'state',
        common: {
            name: 'hotword wait',
            desc: 'wait for hotword',
            type: 'boolean',
            role: 'state',
            read: true,
            write: false
        },
        native: {}
    });

    adapter.setObjectNotExists(adapter.namespace + '.hotword.detected', {
        type: 'state',
        common: {
            name: 'hotword detected',
            desc: 'hotword is detected',
            type: 'boolean',
            role: 'state',
            read: true,
            write: false
        },
        native: {}
    });

    adapter.setObjectNotExists(adapter.namespace + '.hotword.roomid', {
        type: 'state',
        common: {
            name: 'roomId',
            desc: 'roomId',
            type: 'string',
            role: 'text',
            read: true,
            write: false
        },
        native: {}
    });

    adapter.subscribeStates('*');
    client = new require(__dirname + '/lib/client')(adapter);
}

// If started as allInOne/compact mode => return function to create instance
if (module && module.parent) {
    module.exports = startAdapter;
} else {
    // or start the instance directly
    startAdapter();
}
