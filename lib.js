'use strict';

var buttonModule = require('buttons');
var ir = require('ir');
var net = require('net');
var flichub = require('flicapp');
var hubinfo = require('hubinfo');

function makeLogger(prefix) {
    var debugMode = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
    return {
        info: function info() {
            for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
                args[_key] = arguments[_key];
            }
            console.log("".concat(prefix, "|INFO| ").concat(args.map(String).join("	")));
        },
        error: function error() {
            for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
                args[_key] = arguments[_key];
            }
            console.log("".concat(prefix, "|ERROR| ").concat(args.map(String).join("	")));
        },
        debug: function debug() {
            for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
                args[_key] = arguments[_key];
            }
            if (debugMode) {
                console.log("".concat(prefix, "|DEBUG| ").concat(args.map(String).join("	")));
            }
        }
    };
}

function _define_property$7(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
function _object_spread$6(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$7(target, key, source[key]);
        });
    }
    return target;
}
var makeOptions$3 = function(opt) {
    return _object_spread$6({
        debug: false
    }, opt);
};

var getDeviceFromButton = function(button) {
    return {
        name: button.name,
        identifiers: [
            button.serialNumber,
            button.uuid
        ],
        manufacturer: "Flic",
        model: "v".concat(button.flicVersion, "_").concat(button.color.trim().length > 0 ? button.color : "white"),
        sw_version: String(button.firmwareVersion),
        hw_version: String(button.flicVersion),
        serial_number: String(button.serialNumber),
        configuration_url: "https://hubsdk.flic.io/"
    };
};
var genButtonUniqueId = function(bdaddr) {
    return bdaddr.replace(/:/g, "_");
};

var ENTITIES = {
    name: [
        "sensor",
        {
            entity_category: "diagnostic",
            name: "Button Name"
        }
    ],
    action: [
        "sensor",
        {
            icon: "mdi:gesture-tap-button",
            name: "Click Action"
        }
    ],
    state: [
        "sensor",
        {
            icon: "mdi:radiobox-indeterminate-variant"
        }
    ],
    battery: [
        "sensor",
        {
            expire_after: 5,
            unit_of_measurement: "%",
            device_class: "battery"
        }
    ],
    connected: [
        "binary_sensor",
        {
            entity_category: "diagnostic",
            expire_after: 5,
            device_class: "connectivity",
            name: "Connection Established",
            payload_not_available: "OFF"
        }
    ],
    ready: [
        "binary_sensor",
        {
            entity_category: "config",
            expire_after: 5,
            device_class: "connectivity",
            name: "Connection Verified"
        }
    ],
    activeDisconnect: [
        "binary_sensor",
        {
            entity_category: "config",
            expire_after: 5,
            name: "User Active Disconnect"
        }
    ],
    passive: [
        "binary_sensor",
        {
            entity_category: "config",
            expire_after: 5,
            name: "Passive Mode"
        }
    ],
    button_short_press: [
        "device_automation",
        {
            type: "button_short_press",
            subtype: "button_1",
            automation_type: "trigger",
            payload: "ON"
        }
    ],
    button_long_press: [
        "device_automation",
        {
            type: "button_long_press",
            subtype: "button_1",
            automation_type: "trigger",
            payload: "ON"
        }
    ],
    button_double_press: [
        "device_automation",
        {
            type: "button_double_press",
            subtype: "button_1",
            automation_type: "trigger",
            payload: "ON"
        }
    ]
};

function _define_property$6(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
function _object_spread$5(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$6(target, key, source[key]);
        });
    }
    return target;
}
var ButtonStateHandler = function(ha, logger) {
    var registerButton = function(button) {
        logger.info("Registering", JSON.stringify(button, null, 4));
        var haDevice = getDeviceFromButton(button);
        var uniqId = genButtonUniqueId(button.bdaddr);
        ha.startLifeLine("Button Controller Connected", uniqId, haDevice);
        Object.keys(ENTITIES).forEach(function(objectId) {
            var avl = {
                availability: [
                    {
                        payload_available: "ON",
                        payload_not_available: "unavailable",
                        topic: ha.genFlicPrefix(genButtonUniqueId(button.bdaddr), "ready")
                    },
                    {
                        payload_available: "ON",
                        payload_not_available: "unavailable",
                        topic: ha.genFlicPrefix(genButtonUniqueId(button.bdaddr), "lifeline")
                    }
                ],
                availability_mode: "all"
            };
            if (objectId === "ready" || objectId == "connected") {
                avl.availability = [
                    avl.availability[1]
                ];
            }
            if (ENTITIES[objectId][0] === "device_automation") {
                avl = {};
            }
            ha.registerEntity("Button ".concat(objectId), ENTITIES[objectId][0], uniqId, objectId, haDevice, _object_spread$5({}, ENTITIES[objectId][1], avl));
        });
    };
    var deregisterButton = function(bdaddr) {
        var uniqId = genButtonUniqueId(bdaddr);
        logger.info("Deregistering", JSON.stringify({
            bdaddr: bdaddr,
            uniqId: uniqId
        }, null, 4));
        Object.keys(ENTITIES).forEach(function(objectId) {
            ha.deregisterEntity(ENTITIES[objectId][0], uniqId, objectId);
        });
    };
    var publishButtonState = function(bdaddr, state) {
        logger.debug('Updating state for bdaddr="'.concat(bdaddr, '" state=').concat(state));
        ha.publishState(genButtonUniqueId(bdaddr), "state", state);
    };
    var publishButtonAction = function(bdaddr, state) {
        var uniqId = genButtonUniqueId(bdaddr);
        ha.publishState(uniqId, "action", state);
        logger.debug('Publishing click for bdaddr="'.concat(bdaddr, '" uniqId="').concat(uniqId, '" state=').concat(state));
        if (state === "click") {
            ha.publishState(uniqId, "button_short_press", "ON");
        } else if (state === "double_click") {
            ha.publishState(uniqId, "button_double_press", "ON");
        } else if (state === "hold") {
            ha.publishState(uniqId, "button_long_press", "ON");
        }
    };
    var publishButtonMeta = function(bdaddr) {
        var button = buttonModule.getButton(bdaddr);
        var uniqId = genButtonUniqueId(button.bdaddr);
        ha.publishState(uniqId, "name", button.name);
        ha.publishState(uniqId, "battery", button.batteryStatus);
        ha.publishState(uniqId, "connected", button.connected ? "ON" : "OFF");
        ha.publishState(uniqId, "ready", button.ready ? "ON" : "OFF");
        ha.publishState(uniqId, "activeDisconnect", button.activeDisconnect ? "ON" : "OFF");
        ha.publishState(uniqId, "passive", button.activeDisconnect ? "ON" : "OFF");
        ha.publishState(uniqId, "lifeline", "ON");
    };
    var handleBtnCreation = function(eventName, obj) {
        var button = buttonModule.getButton(obj.bdaddr);
        logger.info(eventName, "upserting", button.name, genButtonUniqueId(button.bdaddr));
        registerButton(button);
    };
    return {
        addBtn: function(eventName) {
            return function(o) {
                return handleBtnCreation(eventName, o);
            };
        },
        addBtnWithObject: function(eventName) {
            return function(o) {
                return handleBtnCreation(eventName, o.button);
            };
        },
        publishButtonMeta: publishButtonMeta,
        publishButtonAction: publishButtonAction,
        publishButtonState: publishButtonState,
        registerButton: registerButton,
        deregisterButton: deregisterButton
    };
};

