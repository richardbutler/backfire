(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// if the module has no dependencies, the above pattern can be simplified to
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.chemical = factory();
    }
})(this, function () {
    return {
        Bindable:       require('./lib/Bindable'),
        ArrayList:      require('./lib/ArrayList'),
        JSONReviver:    require('./lib/JSONReviver'),
        ClassRegistry:  require('./lib/ClassRegistry')
    };
});
},{"./lib/ArrayList":2,"./lib/Bindable":3,"./lib/ClassRegistry":4,"./lib/JSONReviver":6}],2:[function(require,module,exports){
//------------------------------------------------------------------------------
//
//  Dependencies
//
//------------------------------------------------------------------------------

var EventDispatcher = require('./EventDispatcher');
var Bindable        = require('./Bindable');

//------------------------------------------------------------------------------
//
//  Constructor
//
//------------------------------------------------------------------------------

function ArrayList(source) {
    this.reset(source);
}

//------------------------------------------------------------------------------
//
//  Static methods
//
//------------------------------------------------------------------------------

ArrayList.isArrayList = function(value) {
    return value instanceof ArrayList;
};

//------------------------------------------------------------------------------
//
//  Events
//
//------------------------------------------------------------------------------

/**
 * Event: any change happened - add, remove, reset, refresh, update.
 * @type {string}
 */
ArrayList.CHANGE    = 'change';

/**
 * Event: an item, or collection of items, was added.
 * @type {string}
 */
ArrayList.ADD       = 'add';

/**
 * Event: an item, or collection of items, was removed.
 * @type {string}
 */
ArrayList.REMOVE    = 'remove';

/**
 * Event: the collection was reset with new data.
 * @type {string}
 */
ArrayList.RESET     = 'reset';

/**
 * Event: an item within the collection was changed in some way.
 * @type {string}
 */
ArrayList.UPDATE    = 'update';

//------------------------------------------------------------------------------
//
//  ArrayList prototype
//
//------------------------------------------------------------------------------

ArrayList.prototype = Object.create(null, {
    
    //--------------------------------------------------------------------------
    //
    //  Public properties
    //
    //--------------------------------------------------------------------------
    
    source: {
        writable: true,
        enumerable: true
    },
    
    //--------------------------------------------------------------------------
    //
    //  Public methods
    //
    //--------------------------------------------------------------------------
    
    add: {
        writable: false,
        value: function(items, index) {
            var list = this;
            
            items = toArray(items);
            items
                .filter(Bindable.isBindable)
                .forEach(function(item) {
                    item.on(Bindable.CHANGE, list.onItemChange, list);
                });
            
            var args = [typeof index === 'undefined' ? this.source.length : index, 0].concat(items);
            
            this.source.splice.apply(this.source, args);
            this.emitChange({
                type: ArrayList.ADD,
                items: items
            });
        }
    },
    
    push: {
        writable: false,
        value: function() {
            if (arguments.length) {
                this.add([].slice.call(arguments));
            }
        }
    },

    unshift: {
        writable: false,
        value: function() {
            if (arguments.length) {
                this.add([].slice.call(arguments), 0);
            }
        }
    },

    remove: {
        writable: false,
        value: function(items) {
            var list = this;
            var source = this.source;
            
            items = toArray(items).slice();
            items.forEach(function(item) {
                if (Bindable.isBindable(item)) {
                    item.off(Bindable.CHANGE, list.onItemChange, list);
                }
                
                source.splice(source.indexOf(item), 1);
            });
    
            this.emitChange({
                type: ArrayList.REMOVE,
                items: items
            });
        }
    },

    pop: {
        writable: false,
        value: function() {
            var item;
            
            if (this.length) {
                item = this.last();
                this.remove(item);
            }
            
            return item;
        }
    },

    shift: {
        writable: false,
        value: function() {
            var item;

            if (this.length) {
                item = this.first();
                this.remove(item);
            }

            return item;
        }
    },
    
    removeAll: {
        writable: false,
        value: function() {
            this.remove(this.source);
        }
    },
    
    reset: {
        writable: false,
        value: function(items) {
            items = toArray(items);

            this.eventsSuspended = true;
            this.source = [];
            this.add(items);
            this.eventsSuspended = false;
            this.emitChange({ type: ArrayList.RESET });
        }
    },
    
    at: {
        writable: false,
        value: function(index) {
            return this.source[index];
        }
    },
    
    first: {
        writable: false,
        value: function() {
            return this.at(0);
        }
    },

    last: {
        writable: false,
        value: function() {
            return this.length ? this.at(this.length - 1) : undefined;
        }
    },
    
    contains: {
        writable: false,
        value: function(item) {
            return this.indexOf(item) >= 0;
        }
    },
    
    indexOf: {
        writable: false,
        value: function(item) {
            return this.source.indexOf(item);
        }
    },
    
    length: {
        get: function() {
            return this.source ? this.source.length : 0;
        }
    },
    
    toArray: {
        writable: false,
        value: function() {
            return this.source.slice();
        }
    },

    emitChange: {
        writable: false,
        value: function(event) {
            this.emit(event);
            this.emit({
                type: ArrayList.CHANGE,
                relatedEvent: event
            });
        }
    },
    
    //--------------------------------------------------------------------------
    //
    //  Event handlers
    //
    //--------------------------------------------------------------------------
    
    onItemChange: {
        writable: false,
        value: function(event) {
            this.emit({
                type: ArrayList.UPDATE,
                relatedEvent: event
            });
            this.emit({
                type: ArrayList.CHANGE,
                relatedEvent: event
            });
        }
    }
    
});

function proxyMethod(name) {
    Object.defineProperty(ArrayList.prototype, name, {
        writable: false,
        value: function() {
            return Array.prototype[name].apply(this.source, arguments);
        }
    });
}

// Proxy methods to underlying source array
['forEach', 'map', 'filter', 'reduce', 'join'].forEach(proxyMethod);

// Mixin the Emitter
EventDispatcher(ArrayList.prototype);

// Seal the prototype
Object.seal(ArrayList.prototype);

function toArray(items) {
    if (!items) return [];
    return Array.isArray(items) ? items : [items];
}

module.exports = ArrayList;
},{"./Bindable":3,"./EventDispatcher":5}],3:[function(require,module,exports){
var EventDispatcher = require('./EventDispatcher');
var ClassRegistry   = require('./ClassRegistry');

var proto = sanitiseProperties({
    
    eventsSuspended: {
        value: false,
        enumerable: true
    },
    
    emitChange: function(property, newValue, oldValue) {
        if (this.eventsSuspended || oldValue === newValue) return;

        var model       = this;
        var dependents  = this.constructor.getDependents(property);

        this.emit({
            type: Bindable.CHANGE,
            property: property,
            newValue: newValue,
            oldValue: oldValue
        });

        (dependents || []).forEach(function(dependent) {
            model.emit({
                type: Bindable.CHANGE,
                property: dependent,
                newValue: model[dependent]
            });
        });
    },
    
    watch: function(property, handler, context) {
        this.on(Bindable.CHANGE, function(event) {
            if (event.property === property) {
                handler.apply(context || this, arguments);
            }
        }, context);
    },

    set: function(data) {
        var model = this;

        Object.keys(data).forEach(function(key) {
            model[key] = data[key];
        });
    },

    onChildChange: function(event) {
        var model = this;
        var property = Object.keys(this.__values__).filter(function(key) {
            return event.target === model[key];
        })[0];

        if (event.property) {
            property += '.' + event.property;
        }

        this.emit({
            type: Bindable.CHANGE,
            property: property,
            relatedEvent: event
        });
    }
    
});

var statics = sanitiseProperties({

    getDependencies: function(property) {
        return this.schema[property].depends;
    },

    getDependents: function(property) {
        var cls = this;

        // TODO: Cache this?
        return Object.keys(this.schema).reduce(function(dependents, key) {
            var deps = cls.getDependencies(key);

            if (deps && deps.indexOf(property) >= 0) {
                dependents.push(key);
            }

            return dependents;
        }, []);
    }

});

var Bindable = {

    CHANGE: 'change',
    
    isBindable: function(obj) {
        // Duck typing
        return obj && (typeof obj.__values__ !== 'undefined');
    },

    fromObject: function(values) {
        var config = Object.keys(values).reduce(function(config, key) {
            config[key] = { enumerable: true, writable: true, defaultValue: values[key] };
            return config;
        }, {});
        
        var Model = Bindable.define(config);
        return new Model(values);
    },
    
    define: function() {
        var className   = arguments.length >= 2 ? arguments[0] : undefined;
        var schema      = arguments[arguments.length - 1];
        
        // Collate default values
        var defaults = Object.keys(schema).reduce(function(defaults, key) {
            defaults[key] = schema[key].defaultValue;
            return defaults;
        }, {});
        
        function ObjectProxy(attributes) {
            var bindable = this;
            
            Object.defineProperty(this, '__values__', {
                writable: false,
                enumerable: true,
                value: {}
            });
    
            // Suspend events
            this.eventsSuspended = true;
            
            function assign(attributes) {
                if (typeof attributes === 'object') {
                    for (var key in attributes) {
                        if (attributes.hasOwnProperty(key)) {
                            bindable[key] = attributes[key];
                        }
                    }
                }
            }
    
            // Set default values, without triggering events
            assign(defaults);
    
            // Set passed initial values, without triggering events
            assign(attributes);
            
            // Events are okay again
            this.eventsSuspended = false;
        }
        
        // Set constructor
        ObjectProxy.prototype.constructor = ObjectProxy;
    
        // Mixin the Emitter
        EventDispatcher(ObjectProxy.prototype);

        // Create additional properties
        Object.defineProperties(ObjectProxy.prototype, proto);

        // Create additional static properties
        Object.defineProperties(ObjectProxy, statics);
        
        // Attach event triggers to getters and setters
        Object.keys(schema).forEach(function(key) {
            var keyConfig = schema[key];

            Bindable.defineProperty(ObjectProxy.prototype, key, keyConfig);
        });

        // Assign the schema
        ObjectProxy.schema = schema;
        
        // Seal the prototype
        Object.seal(ObjectProxy.prototype);

        // Assign className, if passed
        if (className) {
            ObjectProxy.className = className;
            ClassRegistry.register(className, ObjectProxy);
        }
        
        return ObjectProxy;
    },
    
    defineProperty: function(obj, key, keyConfig) {
        // If we're writable, remove the key as we're rewriting the setter
        delete keyConfig.writable;
        
        var setter = keyConfig['set'];

        // Don't rewrite read-only properties
        if (keyConfig.writable !== false) {
            keyConfig['set'] = function (value) {
                var oldValue = this[key];

                if (isBindableObject(oldValue)) {
                    oldValue.off(Bindable.CHANGE, this.onChildChange, this);
                }

                if (typeof setter === 'function') {
                    setter.apply(this, arguments);
                } else {
                    this.__values__[key] = value;
                }

                if (isBindableObject(value)) {
                    value.on(Bindable.CHANGE, this.onChildChange, this);
                }

                this.emitChange(key, value, oldValue);
            };
        }

        keyConfig['get'] = keyConfig['get'] || function () {
            return this.__values__[key];
        };

        // Kill the default value and assign it as a default
        if (keyConfig.value) {
            // We're creating a property at define-time
            keyConfig.defaultValue = keyConfig.value;
        }

        delete keyConfig.value;
        
        // Define property from config
        Object.defineProperty(obj, key, keyConfig);

        if (obj.__values__) {
            // We're adding a dynamic property at runtime
            obj[key] = keyConfig.defaultValue;
        }
    }
    
};

/**
 * Naively check if an object is bindable - for now, just duck-typing against
 * event dispatching capabilities is enough.
 * 
 * @param {object} value
 * @return {boolean}
 */
function isBindableObject(value) {
    return value && typeof value.on === 'function';
}

/**
 * Ensure properties are compatible with `Object.defineProperties()`.
 *
 * @param {object} properties
 * @return {object}
 */
function sanitiseProperties(properties) {
    Object.keys(properties).forEach(function(property) {
        var config = properties[property];

        if (typeof config !== 'object') {
            properties[property] = {
                value: config,
                enumerable: true
            };
        }
    });

    return properties;
}

module.exports = Bindable;
},{"./ClassRegistry":4,"./EventDispatcher":5}],4:[function(require,module,exports){
var Bindable = require('./Bindable');

var types = {};

var ClassRegistry = {
    createByType: function(type, options) {
        var cls = this.getClass(type);
        return new cls(options);
    },
    register: function(type, cls) {
        types[type.toLowerCase()] = cls;
    },
    getClass: function(type) {
        return types[type.toLowerCase()];
    },
    clear: function() {
        types = {};
    }
};

module.exports = ClassRegistry;
},{"./Bindable":3}],5:[function(require,module,exports){
/**
 * Initialize a new `EventDispatcher`.
 *
 * @api public
 */

function EventDispatcher(obj) {
    if (obj) {
        return mixin(obj);
    }
}

/**
 * Mixin the EventDispatcher properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
    for (var key in EventDispatcher.prototype) {
        obj[key] = EventDispatcher.prototype[key];
    }
    return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @param {Object} [context]
 * @return {EventDispatcher}
 * @api public
 */

EventDispatcher.prototype.on =
EventDispatcher.prototype.addEventListener = function (event, fn, context) {
    this.callbacks = this.callbacks || {};
    (this.callbacks[event] = this.callbacks[event] || [])
        .push({ fn: fn, context: context });
    return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @param {Object} [context]
 * @return {EventDispatcher}
 * @api public
 */

EventDispatcher.prototype.once = function (event, fn, context) {
    var self = this;
    this.callbacks = this.callbacks || {};

    function on() {
        self.off(event, on);
        fn.apply(context || this, arguments);
    }

    on.fn = fn;
    this.on(event, on);
    return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @param {Object} context
 * @return {EventDispatcher}
 * @api public
 */

EventDispatcher.prototype.off =
EventDispatcher.prototype.removeListener =
EventDispatcher.prototype.removeAllListeners =
EventDispatcher.prototype.removeEventListener = function (event, fn, context) {
    this.callbacks = this.callbacks || {};

    // all
    if (0 == arguments.length) {
        this.callbacks = {};
        return this;
    }

    // specific event
    var callbacks = this.callbacks[event];
    if (!callbacks) {
        return this;
    }

    // remove all handlers
    if (1 == arguments.length) {
        delete this.callbacks[event];
        return this;
    }

    // remove specific handler
    var cb;
    for (var i = 0; i < callbacks.length; i++) {
        cb = callbacks[i];
        if (cb.fn === fn && ((!context && !cb.context) || cb.context === context)) {
            callbacks.splice(i, 1);
            break;
        }
    }
    return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {Object} event
 * @return {EventDispatcher}
 */

EventDispatcher.prototype.emit =
EventDispatcher.prototype.dispatchEvent = function (event) {
    this.callbacks = this.callbacks || {};
    var callbacks = this.callbacks[event.type];

    event.target = this;

    if (callbacks) {
        callbacks = callbacks.slice(0);
        for (var i = 0, len = callbacks.length; i < len; ++i) {
            var callback = callbacks[i];
            callback.fn.apply(callback.context || this, arguments);
        }
    }

    return this;
};

/**
 * Check if this EventDispatcher has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

EventDispatcher.prototype.hasListeners = function (event) {
    return !!this.listeners(event).length;
};

module.exports = EventDispatcher;

},{}],6:[function(require,module,exports){
var Bindable        = require('./Bindable');
var ArrayList       = require('./ArrayList');
var ClassRegistry   = require('./ClassRegistry');

function JSONReviver(options) {
    options = options || {};
    
    var typeKey = options.typeKey || '@class';

    function resolveType(value) {
        var type = value[typeKey];
        return type ? ClassRegistry.getClass(type) : undefined;
    }

    return function revive(key, value) {
        if (Array.isArray(value)) {
            return new ArrayList(value);
        }

        if (typeof value === 'object') {
            var Type = resolveType(value);

            return Type ? new Type(value) : Bindable.fromObject(value);
        }

        return value;
    };
}

module.exports = JSONReviver;
},{"./ArrayList":2,"./Bindable":3,"./ClassRegistry":4}]},{},[1])