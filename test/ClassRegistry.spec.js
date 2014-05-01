var chai            = require('chai');
var expect          = chai.expect;
var ClassRegistry   = require('../lib/ClassRegistry');

describe('ClassRegistry', function() {

    afterEach(function() {
        ClassRegistry.clear();
    });
    
    it('should register a class', function() {
        var Model = {};
        ClassRegistry.register('Model', Model);
        
        expect(ClassRegistry.getClass('Model')).to.equal(Model);
        expect(ClassRegistry.getClass('model')).to.equal(Model);
    });
    
});