function makeButtonController(ha) {
    var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    options = makeOptions$3(options);
    var logger = makeLogger("btnc", options.debug);
    logger.info("Starting Flic ButtonController with", JSON.stringify(options, null, 4));
    var stateHandler = ButtonStateHandler(ha, logger);
    var setListeners = function() {
        var resetActiontInv = null;
        buttonModule.on("buttonAdded", stateHandler.addBtnWithObject("buttonAdded"));
        buttonModule.on("buttonUpdated", stateHandler.addBtnWithObject("buttonUpdated"));
        buttonModule.on("buttonDeleted", function(btn) {
            logger.debug("buttonDeleted", JSON.stringify(btn, null, 4));
            stateHandler.deregisterButton(btn.bdaddr);
            stateHandler.publishButtonMeta(btn.bdaddr);
        });
        buttonModule.on("buttonConnected", stateHandler.addBtn("buttonConnected"));
        buttonModule.on("buttonReady", function(btn) {
            stateHandler.addBtn("buttonReady")(btn);
            stateHandler.publishButtonState(btn.bdaddr, "released");
            stateHandler.publishButtonAction(btn.bdaddr, "none");
        });
        buttonModule.on("buttonDisconnected", function(param) {
            var bdaddr = param.bdaddr;
            stateHandler.publishButtonMeta(bdaddr);
        });
        buttonModule.on("buttonDown", function(param) {
            var bdaddr = param.bdaddr;
            stateHandler.publishButtonState(bdaddr, "pressed");
            stateHandler.publishButtonMeta(bdaddr);
        });
        buttonModule.on("buttonUp", function(param) {
            var bdaddr = param.bdaddr;
            stateHandler.publishButtonState(bdaddr, "released");
            stateHandler.publishButtonMeta(bdaddr);
        });
        buttonModule.on("buttonClickOrHold", function(obj) {});
        buttonModule.on("buttonSingleOrDoubleClickOrHold", function(obj) {
            if (resetActiontInv !== null) {
                clearTimeout(resetActiontInv);
            }
            stateHandler.publishButtonAction(obj.bdaddr, obj.isSingleClick ? "click" : obj.isDoubleClick ? "double_click" : "hold");
            stateHandler.publishButtonMeta(obj.bdaddr);
            resetActiontInv = setTimeout(function() {
                stateHandler.publishButtonAction(obj.bdaddr, "none");
            }, 500);
        });
    };
    var start = function() {
        logger.info("Starting...");
        logger.info("Setting listeners...");
        setListeners();
        logger.info("Registering all buttons...");
        buttonModule.getButtons().forEach(function(btn) {
            return stateHandler.registerButton(btn);
        });
        setInterval(function() {
            logger.debug("Updating button state!");
            buttonModule.getButtons().forEach(function(btn) {
                return stateHandler.publishButtonMeta(btn.bdaddr);
            });
        }, 3000);
        logger.info("is up");
    };
    return {
        start: start,
        publishButtonAction: stateHandler.publishButtonAction,
        publishButtonMeta: stateHandler.publishButtonMeta,
        publishButtonState: stateHandler.publishButtonState
    };
}

