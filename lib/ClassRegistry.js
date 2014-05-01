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