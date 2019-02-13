'use strict';

const mqtt            = require('mqtt');
const utils           = require(__dirname + '/utils');
const tools           = require(require(__dirname + '/utils').controllerDir + '/lib/tools');
const valueExpire     = 10; //expiration after x seconds. for slotValues, so the next intent can not mix the values with the ones of the previous

let roomid;

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

    function updateStates(snipsID,slot,value) {
        adapter.setObjectNotExists(
            adapter.namespace + '.send.' + snipsID + '.say.text', {
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
            },
            adapter.setState('send.' + snipsID + '.say.text', {val: value, expire: valueExpire}, true)
        );
        
        adapter.setObjectNotExists(
            adapter.namespace + '.receive.' + snipsID + '.text', {
                type: 'state',
                common: {
                    name: 'received text',
                    desc: 'receive text from snips device ' + snipsID,
                    type: 'string',
                    role: 'text',
                    read: true,
                    write: true
                },
                native: {}
            },
            adapter.setState('receive.' + snipsID + '.' + slot, {val: value, expire: valueExpire}, true)
        );
    
        adapter.setObjectNotExists(
            adapter.namespace + '.receive.' + snipsID + '.compiledText', {
                type: 'state',
                common: {
                    name: 'compiled text',
                    desc: "receive compiled text from snip's intents of snips device " + snipsID,
                    type: 'string',
                    role: 'text',
                    read: true,
                    write: true
                },
                native: {}
            },
            adapter.setState('receive.' + snipsID + '.' + slot, {val: value, expire: valueExpire}, true)
        );
    
        adapter.setObjectNotExists(
            adapter.namespace + '.receive.' + snipsID + '.slotDevice', {
                type: 'state',
                common: {
                    name: 'received compiled device',
                    desc: "receive recognized device from snip's intents of snips device " + snipsID,
                    type: 'string',
                    role: 'text',
                    read: true,
                    write: true
                },
                native: {}
            },
            adapter.setState('receive.' + snipsID + '.' + slot, {val: value, expire: valueExpire}, true)
        );
    
        adapter.setObjectNotExists(
            adapter.namespace + '.receive.' + snipsID + '.slotRoom', {
                type: 'state',
                common: {
                    name: 'received compiled room',
                    desc: "receive recognized room from snip's intents of snips device " + snipsID,
                    type: 'string',
                    role: 'text',
                    read: true,
                    write: true
                },
                native: {}
            },
            adapter.setState('receive.' + snipsID + '.' + slot, {val: value, expire: valueExpire}, true)
        );
    
        adapter.setObjectNotExists(
            adapter.namespace + '.receive.' + snipsID + '.slotValuetype', {
                type: 'state',
                common: {
                    name: 'received compiled valuetype',
                    desc: "receive recognized valuetype from snip's intents of snips device " + snipsID,
                    type: 'string',
                    role: 'text',
                    read: true,
                    write: true
                },
                native: {}
            },
            adapter.setState('receive.' + snipsID + '.' + slot, {val: value, expire: valueExpire}, true)
        );
    
        adapter.setObjectNotExists(
            adapter.namespace + '.receive.' + snipsID + '.slotColor', {
                type: 'state',
                common: {
                    name: 'received compiled color',
                    desc: "receive recognized color from snip's intents of snips device " + snipsID,
                    type: 'string',
                    role: 'text',
                    read: true,
                    write: true
                },
                native: {}
            },
            adapter.setState('receive.' + snipsID + '.' + slot, {val: value, expire: valueExpire}, true)
        );
    
        adapter.setObjectNotExists(
            adapter.namespace + '.receive.' + snipsID + '.slotBroadcast', {
                type: 'state',
                common: {
                    name: 'received compiled broadcaster',
                    desc: "receive recognized broadcaster from snip's intents of snips device " + snipsID,
                    type: 'string',
                    role: 'text',
                    read: true,
                    write: true
                },
                native: {}
            },
            adapter.setState('receive.' + snipsID + '.' + slot, {val: value, expire: valueExpire}, true)
        );
    
        adapter.setObjectNotExists(
            adapter.namespace + '.receive.' + snipsID + '.slotCommand', {
                type: 'state',
                common: {
                    name: 'received compiled command',
                    desc: "receive recognized command from snip's intents of snips device " + snipsID,
                    type: 'string',
                    role: 'text',
                    read: true,
                    write: true
                },
                native: {}
            },
            adapter.setState('receive.' + snipsID + '.' + slot, {val: value, expire: valueExpire}, true)
        );
    
        adapter.setObjectNotExists(
            adapter.namespace + '.receive.' + snipsID + '.slotValue', {
                type: 'state',
                common: {
                    name: 'received compiled value',
                    desc: "receive recognized value from snip's intents of snips device " + snipsID,
                    type: 'number',
                    role: 'value',
                    read: true,
                    write: true
                },
                native: {}
            },
            adapter.setState('receive.' + snipsID + '.' + slot, {val: value, expire: valueExpire}, true)
        );
    
        adapter.setObjectNotExists(
            adapter.namespace + '.receive.' + snipsID + '.slotStatus', {
                type: 'state',
                common: {
                    name: 'received compiled status',
                    desc: "receive recognized status from snip's intents of snips device " + snipsID,
                    type: 'string',
                    role: 'text',
                    read: true,
                    write: true
                },
                native: {}
            },
            adapter.setState('receive.' + snipsID + '.' + slot, {val: value, expire: valueExpire}, true)
        );
    
        adapter.setObjectNotExists(
                adapter.namespace + '.receive.' + snipsID + '.slotDuration', {
                type: 'state',
                common: {
                    name: 'received compiled duration',
                    desc: "receive recognized duration from snip's intents of snips device " + snipsID,
                    type: 'string',
                    role: 'text',
                    read: true,
                    write: true
                },
                native: {}
            },
            adapter.setState('receive.' + snipsID + '.' + slot, {val: value, expire: valueExpire}, true)
        );
    
        adapter.setObjectNotExists(
            adapter.namespace + '.receive.' + snipsID + '.slotGenre', {
                type: 'state',
                common: {
                    name: 'received compiled genre',
                    desc: "receive recognized genre from snip's intents of snips device " + snipsID,
                    type: 'string',
                    role: 'text',
                    read: true,
                    write: true
                },
                native: {}
            },
            adapter.setState('receive.' + snipsID + '.' + slot, {val: value, expire: valueExpire}, true)
        );
    
        adapter.setObjectNotExists(
            adapter.namespace + '.receive.' + snipsID + '.slotInterpret', {
                type: 'state',
                common: {
                    name: 'received compiled interpret',
                    desc: "receive recognized interpret from snip's intents of snips device " + snipsID,
                    type: 'string',
                    role: 'text',
                    read: true,
                    write: true
                },
                native: {}
            },
            adapter.setState('receive.' + snipsID + '.' + slot, {val: value, expire: valueExpire}, true)
        );
    
        adapter.setObjectNotExists(
            adapter.namespace + '.receive.' + snipsID + '.slotTime', {
                type: 'state',
                common: {
                    name: 'received compiled time',
                    desc: "receive recognized time from snip's intents of snips device " + snipsID,
                    type: 'number',
                    role: 'value.datetime',
                    read: true,
                    write: true
                },
                native: {}
            },
            adapter.setState('receive.' + snipsID + '.' + slot, {val: value, expire: valueExpire}, true)
        );
    }

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
                client.publish(id + "/toggleOn", JSON.stringify({"siteId":roomid}), {qos: adapter.config.defaultQoS, retain: adapter.config.retain});
            } else {
                client.publish(id + "/toggleOff", JSON.stringify({"siteId":roomid}), {qos: adapter.config.defaultQoS, retain: adapter.config.retain});
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
            let roomid = result.siteId;
            let output = result.input;
			switch (topic) {
			case 'hermes/hotword/toggleOn' :
                adapter.setState('hotword.wait', true, true);
                adapter.setState('hotword.detected', false, true);
				break;
			case 'hermes/hotword/toggleOff' :
				adapter.setState('hotword.wait', false, true);
				adapter.setState('hotword.detected', true, true);
				break;
			case 'hermes/hotword/default/detected' :
                adapter.log.debug(message);
                adapter.setState('hotword.detected', false, true);
                break;
            case 'hermes/intent/unltdnetworx:setDevice':
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
                        case 'broadcaster':
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
                        case 'value':
                            slotValue = result.slots[i].value.value;
                            output = output.replace(result.slots[i].rawValue, result.slots[i].value.value)
                            break;
                        case 'unit':
                            slotValuetype = result.slots[i].value.value;
                            break;
                        case 'command':
                            switch (slotDevice) {
                                case 'Rollladen':
                                    if (result.slots[i].value.value == 'true') {
                                        slotCommand = 'hoch';
                                    } else {
                                        slotCommand = 'runter';
                                    }
                                    break;
                                case 'Licht':
                                    if (result.slots[i].value.value == 'true') {
                                        slotCommand = 'an';
                                    } else {
                                        slotCommand = 'aus';
                                    }
                                    break;
                                default:
                                    slotCommand = result.slots[i].value.value;
                            }
                            output = output.replace(result.slots[i].rawValue, slotCommand)
                            break;
                    }
                }

                updateStates(roomid,'slotDevice',slotDevice)
                updateStates(roomid,'slotRoom',slotRoom)
                updateStates(roomid,'slotCommand',slotCommand)
                updateStates(roomid,'slotColor',slotColor)
                updateStates(roomid,'slotBroadcast',slotBroadcast)
                updateStates(roomid,'slotGenre',slotGenre)
                updateStates(roomid,'slotInterpret',slotInterpret)
                updateStates(roomid,'slotValuetype',slotValuetype)
                updateStates(roomid,'slotValue',slotValue)
                updateStates(roomid,'compiledText',output)
                updateStates(roomid,'text',result.input)
                adapter.setState
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
                updateStates(roomid,'slotDevice',slotDevice)
                updateStates(roomid,'slotRoom',slotRoom)
                updateStates(roomid,'slotStatus',slotStatus)
                updateStates(roomid,'slotDuration',slotDuration)
                updateStates(roomid,'slotTime',slotTime)
                updateStates(roomid,'compiledText',output)
                updateStates(roomid,'text',result.input)
                adapter.setForeignState('text2command.' + config.topic + '.text', output);
                break;
            default:
                message = result.input;
                adapter.log.info(message);
                updateStates(roomid,'compiledText',output)
                updateStates(roomid,'text',result.input)
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