function _define_property$5(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
function _object_spread$4(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$5(target, key, source[key]);
        });
    }
    return target;
}
function ownKeys$2(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props$2(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
        ownKeys$2(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
    }
    return target;
}
var makeOptions$2 = function(opt) {
    return _object_spread_props$2(_object_spread$4({
        debug: false
    }, opt), {
        topics: _object_spread$4({
            homeassistant: "homeassistant",
            flic: "flic"
        }, opt.topics)
    });
};

function _define_property$4(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
function _object_spread$3(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$4(target, key, source[key]);
        });
    }
    return target;
}
function ownKeys$1(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props$1(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
        ownKeys$1(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
    }
    return target;
}
function makeHAmqtt(mqttServer) {
    var _options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    var options = makeOptions$2(_options);
    var logger = makeLogger("mqtt:ha", options.debug);
    logger.info("starting...", JSON.stringify(options, null, 4));
    var genFlicPrefix = function(nodeId, objectId) {
        return "".concat(options.topics.flic, "/").concat(nodeId, "/").concat(objectId);
    };
    var genFlicPrefixObject = function(nodeId, objectId) {
        return {
            nodeId: nodeId,
            objectId: objectId,
            mqttPrefix: genFlicPrefix(nodeId, objectId)
        };
    };
    var genHAPrefix = function(component, nodeId, objectId) {
        return "".concat(options.topics.homeassistant, "/").concat(component, "/").concat(nodeId, "/").concat(objectId);
    };
    var publishState = function(nodeId, objectId, state) {
        var opt = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : {};
        var btntopic = genFlicPrefix(nodeId, objectId);
        mqttServer.publish(btntopic, state + "", opt);
        logger.debug(btntopic, state, JSON.stringify(opt));
    };
    var registerEntity = function(name, component, nodeId, objectId, device) {
        var additionalProps = arguments.length > 5 && arguments[5] !== void 0 ? arguments[5] : {};
        var configtopic = genHAPrefix(component, nodeId, objectId) + "/config";
        if (component === "device_automation") {
            additionalProps.topic = genFlicPrefix(nodeId, objectId);
        } else {
            additionalProps.state_topic = genFlicPrefix(nodeId, objectId);
        }
        var configObj = _object_spread_props$1(_object_spread$3({
            name: name
        }, additionalProps), {
            unique_id: "Flic_".concat(nodeId, "_").concat(objectId),
            device: device
        });
        mqttServer.publish(configtopic, JSON.stringify(configObj), {
            retain: true
        });
        logger.debug(configtopic, JSON.stringify(configObj, null, 4));
    };
    var deregisterEntity = function(component, nodeId, objectId) {
        var configtopic = genHAPrefix(component, nodeId, objectId) + "/config";
        mqttServer.publish(configtopic, null, {
            retain: false
        });
        logger.debug(configtopic, null);
    };
    var startLifeLine = function(name, nodeId, haDevice) {
        var topic = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : "lifeline";
        registerEntity(name, "binary_sensor", nodeId, topic, haDevice, {
            device_class: "connectivity",
            expire_after: 5,
            off_delay: 3,
            entity_category: "diagnostic",
            payload_available: "ON",
            payload_not_available: "OFF"
        });
        setInterval(function() {
            publishState(nodeId, topic, "ON");
        }, 2500);
    };
    return {
        deregisterEntity: deregisterEntity,
        registerEntity: registerEntity,
        publishState: publishState,
        genFlicPrefix: genFlicPrefix,
        genFlicPrefixObject: genFlicPrefixObject,
        startLifeLine: startLifeLine
    };
}

function _define_property$3(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
function _object_spread$2(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$3(target, key, source[key]);
        });
    }
    return target;
}
var NODE_ID$1 = "FlicHubIR";
var convertUint32Array2Str = function(arr) {
    var outStr = [];
    for(var i = 0; i < arr.length; i++){
        outStr.push(arr[i].toString(32));
    }
    return outStr.join("_");
};
var makeOptions$1 = function(opt) {
    return _object_spread$2({
        debug: false,
        uniqueId: "0"
    }, opt);
};
var makeIRSharedState = function() {
    var currentSignal = "";
    var isRecording = false;
    return {
        isRecording: function isRecording1() {
            return isRecording;
        },
        setRecordingState: function setRecordingState(newValue) {
            isRecording = newValue;
        },
        currentSignal: function currentSignal1() {
            return currentSignal;
        },
        setCurrentSignal: function setCurrentSignal(newValue) {
            currentSignal = newValue;
        }
    };
};
var getConstants$1 = function(ha, options) {
    var nodeId = "".concat(NODE_ID$1).concat(options.uniqueId);
    var LIFELINE_SGINAL = ha.genFlicPrefixObject(nodeId, "lifeline");
    var RECORD_SIGNAL = ha.genFlicPrefixObject(nodeId, "record");
    var RECORD_SIGNAL_SET = ha.genFlicPrefixObject(nodeId, "record/set");
    var VALUE_SIGNAL_SET = ha.genFlicPrefixObject(nodeId, "signal/set");
    var VALUE_SIGNAL_STATE = ha.genFlicPrefixObject(nodeId, "signal");
    var PLAY_SIGNAL = ha.genFlicPrefixObject(nodeId, "play");
    var PLAY_SIGNAL_SET = ha.genFlicPrefixObject(nodeId, "play/set");
    return {
        NODE_ID: nodeId,
        LIFELINE_SGINAL: LIFELINE_SGINAL,
        RECORD_SIGNAL: RECORD_SIGNAL,
        RECORD_SIGNAL_SET: RECORD_SIGNAL_SET,
        VALUE_SIGNAL_SET: VALUE_SIGNAL_SET,
        VALUE_SIGNAL_STATE: VALUE_SIGNAL_STATE,
        PLAY_SIGNAL: PLAY_SIGNAL,
        PLAY_SIGNAL_SET: PLAY_SIGNAL_SET,
        set_topics: [
            RECORD_SIGNAL_SET,
            VALUE_SIGNAL_SET,
            PLAY_SIGNAL_SET
        ]
    };
};

var registerEntities = function(ha, haDevice, param) {
    var NODE_ID = param.NODE_ID, LIFELINE_SGINAL = param.LIFELINE_SGINAL, RECORD_SIGNAL = param.RECORD_SIGNAL, RECORD_SIGNAL_SET = param.RECORD_SIGNAL_SET, VALUE_SIGNAL_SET = param.VALUE_SIGNAL_SET, VALUE_SIGNAL_STATE = param.VALUE_SIGNAL_STATE, PLAY_SIGNAL = param.PLAY_SIGNAL, PLAY_SIGNAL_SET = param.PLAY_SIGNAL_SET;
    var availability = [
        {
            payload_available: "ON",
            payload_not_available: "unavailable",
            topic: LIFELINE_SGINAL.mqttPrefix
        }
    ];
    ha.startLifeLine("IR Connnected", NODE_ID, haDevice, LIFELINE_SGINAL.objectId);
    ha.registerEntity("Record Signal", "switch", NODE_ID, RECORD_SIGNAL.objectId, haDevice, {
        icon: "mdi:record-rec",
        command_topic: RECORD_SIGNAL_SET.mqttPrefix,
        device_class: "switch",
        availability: availability
    });
    ha.registerEntity("Signal", "text", NODE_ID, VALUE_SIGNAL_STATE.objectId, haDevice, {
        command_topic: VALUE_SIGNAL_SET.mqttPrefix,
        icon: "mdi:broadcast",
        max: 255,
        availability: availability
    });
    ha.registerEntity("Play Signal", "button", NODE_ID, PLAY_SIGNAL.objectId, haDevice, {
        icon: "mdi:play",
        command_topic: PLAY_SIGNAL_SET.mqttPrefix,
        availability: availability
    });
};

