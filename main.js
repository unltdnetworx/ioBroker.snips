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
let states   = {};

const messageboxRegex = new RegExp('\.messagebox$');

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
		if (client) client.onStateChange('hermes/asr/inject',state.val,'inject_room');
		break;
	case (adapter.namespace + '.send.inject.device') :
		if (client) client.onStateChange('hermes/asr/inject',state.val,'inject_device');
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

    adapter.setObjectNotExists(adapter.namespace + '.send.say.text', {
        type: 'state',
        common: {
            name: 'text',
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
            name: 'room',
            desc: 'send inject to snips',
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
            name: 'device',
            desc: 'send inject to snips',
            type: 'string',
            role: 'text',
            read: true,
            write: true
        },
        native: {}
    });
	
	adapter.subscribeStates('*');
    client = new require(__dirname + '/lib/client')(adapter, states);    
}
