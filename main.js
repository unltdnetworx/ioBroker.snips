/**
 *
 * snips adapter
 *
 */

/* jshint -W097 */// jshint strict:false
/*jslint node: true */
'use strict';

const utils =    require(__dirname + '/lib/utils');
const adapter = new utils.Adapter('snips');

let client   = null;

adapter.on('ready', function () {
    adapter.config.maxTopicLength = 100;
    main();
});

adapter.on('unload', function () {
    if (client) client.destroy();
});

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
    }
});

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
            name: 'receive.text',
            desc: 'receive text from snips',
            type: 'string',
            role: 'text',
            read: true,
            write: true
        },
        native: {}
    });

    adapter.setObjectNotExists(adapter.namespace + '.receive.intent', {
        type: 'state',
        common: {
            name: 'receive.intent',
            desc: "receive slots from snip's intents",
            type: 'string',
            role: 'text',
            read: true,
            write: true
        },
        native: {}
    });

    adapter.setObjectNotExists(adapter.namespace + '.send.say.text', {
        type: 'state',
        common: {
            name: 'say.text',
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
            name: 'inject.room',
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
            name: 'inject.device',
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
            name: 'inject.color',
            desc: 'send inject for color-slot to snips',
            type: 'string',
            role: 'text',
            read: true,
            write: true
        },
        native: {}
    });

	adapter.setObjectNotExists(adapter.namespace + '.hotword.wait', {
        type: 'state',
        common: {
            name: 'hotword.wait',
            desc: 'wait of hotword',
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
            name: 'hotword.detected',
            desc: 'hotword detected',
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