var irMQTTHandler = function(mqtt, ha, nodeId, logger, state, param) {
    var RECORD_SIGNAL_SET = param.RECORD_SIGNAL_SET, VALUE_SIGNAL_SET = param.VALUE_SIGNAL_SET, RECORD_SIGNAL = param.RECORD_SIGNAL;
    logger.info("Registering ir mqtt handler ".concat(nodeId, " ").concat(state.currentSignal()));
    mqtt.on("message", function(topic, message) {
        logger.info("message:", JSON.stringify({
            topic: topic,
            message: message,
            state: state,
            currentSignal: state.currentSignal()
        }));
        if (topic === VALUE_SIGNAL_SET.mqttPrefix) {
            state.setCurrentSignal(message);
            logger.info("setting currentSignal", message);
        } else if (topic === RECORD_SIGNAL_SET.mqttPrefix) {
            logger.info("IR module is being set to ".concat(message));
            if (message === "OFF" && state.isRecording()) {
                try {
                    ir.cancelRecord();
                    state.setRecordingState(false);
                } catch (err) {
                    logger.error("Failed to stop record, check you have the latest version of the sdk!");
                    state.setRecordingState(true);
                    ha.publishState(nodeId, RECORD_SIGNAL.objectId, "OFF", {
                        dup: false
                    });
                }
            } else if (!state.isRecording()) {
                ir.record();
                state.setRecordingState(true);
            } else {
                logger.info("Doing nothing state.isRecording()=".concat(state.isRecording(), " state.currentSignal()=").concat(state.currentSignal()));
            }
        }
    });
};

var handleIREvents = function(ha, logger, nodeId, state, param) {
    var VALUE_SIGNAL_STATE = param.VALUE_SIGNAL_STATE, RECORD_SIGNAL = param.RECORD_SIGNAL;
    ir.on("recordComplete", function(data) {
        logger.info("recordComplete", data);
        if (data.length === 0) {
            logger.error("Failed to record any data");
            return;
        }
        var stringMessage = convertUint32Array2Str(data);
        logger.info("recording completed with", JSON.stringify({
            stringMessage: stringMessage
        }));
        state.setCurrentSignal(stringMessage);
        ha.publishState(nodeId, VALUE_SIGNAL_STATE.objectId, stringMessage, {
            retain: true
        });
        state.setRecordingState(false);
        ha.publishState(nodeId, RECORD_SIGNAL.objectId, "OFF");
    });
};

var startIRController = function(ha, mqtt) {
    var _options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
    var options = makeOptions$1(_options);
    var logger = makeLogger("ir", options.debug);
    var haDevice = {
        name: "IR",
        manufacturer: "Flic",
        model: "".concat(NODE_ID$1).concat(options.uniqueId),
        identifiers: [
            "FlicHubIR"
        ],
        configuration_url: "https://hubsdk.flic.io/"
    };
    var constants = getConstants$1(ha, options);
    var nodeId = constants.NODE_ID;
    var state = makeIRSharedState();
    logger.info("starting...");
    logger.debug("setting up entities...");
    registerEntities(ha, haDevice, constants);
    logger.debug("setting default states....");
    ha.publishState(nodeId, constants.RECORD_SIGNAL.objectId, "OFF");
    ha.publishState(nodeId, constants.PLAY_SIGNAL.objectId, "OFF");
    logger.debug("registering events");
    irMQTTHandler(mqtt, ha, nodeId, logger, state, constants);
    handleIREvents(ha, logger, nodeId, state, constants);
    logger.debug("subscribing to", constants.set_topics);
    mqtt.subscribe(constants.set_topics.map(function(x) {
        return x.mqttPrefix;
    }));
    logger.info("is up");
};

/** 'private' constants */ var C = {
    PROTOCOL_LEVEL: 4,
    DEF_PORT: 1883,
    DEF_KEEP_ALIVE: 60,
    DEF_QOS: 0,
    CONNECT_TIMEOUT: 10000,
    PING_INTERVAL: 40
};
/** Control packet types */ var TYPE = {
    CONNECT: 1,
    CONNACK: 2,
    PUBLISH: 3,
    PUBACK: 4,
    PUBREC: 5,
    PUBREL: 6,
    PUBCOMP: 7,
    SUBSCRIBE: 8,
    SUBACK: 9,
    UNSUBSCRIBE: 10,
    UNSUBACK: 11,
    PINGREQ: 12,
    PINGRESP: 13,
    DISCONNECT: 14
};
/**
 Return Codes
 http://docs.oasis-open.org/mqtt/mqtt/v3.1.1/os/mqtt-v3.1.1-os.html#_Toc385349256
 **/ var RETURN_CODES = {
    0: "ACCEPTED",
    1: "UNACCEPTABLE_PROTOCOL_VERSION",
    2: "IDENTIFIER_REJECTED",
    3: "SERVER_UNAVAILABLE",
    4: "BAD_USER_NAME_OR_PASSWORD",
    5: "NOT_AUTHORIZED"
};

