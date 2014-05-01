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