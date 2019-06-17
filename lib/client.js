'use strict';
const mqtt  = require('mqtt');
const utils = require('@iobroker/adapter-core');
const tools = require(utils.controllerDir + '/lib/tools');

let roomid;
let systemLanguage;

function MQTTClient(adapter) {
    if (!(this instanceof MQTTClient)) return new MQTTClient(adapter);

    let client = null;
    let connected = false;

    this.destroy = () => {
        if (client) {
            client.end();
            client = null;
        }
    };

    this.onStateChange = (id, state, cn) => send2Server(id, state, cn);

    function updateStates(snipsID,slot,value) {       
        let snipsPath;
        let snipsName;
        let snipsDesc;
        let snipsType;
        let snipsRole;
        
        switch (slot) {
            case 'text':
                snipsPath = 'receive.text';
                snipsName = 'received text';
                snipsDesc = 'receive text from snips device';
                snipsType = 'string';
                snipsRole = 'text';
            break;
            case 'compiledText':
                snipsPath = 'receive.compiledText';
                snipsName = 'compiled text';
                snipsDesc = "receive compiled text from snip's intents of snips device";
                snipsType = 'string';
                snipsRole = 'text';
            break;
            case 'slotDevice':
                snipsPath = 'receive.slotDevice';
                snipsName = 'received compiled device';
                snipsDesc = "receive recognized device from snip's intents of snips device";
                snipsType = 'string';
                snipsRole = 'text';
            break;
            case 'slotRoom':
                snipsPath = 'receive.slotRoom';
                snipsName = 'received compiled room';
                snipsDesc = "receive recognized room from snip's intents of snips device";
                snipsType = 'string';
                snipsRole = 'text';
            break;
            case 'slotValuetype':
                snipsPath = 'receive.slotValuetype';
                snipsName = 'received compiled valuetype';
                snipsDesc = "receive recognized valuetype from snip's intents of snips device";
                snipsType = 'string';
                snipsRole = 'text';
            break;
            case 'slotColor':
                snipsPath = 'receive.slotColor';
                snipsName = 'received compiled color';
                snipsDesc = "receive recognized color from snip's intents of snips device";
                snipsType = 'string';
                snipsRole = 'text';
            break;
            case 'slotBroadcast':
                snipsPath = 'receive.slotBroadcast';
                snipsName = 'received compiled broadcaster';
                snipsDesc = "receive recognized broadcaster from snip's intents of snips device";
                snipsType = 'string';
                snipsRole = 'text';
            break;
            case 'slotCommand':
                snipsPath = 'receive.slotCommand';
                snipsName = 'received compiled command';
                snipsDesc = "receive recognized command from snip's intents of snips device";
                snipsType = 'string';
                snipsRole = 'text';
            break;
            case 'slotValue':
                snipsPath = 'receive.slotValue';
                snipsName = 'received compiled value';
                snipsDesc = "receive recognized value from snip's intents of snips device";
                snipsType = 'number';
                snipsRole = 'value';
            break;
            case 'slotStatus':
                snipsPath = 'receive.slotStatus';
                snipsName = 'received compiled status';
                snipsDesc = "receive recognized status from snip's intents of snips device";
                snipsType = 'string';
                snipsRole = 'text';
            break;
            case 'slotDuration':
                snipsPath = 'receive.slotDuration';
                snipsName = 'received compiled duration';
                snipsDesc = "receive recognized duration from snip's intents of snips device";
                snipsType = 'string';
                snipsRole = 'text';
            break;
            case 'slotGenre':
                snipsPath = 'receive.slotGenre';
                snipsName = 'received compiled genre';
                snipsDesc = "receive recognized genre from snip's intents of snips device";
                snipsType = 'string';
                snipsRole = 'text';
            break;
            case 'slotInterpret':
                snipsPath = 'receive.slotInterpret';
                snipsName = 'received compiled interpret';
                snipsDesc = "receive recognized interpret from snip's intents of snips device";
                snipsType = 'string';
                snipsRole = 'text';
            break;
            case 'slotTime':
                snipsPath = 'receive.slotTime';
                snipsName = 'received compiled time';
                snipsDesc = "receive recognized time from snip's intents of snips device";
                snipsType = 'number';
                snipsRole = 'value.datetime';
            break;
            case 'sessionStarted':
            case 'sessionEnded':
                snipsPath = 'sessionID';
                snipsName = 'current SessionID';
                snipsDesc = "current session-ID on snips device";
                snipsType = 'string';
                snipsRole = 'text';
            break;
        }

        //Neues Snips-Gerät als Device anlegen
        adapter.setObjectNotExists(adapter.namespace + '.devices.' + snipsID, {
            type: 'device',
            common: {
                name: snipsID
            },
            native: undefined
        });

        adapter.setObjectNotExists(
            adapter.namespace + '.devices.' + snipsID + '.enforceSameRoom', {
                type: 'state',
                common: {
                    name: 'enforce same room',
                    desc: 'activate/deactivate enforcement for room slot as romm of device',
                    type: 'boolean',
                    role: 'state',
                    read: true,
                    write: true
                },
                native: {value: false}
            }
        );
        
        adapter.setObjectNotExists(
            adapter.namespace + '.devices.' + snipsID + '.' + snipsPath, {
                type: 'state',
                common: {
                    name: snipsName,
                    desc: snipsDesc + ' ' + snipsID,
                    type: snipsType,
                    role: snipsRole,
                    read: true,
                    write: true
                },
                native: {}
            },
            adapter.setState('devices.' + snipsID + '.' + snipsPath, value, true)
        );

        adapter.setObjectNotExists(
            adapter.namespace + '.devices.' + snipsID + '.send.feedback', {
                type: 'state',
                common: {
                    name: 'soundfeedback on/off',
                    desc: 'soundfeedback ' + snipsID + '  on/off',
                    type: 'boolean',
                    role: 'state',
                    read: true,
                    write: true
                },
                native: {}
            }
        );

        adapter.setObjectNotExists(
            adapter.namespace + '.devices.' + snipsID + '.send.hotword', {
                type: 'state',
                common: {
                    name: 'hotword recognition',
                    desc: 'activate/deactivate hotword recognicion (mute) for ' + snipsID,
                    type: 'boolean',
                    role: 'state',
                    read: true,
                    write: true
                },
                native: {}
            }
        );
    
        adapter.setObjectNotExists(
            adapter.namespace + '.devices.' + snipsID + '.send.text', {
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
            }
        );
    }

    function send2Server(id, state, cn) {
        if (!client) return;
        switch (cn) {
            case 'say':
                client.publish(id, JSON.stringify(state), {qos: adapter.config.defaultQoS, retain: adapter.config.retain});
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
            case 'feedback':
                client.publish(id, JSON.stringify({"siteId":state}), {qos: adapter.config.defaultQoS, retain: adapter.config.retain});
            break;
            case 'hotword':
                client.publish(id, JSON.stringify({"siteId":state}), {qos: adapter.config.defaultQoS, retain: adapter.config.retain});
            break;
	    }
    }

    (function _constructor(config) {
        const clientId = config.clientId || ((tools.getHostname ? tools.getHostname() : utils.appName) + '.' + adapter.namespace);
        const _url = 'mqtt://' + config.url + (config.port ? (':' + config.port) : '') + '?clientId=' + clientId;
        adapter.log.info('Try to connect to ' + _url);
        client = mqtt.connect(_url, {
            keepalive: config.keepalive || 10, /* in seconds */
            protocolId: 'MQTT',
            protocolVersion: 4,
            reconnectPeriod: config.reconnectPeriod || 1000, /* in milliseconds */
            connectTimeout: (config.connectTimeout || 30) * 1000, /* in milliseconds */
            clean: config.clean === undefined ? true : config.clean
        });

        client.subscribe('hermes/hotword/#');
        client.subscribe('hermes/intent/#');
        client.subscribe('hermes/dialogueManager/#');

        adapter.getForeignObject('system.config', function (err, obj) {
            if (err) {
                adapter.log.error(err);
                adapter.log.error("statusCode: " + response.statusCode);
                adapter.log.error("statusText: " + response.statusText);
                return;
            } else if (obj) {
                if (!obj.common.language) {
                    systemLanguage = 'en';
                    adapter.log.info("Language not set. English set therefore.");
                    //nameTranslation = require(__dirname + '/admin/i18n/de/translations.json')
                } else {
                    systemLanguage = obj.common.language;
                    //nameTranslation = require(__dirname + '/admin/i18n/' + systemLanguage + '/translations.json')
                }
            }
        });

        // create connected object and state
        adapter.getObject('info.connection', (err, obj) => {
            if (!obj || !obj.common || obj.common.type !== 'boolean') {
                obj = {
                    _id: 'info.connection',
                    type: 'state',
                    common: {
                        role: 'indicator.connected',
                        name: 'If connected to MQTT broker',
                        type: 'boolean',
                        read: true,
                        write: false,
                        def: false
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
            roomid = result.siteId;
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
                    adapter.setState('hotword.detected', false, true);
                break;
                case 'hermes/dialogueManager/sessionStarted' :
                    updateStates(roomid,'sessionStarted',result.sessionId)
                break;
                case 'hermes/dialogueManager/sessionEnded' :
                    updateStates(roomid,'sessionEnded','')

                    updateStates(roomid, 'text', '')
                    updateStates(roomid, 'compiledText', '')
                    updateStates(roomid, 'slotDevice', '')
                    updateStates(roomid, 'slotRoom', '')
                    updateStates(roomid, 'slotValuetype', '')
                    updateStates(roomid, 'slotColor', '')
                    updateStates(roomid, 'slotBroadcast', '')
                    updateStates(roomid, 'slotCommand', '')
                    updateStates(roomid, 'slotValue', '')
                    updateStates(roomid, 'slotStatus', '')
                    updateStates(roomid, 'slotDuration', '')
                    updateStates(roomid, 'slotGenre', '')
                    updateStates(roomid, 'slotInterpret', '')
                    updateStates(roomid, 'slotTime', '')
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
                                adapter.getState('devices.' + roomid + '.enforceSameRoom', function (err, state) {
                                    if(state) {
                                        adapter.getEnums('rooms', (err, res) => {
                                            if (res) {
                                                let _result = res['enum.rooms'];
                                                
                                                for ( let rooms in _result) {
                                                    if(_result[rooms].common.members == adapter.namespace + '.devices.' + roomid){
                                                        if(!slotRoom || slotRoom == '') {
                                                            slotRoom = _result[rooms].common.name[systemLanguage];
                                                        } else {
                                                            slotRoom = slotRoom + ", " + _result[rooms].common.name[systemLanguage];
                                                        }
                                                    }
                                                }
                                                output = output.replace(result.slots[i].rawValue, slotRoom)
                                            } else if (err) {
                                                adapter.log.warn('No room set for device in objects enumeration.')
                                            }
                                        });
                                    } else {
                                        if(!slotRoom || slotRoom == '') {
                                            slotRoom = result.slots[i].value.value;
                                        } else {
                                            slotRoom = slotRoom + ", " + result.slots[i].value.value;
                                        }
                                        output = output.replace(result.slots[i].rawValue, slotRoom)
                                    } 
                                });
                            break;
                            case 'color':
                                slotColor = result.slots[i].value.value;
                                output = output.replace(result.slots[i].rawValue, slotColor)
                            break;
                            case 'broadcaster':
                                slotBroadcast = result.slots[i].value.value;
                                output = output.replace(result.slots[i].rawValue, slotBroadcast)
                            break;
                            case 'genre':
                                slotGenre = result.slots[i].value.value;
                                output = output.replace(result.slots[i].rawValue, slotGenre)
                            break;
                            case 'interpret':
                                slotInterpret = result.slots[i].value.value;
                                output = output.replace(result.slots[i].rawValue, slotInterpret)
                            break;
                            case 'value':
                                slotValue = result.slots[i].value.value;
                                output = output.replace(result.slots[i].rawValue, slotValue)
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
                    adapter.setForeignState('text2command.' + config.topic + '.text', output + ' [' + result.sessionId + ']');
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
                                output = output.replace(result.slots[i].rawValue, slotDevice)
                            break;
                            case 'room':
                                adapter.getState('devices.' + roomid + '.enforceSameRoom', function (err, state) {
                                    if(state.val) {
                                        adapter.getEnums('rooms', (err, res) => {
                                            if (res) {
                                                let _result = res['enum.rooms'];
                                                
                                                for ( let rooms in _result) {
                                                    if(_result[rooms].common.members == adapter.namespace + '.devices.' + roomid){
                                                        if(!slotRoom || slotRoom == '') {
                                                            slotRoom = _result[rooms].common.name[systemLanguage];
                                                        } else {
                                                            slotRoom = slotRoom + ", " + _result[rooms].common.name[systemLanguage];
                                                        }
                                                    }
                                                }
                                                output = output.replace(result.slots[i].rawValue, slotRoom)
                                            } else if (err) {
                                                adapter.log.warn('No room set for device in objects enumeration.')
                                            }
                                        });
                                    } else {
                                        if(!slotRoom || slotRoom == '') {
                                            slotRoom = result.slots[i].value.value;
                                        } else {
                                            slotRoom = slotRoom + ", " + result.slots[i].value.value;
                                        }
                                        output = output.replace(result.slots[i].rawValue, slotRoom)
                                    } 
                                });
                            break;
                            case 'status':
                                slotStatus = result.slots[i].value.value;
                                //output = output.replace(result.slots[i].rawValue, slotStatus)
                            break;
                            case 'duration':
                                slotDuration = result.slots[i].value.value;
                                output = output.replace(result.slots[i].rawValue, slotDuration)
                            break;
                            case 'time':
                                slotTime = result.slots[i].value.value;
                                output = output.replace(result.slots[i].rawValue, slotTime)
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
                    adapter.setForeignState('text2command.' + config.topic + '.text', output + ' [' + result.sessionId + ']');
                break;
                case 'hermes/intent/unltdnetworx:SmallTalk':
                    message = result.input;
                    adapter.log.info("Message: " + message);
                    updateStates(roomid,'compiledText',output)
                    updateStates(roomid,'text',result.input)
                    adapter.setForeignState('text2command.' + config.topic + '.text', message + ' [' + result.sessionId + ']');
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