/** Generate random UID */ var mqttUid = function() {
    function s4() {
        var numberstring = Math.floor(1 + Math.random() * 10);
        if (numberstring == 10) numberstring = 9;
        numberstring = 97 + numberstring;
        return numberstring;
    }
    return function() {
        var output = [
            0,
            12,
            s4(),
            s4(),
            s4(),
            s4(),
            s4(),
            s4(),
            s4(),
            s4(),
            s4(),
            s4(),
            s4(),
            s4()
        ];
        return output;
    };
}();
/** MQTT string (length MSB, LSB + data) */ var mqttStr = function(s) {
    var payloadarray = [
        s.length >> 8,
        s.length & 255
    ];
    var i = 2;
    var messagearray = s.split("");
    for(var j = 0; j < s.length; j++){
        var _char = messagearray[j];
        var numberrepres = _char.charCodeAt(0);
        payloadarray[i] = numberrepres;
        i = i + 1;
    }
    return payloadarray;
};
var getClientId = function(options) {
    if (typeof options.client_id == "string") {
        return mqttStr(options.client_id);
    }
    return options.client_id;
};
var setOptionDefaults = function(options) {
    return {
        port: options.port || C.DEF_PORT,
        client_id: options.client_id || mqttUid(),
        keep_alive: options.keep_alive || C.DEF_KEEP_ALIVE,
        clean_session: options.clean_session || true,
        username: options.username,
        password: options.password,
        protocol_name: options.protocol_name || "MQTT",
        protocol_level: options.protocol_level || C.PROTOCOL_LEVEL
    };
};
/** MQTT packet length formatter - algorithm from reference docs */ var mqttPacketLength = function(length) {
    var encLength = [];
    var i = 0;
    do {
        var encByte = length & 127;
        length = length >> 7;
        // if there are more data to encode, set the top bit of this byte
        if (length > 0) {
            encByte += 128;
        }
        encLength[i] = encByte;
        i++;
    }while (length > 0);
    return encLength;
};
var mqttPacketLengthDec = function(length) {
    var bytes = 0;
    var decL = 0;
    var lb = 0;
    do {
        lb = length[bytes];
        decL |= (lb & 127) << bytes++ * 7;
    }while (lb & 128 && bytes < 4);
    return {
        decLen: decL,
        lenBy: bytes
    };
};
var createBufferFromArray = function(a) {
    if (Buffer.from) {
        return Buffer.from(a);
    } else {
        return new Buffer(a);
    }
};
/** MQTT standard packet formatter */ var mqttPacket = function(cmd, variable, payload) {
    var cmdAndLengthArray = [
        cmd
    ].concat(mqttPacketLength(variable.length + payload.length));
    var headerAndPayloadArray = cmdAndLengthArray.concat(variable).concat(payload);
    var messageBuffer = createBufferFromArray(headerAndPayloadArray);
    return messageBuffer;
};
/** Get PID from message */ var getPid = function(data) {
    return data.slice(0, 2);
};
/** PUBLISH control packet */ var createMqttPublishPacket = function(topic, message, qos, flags, pid) {
    var cmd = TYPE.PUBLISH << 4 | qos << 1 | flags;
    var variable = mqttStr(topic);
    // Packet id must be included for QOS > 0
    if (qos > 0) {
        var newvariable = variable.concat(pid);
        return mqttPacket(cmd, newvariable, message);
    } else {
        return mqttPacket(cmd, variable, message);
    }
};
/** SUBSCRIBE control packet */ var createMqttSubscribePacket = function(topic, qos, pid) {
    var cmd = TYPE.SUBSCRIBE << 4 | 2;
    var payloadarray = [];
    var i = 0;
    var messagearray = topic.split("");
    for(var j = 0; j < topic.length; j++){
        var _char = messagearray[j];
        var numberrepres = _char.charCodeAt(0);
        payloadarray[i] = numberrepres;
        i = i + 1;
    }
    return mqttPacket(cmd, pid, mqttStr(topic).concat([
        qos
    ]));
};

