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