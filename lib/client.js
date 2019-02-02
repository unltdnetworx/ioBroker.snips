'use strict';

const mqtt            = require('mqtt');
const utils           = require(__dirname + '/utils');
const tools           = require(require(__dirname + '/utils').controllerDir + '/lib/tools');
const valueExpire     = 10; //expiration after x seconds. for slotValues, so the next intent can not mix the values with the ones of the previous

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
			client.publish(id, JSON.stringify({"operations":[["add",{"de.iobroker.room":[state]}]]}), {qos: adapter.config.defaultQoS, retain: adapter.config.retain});
			break;
		case 'inject_device':
			client.publish(id, JSON.stringify({"operations":[["add",{"de.iobroker.device":[state]}]]}), {qos: adapter.config.defaultQoS, retain: adapter.config.retain});
			break;
        case 'inject_color':
			client.publish(id, JSON.stringify({"operations":[["add",{"de.iobroker.color":[state]}]]}), {qos: adapter.config.defaultQoS, retain: adapter.config.retain});
			break;
        case 'inject_expletive':
			client.publish(id, JSON.stringify({"operations":[["add",{"de.iobroker.expletive":[state]}]]}), {qos: adapter.config.defaultQoS, retain: adapter.config.retain});
			break;
        case 'inject_broadcast':
			client.publish(id, JSON.stringify({"operations":[["add",{"de.iobroker.broadcaster":[state]}]]}), {qos: adapter.config.defaultQoS, retain: adapter.config.retain});
            break;
        case 'inject_genre':
			client.publish(id, JSON.stringify({"operations":[["add",{"de.iobroker.genre":[state]}]]}), {qos: adapter.config.defaultQoS, retain: adapter.config.retain});
            break;
        case 'inject_interpret':
			client.publish(id, JSON.stringify({"operations":[["add",{"de.iobroker.interpret":[state]}]]}), {qos: adapter.config.defaultQoS, retain: adapter.config.retain});
			break;
		case 'sound' :
            if (state) {
                client.publish(id + "/toggleOn", JSON.stringify({"siteId":"default"}), {qos: adapter.config.defaultQoS, retain: adapter.config.retain});
            } else {
                client.publish(id + "/toggleOff", JSON.stringify({"siteId":"default"}), {qos: adapter.config.defaultQoS, retain: adapter.config.retain});
            }
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
            let slotBroadcast;
            let slotCommand;
            let slotGenre;
            let slotInterpret;
            let slotValuetype;
            let slotStatus;
            let slotDuration;
            let slotTime;
            let result = JSON.parse(message);
            let output = result.input;
			switch (topic) {
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
                for (let i in result.slots) {
                    switch (result.slots[i].slotName) {
                        case 'device':
                            //set slot-variable initial or add additional device
                            if(!slotDevice || slotDevice == '') {
                                slotDevice = result.slots[i].value.value;
                            } else {
                                slotDevice = slotDevice + " " + result.slots[i].value.value;
                            }
                            //change words in recognized text to recognized slot words, especially for number values
                            output = output.replace(result.slots[i].rawValue, result.slots[i].value.value)  
                            break;
                        case 'room':
                            if(!slotRoom || slotRoom == '') {
                                slotRoom = result.slots[i].value.value;
                            } else {
                                slotRoom = slotRoom + " " + result.slots[i].value.value;
                            }
                            output = output.replace(result.slots[i].rawValue, result.slots[i].value.value)
                            break;
                        case 'value':
                            slotValue = result.slots[i].value.value;
                            output = output.replace(result.slots[i].rawValue, result.slots[i].value.value)
                            break;
                        case 'valuetype':
                            slotValuetype = result.slots[i].value.value;
                            break;
                    }
                }
                adapter.setState('receive.slotDevice', {val: slotDevice, expire: valueExpire});
                adapter.setState('receive.slotRoom', {val: slotRoom, expire: valueExpire});
                adapter.setState('receive.slotValuetype', {val: slotValuetype, expire: valueExpire});
                adapter.setState('receive.slotValue', {val: slotValue, expire: valueExpire});
                adapter.setState('receive.compiledText', output);
                adapter.setState('receive.text', result.input);
                adapter.setForeignState('text2command.' + config.topic + '.text', output);
                break;
            case 'hermes/intent/unltdnetworx:setMedia':
                for (let i in result.slots) {
                    switch (result.slots[i].slotName) {
                        case 'device':
                            if(!slotDevice || slotDevice == '') {
                                slotDevice = result.slots[i].value.value;
                            } else {
                                slotDevice = slotDevice + " " + result.slots[i].value.value;
                            }
                            output = output.replace(result.slots[i].rawValue, result.slots[i].value.value)  
                            break;
                        case 'room':
                            if(!slotRoom || slotRoom == '') {
                                slotRoom = result.slots[i].value.value;
                            } else {
                                slotRoom = slotRoom + " " + result.slots[i].value.value;
                            }
                            output = output.replace(result.slots[i].rawValue, result.slots[i].value.value)
                            break;
                        case 'broadcast':
                            slotBroadcast = result.slots[i].value.value;
                            output = output.replace(result.slots[i].rawValue, result.slots[i].value.value)
                            break;
                        case 'genre':
                            slotGenre = result.slots[i].value.value;
                            output = output.replace(result.slots[i].rawValue, result.slots[i].value.value)
                            break;
                        case 'interpret':
                            slotInterpret = result.slots[i].value.value;
                            output = output.replace(result.slots[i].rawValue, result.slots[i].value.value)
                            break;
                        case 'command':
                            slotCommand = result.slots[i].value.value;
                            output = output.replace(result.slots[i].rawValue, result.slots[i].value.value)
                            break;
                    }
                }
                adapter.setState('receive.slotDevice', {val: slotDevice, expire: valueExpire});
                adapter.setState('receive.slotRoom', {val: slotRoom, expire: valueExpire});
                adapter.setState('receive.slotBroadcast', {val: slotBroadcast, expire: valueExpire});
                adapter.setState('receive.slotGenre', {val: slotGenre, expire: valueExpire});
                adapter.setState('receive.slotInterpret', {val: slotInterpret, expire: valueExpire});
                adapter.setState('receive.slotCommand', {val: slotCommand, expire: valueExpire});
                adapter.setState('receive.compiledText', output);
                adapter.setState('receive.text', result.input);
                adapter.setForeignState('text2command.' + config.topic + '.text', output);
                break;
            case 'hermes/intent/unltdnetworx:setBoolean':
                for (let i in result.slots) {
                    switch (result.slots[i].slotName) {
                        case 'device':
                            if(!slotDevice || slotDevice == '') {
                                slotDevice = result.slots[i].value.value;
                            } else {
                                slotDevice = slotDevice + " " + result.slots[i].value.value;
                            }
                            output = output.replace(result.slots[i].rawValue, result.slots[i].value.value)
                            break;
                        case 'room':
                            if(!slotRoom || slotRoom == '') {
                                slotRoom = result.slots[i].value.value;
                            } else {
                                slotRoom = slotRoom + " " + result.slots[i].value.value;
                            }
                            output = output.replace(result.slots[i].rawValue, result.slots[i].value.value)
                            break;
                        case 'onoff':
                            switch (slotDevice) {
                                case 'Rollladen':
                                    if (result.slots[i].value.value == 'true') {
                                        slotBoolean = 'hoch';
                                    } else {
                                        slotBoolean = 'runter';
                                    }
                                    break;
                                case 'Licht':
                                    if (result.slots[i].value.value == 'true') {
                                        slotBoolean = 'an';
                                    } else {
                                        slotBoolean = 'aus';
                                    }
                                    break;
                                default:
                                    slotBoolean = result.slots[i].value.value;
                            }
                            output = output.replace(result.slots[i].rawValue, slotBoolean)
                            break;
                    }
                }
                adapter.setState('receive.slotDevice', {val: slotDevice, expire: valueExpire});
                adapter.setState('receive.slotRoom', {val: slotRoom, expire: valueExpire});
                adapter.setState('receive.slotOnOff', {val: slotBoolean, expire: valueExpire});
                adapter.setState('receive.compiledText', output);
                adapter.setState('receive.text', result.input);
                adapter.setForeignState('text2command.' + config.topic + '.text', output);
                break;
            case 'hermes/intent/unltdnetworx:setColor':
                for (let i in result.slots) {
                    switch (result.slots[i].slotName) {
                        case 'device':
                            if(!slotDevice || slotDevice == '') {
                                slotDevice = result.slots[i].value.value;
                            } else {
                                slotDevice = slotDevice + " " + result.slots[i].value.value;
                            }
                            output = output.replace(result.slots[i].rawValue, result.slots[i].value.value)
                            break;
                        case 'room':
                            if(!slotRoom || slotRoom == '') {
                                slotRoom = result.slots[i].value.value;
                            } else {
                                slotRoom = slotRoom + " " + result.slots[i].value.value;
                            }
                            output = output.replace(result.slots[i].rawValue, result.slots[i].value.value)
                            break;
                        case 'color':
                            slotColor = result.slots[i].value.value;
                            output = output.replace(result.slots[i].rawValue, result.slots[i].value.value)
                            break;
                    }
                }
                adapter.setState('receive.slotDevice', {val: slotDevice, expire: valueExpire});
                adapter.setState('receive.slotRoom', {val: slotRoom, expire: valueExpire});
                adapter.setState('receive.slotColor', {val: slotColor, expire: valueExpire});
                adapter.setState('receive.compiledText', output);
                adapter.setState('receive.text', result.input);
                adapter.setForeignState('text2command.' + config.topic + '.text', output);
                break;
            case 'hermes/intent/unltdnetworx:getStatus':
                for (let i in result.slots) {
                    switch (result.slots[i].slotName) {
                        case 'device':
                            if(!slotDevice || slotDevice == '') {
                                slotDevice = result.slots[i].value.value;
                            } else {
                                slotDevice = slotDevice + " " + result.slots[i].value.value;
                            }
                            output = output.replace(result.slots[i].rawValue, result.slots[i].value.value)
                            break;
                        case 'room':
                            if(!slotRoom || slotRoom == '') {
                                slotRoom = result.slots[i].value.value;
                            } else {
                                slotRoom = slotRoom + " " + result.slots[i].value.value;
                            }
                            output = output.replace(result.slots[i].rawValue, result.slots[i].value.value)
                            break;
                        case 'status':
                            slotStatus = result.slots[i].value.value;
                            //output = output.replace(result.slots[i].rawValue, result.slots[i].value.value)
                            break;
                        case 'duration':
                            slotDuration = result.slots[i].value.value;
                            output = output.replace(result.slots[i].rawValue, result.slots[i].value.value)
                            break;
                        case 'time':
                            slotTime = result.slots[i].value.value;
                            output = output.replace(result.slots[i].rawValue, result.slots[i].value.value)
                            break;
                    }
                }
                adapter.setState('receive.slotDevice', {val: slotDevice, expire: valueExpire});
                adapter.setState('receive.slotRoom', {val: slotRoom, expire: valueExpire});
                adapter.setState('receive.slotStatus', {val: slotStatus, expire: valueExpire});
                adapter.setState('receive.slotDuration', {val: slotDuration, expire: valueExpire});
                adapter.setState('receive.slotTime', {val: slotTime, expire: valueExpire});
                adapter.setState('receive.compiledText', output);
                adapter.setState('receive.text', result.input);
                adapter.setForeignState('text2command.' + config.topic + '.text', output);
                break;
            default:
                message = result.input;
                adapter.log.info(message);
                adapter.setState('receive.compiledText', message);
                adapter.setState('receive.text', message);
                adapter.setForeignState('text2command.' + config.topic + '.text', message);
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