function _array_like_to_array(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
    return arr2;
}
function _array_without_holes(arr) {
    if (Array.isArray(arr)) return _array_like_to_array(arr);
}
function _class_call_check(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}
function _defineProperties(target, props) {
    for(var i = 0; i < props.length; i++){
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
    }
}
function _create_class(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    return Constructor;
}
function _define_property$2(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
function _iterable_to_array(iter) {
    if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
}
function _non_iterable_spread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _to_consumable_array(arr) {
    return _array_without_holes(arr) || _iterable_to_array(arr) || _unsupported_iterable_to_array(arr) || _non_iterable_spread();
}
function _unsupported_iterable_to_array(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _array_like_to_array(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(n);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _array_like_to_array(o, minLen);
}
var FlicMQTT = /*#__PURE__*/ function() {
    function FlicMQTT(server, _options) {
        _class_call_check(this, FlicMQTT);
        _define_property$2(this, "server", void 0);
        _define_property$2(this, "options", void 0);
        _define_property$2(this, "clientId", void 0);
        _define_property$2(this, "connected", void 0);
        _define_property$2(this, "pingInterval", void 0);
        _define_property$2(this, "username", void 0);
        _define_property$2(this, "password", void 0);
        _define_property$2(this, "client", void 0);
        _define_property$2(this, "__listeners", void 0);
        _define_property$2(this, "pakId", void 0);
        _define_property$2(this, "partData", void 0);
        _define_property$2(this, "ctimo", void 0);
        _define_property$2(this, "pintr", void 0);
        this.server = server;
        this.connected = false;
        this.username = null;
        this.password = null;
        this.client = null;
        this.__listeners = {
            close: [],
            connected: [],
            connect: [],
            disconnected: [],
            end: [],
            error: [],
            data: [],
            publish: [],
            message: [],
            puback: [],
            pubcomp: [],
            subscribed: [],
            unsubscribed: [],
            subscribed_fail: [],
            ping_reply: []
        };
        this.pakId = Math.floor(Math.random() * 65534);
        this.partData = [];
        this.ctimo = null;
        this.pintr = null;
        this.options = setOptionDefaults(_options);
        this.clientId = getClientId(this.options);
        if (this.options.username) {
            this.username = mqttStr(this.options.username);
        }
        if (this.options.password) {
            this.password = mqttStr(this.options.password);
        }
        this.pingInterval = this.options.keep_alive < C.PING_INTERVAL ? this.options.keep_alive - 5 : C.PING_INTERVAL;
    }
    _create_class(FlicMQTT, [
        {
            key: "isConnected",
            value: function isConnected() {
                return this.client !== null;
            }
        },
        {
            key: "on",
            value: function on(type, fn) {
                if (!this.__listeners[type]) {
                    this.__listeners[type] = [];
                }
                this.__listeners[type].push(fn);
            }
        },
        {
            key: "emit",
            value: function emit(type) {
                for(var _len = arguments.length, data = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++){
                    data[_key - 1] = arguments[_key];
                }
                if (this.__listeners[type]) {
                    this.__listeners[type].map(function(fn) {
                        fn.apply(void 0, _to_consumable_array(data));
                    });
                }
            }
        },
        {
            key: "mqttPid",
            value: function mqttPid() {
                this.pakId = this.pakId > 65534 ? 1 : ++this.pakId;
                return [
                    this.pakId >> 8,
                    this.pakId & 0xff
                ];
            }
        },
        {
            key: "connect",
            value: function connect() {
                console.log("Connecting..." + JSON.stringify({
                    connected: this.connected
                }));
                if (this.connected) {
                    return;
                }
                var mqo = this;
                try {
                    var client = this.client = net.createConnection({
                        host: this.server,
                        port: this.options.port
                    }, function() {
                        // write connection message
                        var teststring = mqo.mqttConnect(!!mqo.clientId);
                        client.write(teststring);
                        // handle connection timeout if too slow
                        mqo.ctimo = setTimeout(function() {
                            mqo.ctimo = null;
                            mqo.emit("disconnected");
                            mqo.disconnect();
                        }, C.CONNECT_TIMEOUT);
                        // Incoming data
                        var handler = mqo.packetHandler.bind(mqo);
                        client.on("data", handler);
                        // Socket closed
                        client.on("end", function() {
                            mqo._scktClosed();
                        });
                    });
                } catch (e) {
                    this.client = null;
                    this.emit("error", e.message);
                }
            }
        },
        {
            /** Called internally when the connection closes  */ key: "_scktClosed",
            value: function _scktClosed() {
                if (this.connected) {
                    this.client = null;
                    this.connected = false;
                    if (this.pintr) clearInterval(this.pintr);
                    if (this.ctimo) clearTimeout(this.ctimo);
                    this.pintr = this.ctimo = undefined;
                    this.emit("disconnected");
                    this.emit("close");
                }
            }
        },
        {
            /** Disconnect from server */ key: "disconnect",
            value: function disconnect() {
                if (!this.client) return;
                try {
                    this.client.write(createBufferFromArray([
                        TYPE.DISCONNECT << 4,
                        0
                    ]));
                } catch (e) {
                    return this._scktClosed();
                }
                this.client.end();
                this.client = null;
            }
        },
        {
            /** Create connection flags */ key: "createFlagsForConnection",
            value: function createFlagsForConnection(clean) {
                var flags = 0;
                flags |= this.username ? 0x80 : 0;
                flags |= this.username && this.password ? 0x40 : 0;
                flags |= clean ? 0x02 : 0;
                return flags;
            }
        },
        {
            /** CONNECT control packet
   Clean Session and Userid/Password are currently only supported
   connect flag. Wills are not
   currently supported.
   */ key: "mqttConnect",
            value: function mqttConnect(clean) {
                var cmd = TYPE.CONNECT << 4;
                var flags = this.createFlagsForConnection(clean);
                var keep_alive = [
                    this.options.keep_alive >> 8,
                    this.options.keep_alive & 255
                ];
                /* payload */ var payload = this.clientId;
                if (this.username) {
                    payload = payload.concat(this.username);
                    if (this.password) {
                        payload = payload.concat(this.password);
                    }
                }
                return mqttPacket(cmd, mqttStr(this.options.protocol_name)/*protocol name*/ .concat([
                    this.options.protocol_level
                ])/*protocol level*/ .concat([
                    flags
                ]).concat(keep_alive), payload);
            }
        },
        {
            key: "packetHandler",
            value: function packetHandler(data) {
                if (!this.client) {
                    this.emit("error", "disconnected mid packet handling");
                    throw new Error("disconnected mid packet handling");
                }
                // if we had some data left over from last
                // time, add it on
                if (this.partData && this.partData.length > 0) {
                    data = createBufferFromArray(Array.prototype.slice.call(this.partData).concat(Array.prototype.slice.call(data)));
                    this.partData = [];
                }
                // Figure out packet length...
                var dLen = mqttPacketLengthDec(data.slice(1, data.length));
                var pLen = dLen.decLen + dLen.lenBy + 1;
                // less than one packet?
                if (data.length < pLen) {
                    this.partData = data;
                    return;
                }
                // Get the data for this packet
                var pData = data.slice(1 + dLen.lenBy, pLen);
                // Handle this MQTT packet
                var cmd = data[0];
                var type = cmd >> 4;
                if (type === TYPE.PUBLISH) {
                    var qos = (cmd & 0x6) >> 1;
                    var topic_len = pData[0] << 8 | pData[1];
                    var msg_start = 2 + topic_len + (qos ? 2 : 0);
                    var parsedData = {
                        topic: pData.slice(2, 2 + topic_len).toString("utf8"),
                        message: pData.slice(msg_start, pData.length).toString("utf8"),
                        dup: (cmd & 0x8) >> 3,
                        qos: qos,
                        pid: qos ? pData.slice(2 + topic_len, 4 + topic_len) : 0,
                        retain: cmd & 0x1
                    };
                    if (parsedData.qos) {
                        var _d = (parsedData.qos == 1 ? TYPE.PUBACK : TYPE.PUBREC) << 4;
                        this.client.write([
                            _d,
                            2,
                            parsedData.pid
                        ]);
                    }
                    this.emit("publish", parsedData);
                    this.emit("message", parsedData.topic, parsedData.message);
                } else if (type === TYPE.PUBACK) {
                    this.emit("puback", data.toString().charCodeAt(2) << 8 | data.toString().charCodeAt(3));
                } else if (type === TYPE.PUBREC) {
                    var pubrelArray = [
                        TYPE.PUBREL << 4 | 2,
                        2
                    ];
                    var pidArray = Array.prototype.slice.call(getPid(pData));
                    var pubrecResponse = pubrelArray.concat(pidArray);
                    this.client.write(Buffer.from(pubrecResponse));
                } else if (type === TYPE.PUBREL) {
                    var pubcompArray = [
                        TYPE.PUBCOMP << 4,
                        2
                    ];
                    var pidArray = Array.prototype.slice.call(getPid(pData));
                    var pubrelResponse = pubcompArray.concat(pidArray);
                    this.client.write(pubrelResponse);
                } else if (type === TYPE.PUBCOMP) {
                    this.emit("pubcomp", data.toString().charCodeAt(2) << 8 | data.toString().charCodeAt(3));
                } else if (type === TYPE.SUBACK) {
                    if (pData.length > 0) {
                        if (pData[pData.length - 1] == 0x80) {
                            this.emit("subscribed_fail");
                        } else {
                            this.emit("subscribed");
                        }
                    }
                } else if (type === TYPE.UNSUBACK) {
                    this.emit("unsubscribed");
                } else if (type === TYPE.PINGREQ) {
                    this.client.write([
                        TYPE.PINGRESP << 4,
                        0
                    ]);
                } else if (type === TYPE.PINGRESP) {
                    this.emit("ping_reply");
                } else if (type === TYPE.CONNACK) {
                    if (this.ctimo) clearTimeout(this.ctimo);
                    this.ctimo = undefined;
                    this.partData = [];
                    var returnCode = pData[1];
                    if (RETURN_CODES[returnCode] === "ACCEPTED") {
                        this.connected = true;
                        // start pinging
                        if (this.pintr) clearInterval(this.pintr);
                        this.pintr = setInterval(this.ping.bind(this), this.pingInterval * 1000);
                        // emit connected events
                        this.emit("connected");
                        this.emit("connect");
                    } else {
                        var mqttError = "Connection refused, ";
                        this.connected = false;
                        if (returnCode > 0 && returnCode < 6) {
                            mqttError += RETURN_CODES[returnCode];
                        } else {
                            mqttError += "unknown return code: " + returnCode + ".";
                        }
                        this.emit("error", mqttError);
                    }
                    // more than one packet? re-emit it so we handle it later
                    if (data.length > pLen) {
                        this.client.emit("data", data.slice(pLen, data.length));
                    }
                } else {
                    this.emit("error", "MQTT unsupported packet type: " + type);
                }
            }
        },
        {
            /** Unsubscribe to topic (filter) */ key: "unsubscribe",
            value: function unsubscribe(topic) {
                if (!this.client) return;
                var cmd = TYPE.UNSUBSCRIBE << 4 | 2;
                this.client.write(mqttPacket(cmd, this.mqttPid(), mqttStr(topic)));
            }
        },
        {
            /** Send ping request to server */ key: "ping",
            value: function ping() {
                if (!this.client) return;
                try {
                    this.client.write(Buffer.from([
                        TYPE.PINGREQ << 4,
                        0
                    ]));
                } catch (e) {
                    this._scktClosed();
                }
            }
        },
        {
            /** Publish message using specified topic.
    opts = {
      retain: bool // the server should retain this message and send it out again to new subscribers
      dup : bool   // indicate the message is a duplicate because original wasn't ACKed (QoS > 0 only)
    }
  */ key: "publish",
            value: function publish(topic, message, opts) {
                if (!this.client) return;
                opts = opts || {};
                try {
                    var payloadarray = [];
                    var i = 0;
                    var messagearray = message.split("");
                    for(var j = 0; j < message.length; j++){
                        var _char = messagearray[j];
                        var numberrepres = _char.charCodeAt(0);
                        payloadarray[i] = numberrepres;
                        i = i + 1;
                    }
                    var publishMessage = createMqttPublishPacket(topic, payloadarray, opts.qos || C.DEF_QOS, (opts.retain ? 1 : 0) | (opts.dup ? 8 : 0), this.mqttPid());
                    this.client.write(publishMessage);
                } catch (e) {
                    this._scktClosed();
                }
            }
        },
        {
            /** Subscribe to topic (filter) */ key: "subscribe",
            value: function subscribe(topics) {
                var opts = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
                if (!this.client) return;
                var client = this.client;
                var mqo = this;
                opts = opts || {};
                var subs = [];
                if ("string" === typeof topics) {
                    topics = [
                        topics
                    ];
                }
                if (Array.isArray(topics)) {
                    topics.forEach(function(topic) {
                        subs.push({
                            topic: topic,
                            qos: opts.qos || C.DEF_QOS
                        });
                    });
                } else {
                    Object.keys(topics).forEach(function(k) {
                        subs.push({
                            topic: k,
                            qos: topics[k]
                        });
                    });
                }
                subs.forEach(function(sub) {
                    var subpacket = createMqttSubscribePacket(sub.topic, sub.qos, mqo.mqttPid());
                    client.write(subpacket);
                });
            }
        }
    ]);
    return FlicMQTT;
}();

function _define_property$1(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
function _object_spread$1(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property$1(target, key, source[key]);
        });
    }
    return target;
}
var NODE_ID = "FlicHub";
var makeOptions = function(opt) {
    return _object_spread$1({
        debug: false,
        uniqueId: "0"
    }, opt);
};
var getHADevice = function(options) {
    return {
        name: "FlicHub (".concat(options.uniqueId, ")"),
        manufacturer: "Flic",
        model: "".concat(NODE_ID).concat(options.uniqueId),
        identifiers: [
            "FlicHub"
        ],
        configuration_url: "https://hubsdk.flic.io/",
        sw_version: hubinfo.firmwareVersion,
        serial_number: hubinfo.serialNumber
    };
};
var getConstants = function(ha, options) {
    var nodeId = "".concat(NODE_ID).concat(options.uniqueId);
    return {
        NODE_ID: nodeId,
        LIFELINE_SGINAL: ha.genFlicPrefixObject(nodeId, "lifeline"),
        MESSAGE: ha.genFlicPrefixObject(nodeId, "action-message"),
        COMMAND_TOPIC: function(virtualId) {
            return ha.genFlicPrefixObject(nodeId, "virt-command-".concat(virtualId));
        }
    };
};

