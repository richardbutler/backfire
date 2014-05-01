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