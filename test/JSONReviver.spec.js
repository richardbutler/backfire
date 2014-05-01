var expect      = require('chai').expect;
var JSONReviver = require('../lib/JSONReviver');
var Bindable    = require('../lib/Bindable');
var ArrayList   = require('../lib/ArrayList');

describe('JSONReviver', function() {
    
    it('should revive', function() {
        var data = {
            foo: 'bar',
            bar: { name: 'baz' },
            items: [
                'one',
                { name: 'two', type: 'two-type' },
                [{ name: 'three', number: 3}]
            ]
        };
        var json = JSON.stringify(data);
        var inflated = JSON.parse(json, JSONReviver());
        
        expect(Bindable.isBindable(inflated));
        expect(Bindable.isBindable(inflated.bar));
        expect(inflated.bar.name).to.equal('baz');
        expect(inflated.items instanceof ArrayList);
        expect(inflated.items.length).to.equal(3);
        expect(Bindable.isBindable(inflated.items.at(2)));
        expect(inflated.items.at(2) instanceof ArrayList);
        expect(Bindable.isBindable(inflated.items.at(2).at(0)));
    });
    
});