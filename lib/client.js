'use strict';

const mqtt            = require('mqtt');
const utils           = require(__dirname + '/utils');
const tools           = require(require(__dirname + '/utils').controllerDir + '/lib/tools');

function MQTTClient(adapter) {
    if (!(this instanceof MQTTClient)) return new MQTTClient(adapter);

    let client    = null;
    let connected = false;

    this.destroy = () => {
        if (client) {
            client.end();
            client = null;
        }
    };

    this.onStateChange = (id, state, cn) => send2Server(id, state, cn);

    function send2Server(id, state, cn) {
        if (!client) return;
		switch (cn) {
        case 'say':
			client.publish(id, JSON.stringify({"siteId":"default","text":state,"lang":"de"}), {qos: adapter.config.defaultQoS, retain: adapter.config.retain});
			break;
		case 'inject_room':
			client.publish(id, JSON.stringify({"operations":[["add",{"de.iobroker.rooms":[state]}]]}), {qos: adapter.config.defaultQoS, retain: adapter.config.retain});
			break;
		case 'inject_device':
			client.publish(id, JSON.stringify({"operations":[["add",{"de.iobroker.devices":[state]}]]}), {qos: adapter.config.defaultQoS, retain: adapter.config.retain});
			break;
        case 'inject_color':
			client.publish(id, JSON.stringify({"operations":[["add",{"de.iobroker.colors":[state]}]]}), {qos: adapter.config.defaultQoS, retain: adapter.config.retain});
			break;
		}
    }

    (function _constructor(config) {
        const  clientId = config.clientId || ((tools.getHostname ? tools.getHostname() : utils.appName) + '.' + adapter.namespace);
        const _url  = 'mqtt://' + config.url + (config.port ? (':' + config.port) : '') + '?clientId=' + clientId;
        adapter.log.info('Try to connect to ' + _url);
        client = mqtt.connect(_url, {
            keepalive:          config.keepalive || 10, /* in seconds */
            protocolId:         'MQTT',
            protocolVersion:    4,
            reconnectPeriod:    config.reconnectPeriod || 1000, /* in milliseconds */
            connectTimeout:     (config.connectTimeout || 30) * 1000, /* in milliseconds */
            clean:              config.clean === undefined ? true : config.clean
        });

        client.subscribe('hermes/nlu/query/#');
        client.subscribe('hermes/hotword/#');
        client.subscribe('hermes/intent/#');

        // create connected object and state
        adapter.getObject('info.connection', (err, obj) => {
            if (!obj || !obj.common || obj.common.type !== 'boolean') {
                obj = {
                    _id:  'info.connection',
                    type: 'state',
                    common: {
                        role:  'indicator.connected',
                        name:  'If connected to MQTT broker',
                        type:  'boolean',
                        read:  true,
                        write: false,
                        def:   false
                    },
                    native: {}
                };
                adapter.setObject('info.connection', obj, () => adapter.setState('info.connection', connected, true));
            }
        });

        // topic from MQTT broker received
        client.on('message', (topic, message) => {
            if (!topic) return;
            let isAck = true;
            let slotBoolean;
            let slotDevice;
            let slotRoom;
            let slotColor;
            let slotValue;
            let slotValuetype;
			switch (topic) {
            case 'hermes/nlu/query' :
				var result = JSON.parse(message);
				message = result.input;
				adapter.log.info(message);
				adapter.setState('receive.text', message);
				adapter.setForeignState('text2command.' + config.topic + '.text', message);
				break;
			case 'hermes/hotword/toggleOn' :
				adapter.setState('hotword.wait', true, true);
				break;
			case 'hermes/hotword/toggleOff' :
				adapter.setState('hotword.wait', false, true);
				adapter.setState('hotword.detected', false, true);
				break;
			case 'hermes/hotword/default/detected' :
                adapter.setState('hotword.detected', true, true);
                break;
            case 'hermes/intent/unltdnetworx:setNumeric':
                var result = JSON.parse(message);

                for (let i in result.slots) {
                    switch (result.slots[i].slotName) {
                        case 'device':
                            slotDevice = result.slots[i].value.value;
                            if(!slotDevice || slotDevice == '') {
                                slotDevice = result.slots[i].rawValue;
                            }
                            break;
                        case 'room':
                            slotRoom = result.slots[i].value.value;
                            if(!slotRoom || slotRoom == '') {
                                slotRoom = result.slots[i].rawValue;
                            }
                            break;
                        case 'value':
                            
                            break;
                        case 'valuetype':
                            
                            break;
                    }
                }
                break;
            case 'hermes/intent/unltdnetworx:setMedia':
                var result = JSON.parse(message);

                for (let i in result.slots) {
                    switch (result.slots[i].slotName) {
                        case 'device':
                            slotDevice = result.slots[i].value.value;
                            if(!slotDevice || slotDevice == '') {
                                slotDevice = result.slots[i].rawValue;
                            }
                            break;
                        case 'room':
                            slotRoom = result.slots[i].value.value;
                            if(!slotRoom || slotRoom == '') {
                                slotRoom = result.slots[i].rawValue;
                            }
                            break;
                        case 'broadcast':
                            
                            break;
                        case 'commands':
                            
                            break;
                    }
                }
                break;
            case 'hermes/intent/unltdnetworx:setBoolean':
                var result = JSON.parse(message);

                for (let i in result.slots) {
                    switch (result.slots[i].slotName) {
                        case 'device':
                            slotDevice = result.slots[i].value.value;
                            if(!slotDevice || slotDevice == '') {
                                slotDevice = result.slots[i].rawValue;
                            }
                            break;
                        case 'room':
                            slotRoom = result.slots[i].value.value;
                            if(!slotRoom || slotRoom == '') {
                                slotRoom = result.slots[i].rawValue;
                            }
                            break;
                        case 'onoff':
                            slotBoolean = result.slots[i].value.value;
                            if(!slotBoolean || slotBoolean == '') {
                                slotBoolean = result.slots[i].rawValue;
                            }
                            break;
                    }
                }

                adapter.setState('receive.intent', slotDevice + ' ' + slotRoom + ' ' + slotBoolean);
                //adapter.setForeignState('text2command.' + config.topic + '.text', message);
                break;
            case 'hermes/intent/unltdnetworx:setColor':
                var result = JSON.parse(message);

                for (let i in result.slots) {
                    switch (result.slots[i].slotName) {
                        case 'device':
                            slotDevice = result.slots[i].value.value;
                            if(!slotDevice || slotDevice == '') {
                                slotDevice = result.slots[i].rawValue;
                            }
                            break;
                        case 'room':
                            slotRoom = result.slots[i].value.value;
                            if(!slotRoom || slotRoom == '') {
                                slotRoom = result.slots[i].rawValue;
                            }
                            break;
                        case 'color':
                            
                            break;
                    }
                }
                break;
            case 'hermes/intent/unltdnetworx:getStatus':
                var result = JSON.parse(message);

                for (let i in result.slots) {
                    switch (result.slots[i].slotName) {
                        case 'device':
                            slotDevice = result.slots[i].value.value;
                            if(!slotDevice || slotDevice == '') {
                                slotDevice = result.slots[i].rawValue;
                            }
                            break;
                        case 'room':
                            slotRoom = result.slots[i].value.value;
                            if(!slotRoom || slotRoom == '') {
                                slotRoom = result.slots[i].rawValue;
                            }
                            break;
                        case 'status':
                            
                            break;
                        case 'duration':
                            
                            break;
                        case 'time':
                            
                            break;
                    }
                }
                break;
            }
        });

        client.on('connect', () => {
            adapter.log.info('Connected to ' + config.url);
            connected = true;
            adapter.setState('info.connection', connected, true);
        });

        client.on('error', err => {
            adapter.log.error('Client error:' + err);

            if (connected) {
                adapter.log.info('Disconnected from ' + config.url);
                connected = false;
                adapter.setState('info.connection', connected, true);
            }
        });
        
        client.on('close', err => {
            if (connected) {
                adapter.log.info('Disconnected from ' + config.url);
                connected = false;
                adapter.setState('info.connection', connected, true);
            }
        });
    })(adapter.config);

    process.on('uncaughtException', err => adapter.log.error('uncaughtException: ' + err));

    return this;
}

module.exports = MQTTClient;