var genVirtualDeviceObjectId = function(param) {
    var virtualDeviceId = param.virtualDeviceId, dimmableType = param.dimmableType;
    return "virt-".concat(dimmableType, "-").concat(virtualDeviceId).toLowerCase();
};
var VirtualDeviceType2HAComponent = {
    Blind: "cover",
    Light: "light",
    Speaker: "media_player"
};
var virtualDeviceUpdateHandler = function(ha, logger, haDevice, nodeId, update, commandTopic, availability) {
    var objectId = genVirtualDeviceObjectId(update.metaData);
    var mqttPrefix = ha.genFlicPrefixObject(nodeId, objectId);
    logger.info("Handling update for ".concat(update, " on ").concat(haDevice));
    ha.registerEntity(update.metaData.virtualDeviceId, VirtualDeviceType2HAComponent[update.metaData.dimmableType], mqttPrefix.nodeId, mqttPrefix.objectId, haDevice, {
        availability: availability,
        command_topic: commandTopic
    });
    ha.publishState(mqttPrefix.nodeId, mqttPrefix.objectId, {
        brightness: update.values.brightness * 255
    });
};

var startFlicHubController = function(ha, mqtt) {
    var _options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
    var options = makeOptions(_options);
    var logger = makeLogger("flichub", options.debug);
    var haDevice = getHADevice(options);
    var constants = getConstants(ha, options);
    var availability = [
        {
            payload_available: "ON",
            payload_not_available: "unavailable",
            topic: constants.LIFELINE_SGINAL.mqttPrefix
        }
    ];
    logger.info("starting...");
    logger.debug("setting up entities...");
    ha.startLifeLine("FlicHub Connected", constants.NODE_ID, haDevice, constants.LIFELINE_SGINAL.objectId);
    ha.registerEntity("Action Message", "sensor", constants.NODE_ID, constants.MESSAGE.objectId, haDevice, {
        icon: "mdi:message",
        availability: availability
    });
    ha.publishState(constants.NODE_ID, constants.MESSAGE.objectId, "");
    flichub.on("actionMessage", function(obj) {
        ha.publishState(constants.NODE_ID, constants.MESSAGE.objectId, obj);
    });
    flichub.on("virtualDeviceUpdate", function(update) {
        return virtualDeviceUpdateHandler(ha, logger, haDevice, constants.NODE_ID, update, constants.COMMAND_TOPIC(update.metaData.virtualDeviceId), availability);
    });
};

