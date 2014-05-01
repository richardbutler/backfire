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
