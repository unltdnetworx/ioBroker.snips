/**
 *
 * snips adapter
 *
 */

/* jshint -W097 */// jshint strict:false
/*jslint node: true */
'use strict';

const utils    = require(__dirname + '/lib/utils'); // Get common adapter utils
const adapterName = require('./package.json').name.split('.').pop();
let adapter;
let client   = null;

function startAdapter(options) {
    options = options || {};
    Object.assign(options, {name: adapterName});

    adapter = new utils.Adapter(options);

    adapter.on('message', function (obj) {
        if (obj) processMessage(obj);
        processMessages();
    });

    adapter.on('ready', function () {
        adapter.config.maxTopicLength = 100;
        main();
    });

    adapter.on('unload', function () {
        if (client) client.destroy();
    });

    // is called if a subscribed state changes
    adapter.on('stateChange', (id, state) => {
        adapter.log.debug('stateChange ' + id + ': ' + JSON.stringify(state));
        switch (id) {
        case (adapter.namespace + '.send.say.text') :
            adapter.log.info('from Text2Command : ' + state.val);
            if (state.val.indexOf(adapter.config.filter) == -1) {
                if (client) client.onStateChange('hermes/tts/say',state.val,'say');
            }
            break;
        case (adapter.namespace + '.send.inject.room') :
            if (client) client.onStateChange('hermes/injection/perform',state.val,'inject_room');
            break;
        case (adapter.namespace + '.send.inject.device') :
            if (client) client.onStateChange('hermes/injection/perform',state.val,'inject_device');
            break;
        case (adapter.namespace + '.send.inject.color') :
            if (client) client.onStateChange('hermes/injection/perform',state.val,'inject_color');
            break;
        case (adapter.namespace + '.send.inject.expletive') :
            if (client) client.onStateChange('hermes/injection/perform',state.val,'inject_expletive');
            break;
        case (adapter.namespace + '.send.inject.broadcast') :
            if (client) client.onStateChange('hermes/injection/perform',state.val,'inject_broadcast');
            break;
        case (adapter.namespace + '.send.inject.genre') :
            if (client) client.onStateChange('hermes/injection/perform',state.val,'inject_genre');
            break;
        case (adapter.namespace + '.send.inject.interpret') :
            if (client) client.onStateChange('hermes/injection/perform',state.val,'inject_interpret');
            break;
        case (adapter.namespace + '.send.feedback.sound') :
            if (client) client.onStateChange('hermes/feedback/sound',state.val,'sound');
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