function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
function _object_spread(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property(target, key, source[key]);
        });
    }
    return target;
}
function ownKeys(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
        ownKeys(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
    }
    return target;
}
var start = function(options) {
    var mqttServer = new FlicMQTT(options.mqtt.host, _object_spread_props(_object_spread({}, options.mqtt), {
        keep_alive: true
    }));
    var _options_debug;
    var logger = makeLogger("root", (_options_debug = options.debug) !== null && _options_debug !== void 0 ? _options_debug : false);
    var _options_ha;
    options.ha = (_options_ha = options.ha) !== null && _options_ha !== void 0 ? _options_ha : {};
    var _options_flicBtns;
    options.flicBtns = (_options_flicBtns = options.flicBtns) !== null && _options_flicBtns !== void 0 ? _options_flicBtns : {};
    var _options_flicIR;
    options.flicIR = (_options_flicIR = options.flicIR) !== null && _options_flicIR !== void 0 ? _options_flicIR : {};
    var _options_flicHub;
    options.flicHub = (_options_flicHub = options.flicHub) !== null && _options_flicHub !== void 0 ? _options_flicHub : {};
    var _options_ha_debug, _ref;
    options.ha.debug = (_ref = (_options_ha_debug = options.ha.debug) !== null && _options_ha_debug !== void 0 ? _options_ha_debug : options.debug) !== null && _ref !== void 0 ? _ref : false;
    var _options_flicBtns_debug, _ref1;
    options.flicBtns.debug = (_ref1 = (_options_flicBtns_debug = options.flicBtns.debug) !== null && _options_flicBtns_debug !== void 0 ? _options_flicBtns_debug : options.debug) !== null && _ref1 !== void 0 ? _ref1 : false;
    var _options_flicIR_debug, _ref2;
    options.flicIR.debug = (_ref2 = (_options_flicIR_debug = options.flicIR.debug) !== null && _options_flicIR_debug !== void 0 ? _options_flicIR_debug : options.debug) !== null && _ref2 !== void 0 ? _ref2 : false;
    var _options_flicHub_debug, _ref3;
    options.flicHub.debug = (_ref3 = (_options_flicHub_debug = options.flicHub.debug) !== null && _options_flicHub_debug !== void 0 ? _options_flicHub_debug : options.debug) !== null && _ref3 !== void 0 ? _ref3 : false;
    var ha = makeHAmqtt(mqttServer, options.ha);
    mqttServer.on("connected", function() {
        var _options_flicBtns, _options_flicIR, _options_flicHub;
        logger.info("connected to mqtt");
        if (!((_options_flicBtns = options.flicBtns) === null || _options_flicBtns === void 0 ? void 0 : _options_flicBtns.disabled)) {
            makeButtonController(ha, options.flicBtns).start();
        }
        if (!((_options_flicIR = options.flicIR) === null || _options_flicIR === void 0 ? void 0 : _options_flicIR.disabled)) {
            startIRController(ha, mqttServer, options.flicIR);
        }
        if (!((_options_flicHub = options.flicHub) === null || _options_flicHub === void 0 ? void 0 : _options_flicHub.disabled)) {
            startFlicHubController(ha, mqttServer, options.flicHub);
        }
        logger.info("all services up!");
    });
    mqttServer.on("error", function(err) {
        logger.info("'Error' event", JSON.stringify(err));
        setTimeout(function() {
            throw new Error("Crashed");
        }, 1000);
    });
    mqttServer.on("disconnected", function() {
        logger.info("Lost access - disconnected");
        setTimeout(function() {
            throw new Error("disconnected");
        }, 1000);
    });
    mqttServer.on("close", function() {
        logger.info("Lost access - close");
        setTimeout(function() {
            throw new Error("closed");
        }, 1000);
    });
    mqttServer.connect();
};

exports.start = start;
