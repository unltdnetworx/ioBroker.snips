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
                    desc: 'activate/deactivate enforcement for room slot as room of device',
                    type: 'boolean',
                    role: 'state',
                    read: true,
                    write: true,
                    def: false
                },
                native: {}
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
                client.publish(id, JSON.stringify({"operations":[["add",new function(){ this[adapter.config.snipsLanguage + ".iobroker.room"] = [state]; }]]}), {qos: adapter.config.defaultQoS, retain: adapter.config.retain});
            break;
            case 'inject_device':
                client.publish(id, JSON.stringify({"operations":[["add",new function(){ this[adapter.config.snipsLanguage + ".iobroker.device"] = [state]; }]]}), {qos: adapter.config.defaultQoS, retain: adapter.config.retain});
            break;
            case 'inject_color':
                client.publish(id, JSON.stringify({"operations":[["add",new function(){ this[adapter.config.snipsLanguage + ".iobroker.color"] = [state]; }]]}), {qos: adapter.config.defaultQoS, retain: adapter.config.retain});
            break;
            case 'inject_expletive':
                client.publish(id, JSON.stringify({"operations":[["add",new function(){ this[adapter.config.snipsLanguage + ".iobroker.expletive"] = [state]; }]]}), {qos: adapter.config.defaultQoS, retain: adapter.config.retain});
            break;
            case 'inject_broadcast':
                client.publish(id, JSON.stringify({"operations":[["add",new function(){ this[adapter.config.snipsLanguage + ".iobroker.broadcaster"] = [state]; }]]}), {qos: adapter.config.defaultQoS, retain: adapter.config.retain});
            break;
            case 'inject_genre':
                client.publish(id, JSON.stringify({"operations":[["add",new function(){ this[adapter.config.snipsLanguage + ".iobroker.genre"] = [state]; }]]}), {qos: adapter.config.defaultQoS, retain: adapter.config.retain});
            break;
            case 'inject_interpret':
                client.publish(id, JSON.stringify({"operations":[["add",new function(){ this[adapter.config.snipsLanguage + ".iobroker.interpret"] = [state]; }]]}), {qos: adapter.config.defaultQoS, retain: adapter.config.retain});
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
            
            let loopDeviceComplete = function () {
                updateStates(roomid,'slotDevice',slotDevice)
                updateStates(roomid,'slotCommand',slotCommand)
                updateStates(roomid,'slotColor',slotColor)
                updateStates(roomid,'slotBroadcast',slotBroadcast)
                updateStates(roomid,'slotGenre',slotGenre)
                updateStates(roomid,'slotInterpret',slotInterpret)
                updateStates(roomid,'slotValuetype',slotValuetype)
                updateStates(roomid,'slotValue',slotValue)
                updateStates(roomid,'compiledText',output)
                updateStates(roomid,'text',result.input)

                adapter.getState('devices.' + roomid + '.enforceSameRoom', function (err, state) {
                    if (state === null) {
                        updateStates(roomid,'slotRoom',slotRoom)
                        adapter.setForeignState('text2command.' + config.topic + '.text', output + ' [' + result.sessionId + ']');
                    } else if(state.val) {
                        adapter.getEnums('rooms', (err, res) => {
                            if (res) {
                                let _result = res['enum.rooms'];
                                
                                for ( let rooms in _result) {
                                    for (let thingInRoom in _result[rooms].common.members) {
                                        if(_result[rooms].common.members[thingInRoom] == adapter.namespace + '.devices.' + roomid){
                                            if (slotRoom !== _result[rooms].common.name[systemLanguage]) {
                                                slotRoom = _result[rooms].common.name[systemLanguage];
                                                output = output + " " + slotRoom;
                                            }
                                        }
                                    }
                                }
                                updateStates(roomid,'slotRoom',slotRoom)
                                adapter.setForeignState('text2command.' + config.topic + '.text', output + ' [' + result.sessionId + ']');
                            } else if (err) {
                                adapter.log.warn('No room set for device in objects enumeration.');
                                adapter.log.error(err);
                                adapter.setForeignState('text2command.' + config.topic + '.text', output + ' [' + result.sessionId + ']');
                            }
                        });
                    } else {
                        updateStates(roomid,'slotRoom',slotRoom)
                        adapter.setForeignState('text2command.' + config.topic + '.text', output + ' [' + result.sessionId + ']');
                    } 
                }); 
            }

            let loopStatusComplete = function(){
                updateStates(roomid,'slotDevice',slotDevice)
                updateStates(roomid,'slotStatus',slotStatus)
                updateStates(roomid,'slotDuration',slotDuration)
                updateStates(roomid,'slotTime',slotTime)
                updateStates(roomid,'compiledText',output)
                updateStates(roomid,'text',result.input)

                adapter.getState('devices.' + roomid + '.enforceSameRoom', function (err, state) {
                    if (state === null) {
                        updateStates(roomid,'slotRoom',slotRoom)
                        adapter.setForeignState('text2command.' + config.topic + '.text', output + ' [' + result.sessionId + ']');
                    } else if(state.val) {
                        adapter.getEnums('rooms', (err, res) => {
                            if (res) {
                                let _result = res['enum.rooms'];
                                
                                for ( let rooms in _result) {
                                    for (let thingInRoom in _result[rooms].common.members) {
                                        if(_result[rooms].common.members[thingInRoom] == adapter.namespace + '.devices.' + roomid){
                                            if (slotRoom !== _result[rooms].common.name[systemLanguage]) {
                                                slotRoom = _result[rooms].common.name[systemLanguage];
                                                output = output + " " + slotRoom;
                                            }
                                        }
                                    }
                                }
                                updateStates(roomid,'slotRoom',slotRoom)
                                adapter.setForeignState('text2command.' + config.topic + '.text', output + ' [' + result.sessionId + ']');
                            } else if (err) {
                                adapter.log.warn('No room set for device in objects enumeration.');
                                adapter.log.error(err);
                                adapter.setForeignState('text2command.' + config.topic + '.text', output + ' [' + result.sessionId + ']');
                            }
                        });
                    } else {
                        updateStates(roomid,'slotRoom',slotRoom)
                        adapter.setForeignState('text2command.' + config.topic + '.text', output + ' [' + result.sessionId + ']');
                    } 
                });
            }

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

                case 'hermes/intent/unltdnetworx:setDevice' + adapter.config.snipsLanguage.toUpperCase():
                    let deviceTasksToGo = result.slots.length;

                    let arrDeviceSlots = [];
                    let lenDeviceSlots;
                    for (let i in result.slots) {
                        switch (result.slots[i].slotName) {
                            case 'device':
                                lenDeviceSlots = arrDeviceSlots.unshift(result.slots[i])
                            break;
                        default:
                            lenDeviceSlots = arrDeviceSlots.push(result.slots[i])
                        }
                    };

                    if(deviceTasksToGo === 0) {
                        loopDeviceComplete();
                    } else {
                        for (let i in arrDeviceSlots) {
                            switch (arrDeviceSlots[i].slotName) {
                                case 'device':
                                    if(!slotDevice || slotDevice == '') {
                                        slotDevice = arrDeviceSlots[i].value.value;
                                    } else {
                                        slotDevice = slotDevice + " " + arrDeviceSlots[i].value.value;
                                    }
                                    output = output.replace(arrDeviceSlots[i].rawValue, slotDevice)
                                    if(--deviceTasksToGo === 0) {
                                        loopDeviceComplete();
                                    }
                                break;
                                case 'room':
                                    adapter.getState('devices.' + roomid + '.enforceSameRoom', function (err, state) {
                                        if (state === null) {
                                            if(!slotRoom || slotRoom == '') {
                                                slotRoom = arrDeviceSlots[i].value.value;
                                            } else {
                                                slotRoom = slotRoom + ", " + arrDeviceSlots[i].value.value;
                                            }
                                            output = output.replace(arrDeviceSlots[i].rawValue, slotRoom)
                                            if(--deviceTasksToGo === 0) {
                                                loopDeviceComplete();
                                            }
                                        } else if(state.val) {
                                            adapter.getEnums('rooms', (err, res) => {
                                                if (res) {
                                                    let _result = res['enum.rooms'];
                                                    
                                                    for ( let rooms in _result) {
                                                        for (let thingInRoom in _result[rooms].common.members) {
                                                            if(_result[rooms].common.members[thingInRoom] == adapter.namespace + '.devices.' + roomid){
                                                                if(!slotRoom || slotRoom == '') {
                                                                    slotRoom = _result[rooms].common.name[systemLanguage];
                                                                } else {
                                                                    slotRoom = slotRoom + ", " + _result[rooms].common.name[systemLanguage];
                                                                }
                                                            }
                                                        }
                                                    }
                                                    output = output.replace(arrDeviceSlots[i].rawValue, slotRoom)
                                                    if(--deviceTasksToGo === 0) {
                                                        loopDeviceComplete();
                                                    }
                                                } else if (err) {
                                                    adapter.log.warn('No room set for device in objects enumeration.');
                                                    adapter.log.error(err);
                                                    if(--deviceTasksToGo === 0) {
                                                        loopDeviceComplete();
                                                    }
                                                }
                                            });
                                        } else {
                                            if(!slotRoom || slotRoom == '') {
                                                slotRoom = arrDeviceSlots[i].value.value;
                                            } else {
                                                slotRoom = slotRoom + ", " + arrDeviceSlots[i].value.value;
                                            }
                                            output = output.replace(arrDeviceSlots[i].rawValue, slotRoom)
                                            if(--deviceTasksToGo === 0) {
                                                loopDeviceComplete();
                                            }
                                        } 
                                    });
                                break;
                                case 'command':
                                    switch (slotDevice) {
                                        case 'Rollladen':
                                            if (arrDeviceSlots[i].value.value == 'true') {
                                                slotCommand = 'hoch';
                                            } else {
                                                slotCommand = 'runter';
                                            }
                                        break;

                                        case 'Licht':
                                            if (arrDeviceSlots[i].value.value == 'true') {
                                                slotCommand = 'an';
                                            } else {
                                                slotCommand = 'aus';
                                            }
                                        break;

                                        case 'blinds':
                                            if (arrDeviceSlots[i].value.value == 'true') {
                                                slotCommand = 'up';
                                            } else {
                                                slotCommand = 'down';
                                            }
                                        break;
    
                                        case 'light':
                                            if (arrDeviceSlots[i].value.value == 'true') {
                                                slotCommand = 'switch on';
                                            } else {
                                                slotCommand = 'switch off';
                                            }
                                        break;
    
                                        default:
                                            slotCommand = arrDeviceSlots[i].value.value;
                                    }
                                    output = output.replace(arrDeviceSlots[i].rawValue, slotCommand)
                                    if(--deviceTasksToGo === 0) {
                                        loopDeviceComplete();
                                    }
                                break;
                                case 'color':
                                    slotColor = arrDeviceSlots[i].value.value;
                                    output = output.replace(arrDeviceSlots[i].rawValue, slotColor)
                                    if(--deviceTasksToGo === 0) {
                                        loopDeviceComplete();
                                    }
                                break;
                                case 'broadcaster':
                                    slotBroadcast = arrDeviceSlots[i].value.value;
                                    output = output.replace(arrDeviceSlots[i].rawValue, slotBroadcast)
                                    if(--deviceTasksToGo === 0) {
                                        loopDeviceComplete();
                                    }
                                break;
                                case 'genre':
                                    slotGenre = arrDeviceSlots[i].value.value;
                                    output = output.replace(arrDeviceSlots[i].rawValue, slotGenre)
                                    if(--deviceTasksToGo === 0) {
                                        loopDeviceComplete();
                                    }
                                break;
                                case 'interpret':
                                    slotInterpret = arrDeviceSlots[i].value.value;
                                    output = output.replace(arrDeviceSlots[i].rawValue, slotInterpret)
                                    if(--deviceTasksToGo === 0) {
                                        loopDeviceComplete();
                                    }
                                break;
                                case 'value':
                                    slotValue = arrDeviceSlots[i].value.value;
                                    output = output.replace(arrDeviceSlots[i].rawValue, slotValue)
                                    if(--deviceTasksToGo === 0) {
                                        loopDeviceComplete();
                                    }
                                break;
                                case 'unit':
                                    slotValuetype = arrDeviceSlots[i].value.value;
                                    if(--deviceTasksToGo === 0) {
                                        loopDeviceComplete();
                                    }
                                break;
                            }
                        }
                    }
                break;

                case 'hermes/intent/unltdnetworx:getStatus' + adapter.config.snipsLanguage.toUpperCase():
                    let statusTasksToGo = result.slots.length;

                    let arrStatusSlots = [];
                    let lenStatusSlots;
                    for (let i in result.slots) {
                        switch (result.slots[i].slotName) {
                            case 'device':
                                lenStatusSlots = arrStatusSlots.unshift(result.slots[i])
                            break;
                        default:
                            lenStatusSlots = arrStatusSlots.push(result.slots[i])
                        }
                    };

                    if(statusTasksToGo === 0) {
                        loopStatusComplete();
                    } else {
                        for (let i in arrStatusSlots) {
                            switch (arrStatusSlots[i].slotName) {
                                case 'device':
                                    if(!slotDevice || slotDevice == '') {
                                        slotDevice = arrStatusSlots[i].value.value;
                                    } else {
                                        slotDevice = slotDevice + " " + arrStatusSlots[i].value.value;
                                    }
                                    output = output.replace(arrStatusSlots[i].rawValue, slotDevice)
                                    if(--statusTasksToGo === 0) {
                                        loopStatusComplete();
                                    }
                                break;
                                case 'room':
                                    adapter.getState('devices.' + roomid + '.enforceSameRoom', function (err, state) {
                                        if(state.val) {
                                            adapter.getEnums('rooms', (err, res) => {
                                                if (res) {
                                                    let _result = res['enum.rooms'];
                                                    
                                                    for ( let rooms in _result) {
                                                        for (let thingInRoom in _result[rooms].common.members) {
                                                            if(_result[rooms].common.members[thingInRoom] == adapter.namespace + '.devices.' + roomid){
                                                                if(!slotRoom || slotRoom == '') {
                                                                    slotRoom = _result[rooms].common.name[systemLanguage];
                                                                } else {
                                                                    slotRoom = slotRoom + ", " + _result[rooms].common.name[systemLanguage];
                                                                }
                                                            }
                                                        }
                                                    }
                                                    output = output.replace(arrStatusSlots[i].rawValue, slotRoom)
                                                    if(--statusTasksToGo === 0) {
                                                        loopStatusComplete();
                                                    }
                                                } else if (err) {
                                                    adapter.log.warn('No room set for device in objects enumeration.')
                                                    if(--statusTasksToGo === 0) {
                                                        loopStatusComplete();
                                                    }
                                                }
                                            });
                                        } else {
                                            if(!slotRoom || slotRoom == '') {
                                                slotRoom = arrStatusSlots[i].value.value;
                                            } else {
                                                slotRoom = slotRoom + ", " + arrStatusSlots[i].value.value;
                                            }
                                            output = output.replace(arrStatusSlots[i].rawValue, slotRoom)
                                            if(--statusTasksToGo === 0) {
                                                loopStatusComplete();
                                            }
                                        } 
                                    });
                                break;
                                case 'status':
                                    slotStatus = arrStatusSlots[i].value.value;
                                    //output = output.replace(arrStatusSlots[i].rawValue, slotStatus)
                                    if(--statusTasksToGo === 0) {
                                        loopStatusComplete();
                                    }
                                break;
                                case 'duration':
                                    slotDuration = arrStatusSlots[i].value.value;
                                    output = output.replace(arrStatusSlots[i].rawValue, slotDuration)
                                    if(--statusTasksToGo === 0) {
                                        loopStatusComplete();
                                    }
                                break;
                                case 'time':
                                    slotTime = arrStatusSlots[i].value.value;
                                    output = output.replace(arrStatusSlots[i].rawValue, slotTime)
                                    if(--statusTasksToGo === 0) {
                                        loopStatusComplete();
                                    }
                                break;
                            }
                        }
                    }
                break;

                case 'hermes/intent/unltdnetworx:SmallTalk' + adapter.config.snipsLanguage.toUpperCase():
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
