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