var chai        = require('chai');
var expect      = chai.expect;
var sinon       = require('sinon');
var Bindable    = require('../lib/Bindable');
var ArrayList   = require('../lib/ArrayList');

chai.config.includeStack = true;

describe('ArrayList', function() {

    describe('bindings', function() {
    
        it('should detect simple changes', function() {
            var Model = Bindable.define({
                name: { writable: true }
            });
            var foo = new Model({ name: 'foo' });
            var bar = new Model({ name: 'bar' });
            var baz = new Model({ name: 'baz' });
            var list = new ArrayList([foo, bar]);
            var add = sinon.spy();
            var change = sinon.spy();
            var update = sinon.spy();
    
            expect(list.at(0)).to.equal(foo);
            expect(list.at(1)).to.equal(bar);
            expect(list.length).to.equal(2);
    
            list.on(ArrayList.ADD, add);
            list.on(ArrayList.CHANGE, change);
            list.on(ArrayList.UPDATE, update);
            list.add(baz);
    
            expect(list.length).to.equal(3);
            
            baz.name = 'BAZ';
            
            sinon.assert.calledOnce(add);
            sinon.assert.calledWith(add);
            sinon.assert.calledTwice(change);
            sinon.assert.calledOnce(update);
        });
        
    });
    
    describe('methods', function() {
        var empty, list, add, remove, change, reset, refresh;
        
        beforeEach(function() {
            add     = sinon.spy();
            remove  = sinon.spy();
            change  = sinon.spy();
            reset   = sinon.spy();
            refresh = sinon.spy();

            empty   = new ArrayList();
            list    = new ArrayList(['one', 'two', 'three']);
            
            list.on(ArrayList.ADD, add);
            list.on(ArrayList.REMOVE, remove);
            list.on(ArrayList.CHANGE, change);
            list.on(ArrayList.RESET, reset);
            list.on(ArrayList.REFRESH, refresh);
        });
        
        it('first', function() {
            expect(empty.first()).to.be.undefined;
            expect(list.first()).to.equal('one');
        });

        it('last', function() {
            expect(empty.last()).to.be.undefined;
            expect(list.last()).to.equal('three');
        });

        it('filter', function() {
            expect(list.filter(function(d) { return d === 'two' })[0]).to.equal('two');
        });

        it('length', function() {
            expect(empty.length).to.equal(0);
            expect(list.length).to.equal(3);
        });

        it('contains', function() {
            expect(empty.contains('foo')).to.be.false;
            expect(list.contains('one')).to.be.true;
            expect(list.contains('ONE')).to.be.false;
        });

        it('at', function() {
            expect(empty.at(17)).to.be.undefined;
            expect(list.at(0)).to.equal('one');
            expect(list.at(2)).to.equal('three');
        });
        
        describe('add', function() {

            var items = ['four', 'five'];

            it('to end', function() {
                list.add(items);

                expect(list.length).to.equal(5);

                sinon.assert.calledWith(add, {
                    type: ArrayList.ADD,
                    items: items,
                    target: list
                });
                sinon.assert.calledOnce(change);
            });

            it('at index', function() {
                list.add(items, 1);
                
                expect(list.join(',')).to.equal(['one', 'four', 'five', 'two', 'three'].join(','));

                sinon.assert.calledWith(add, {
                    type: ArrayList.ADD,
                    items: items,
                    target: list
                });
                sinon.assert.calledOnce(change);
            });
            
        });

        it('remove', function() {
            var items = ['four', 'five'];
            list.add(items);

            expect(list.length).to.equal(5);

            sinon.assert.calledWith(add, {
                type: ArrayList.ADD,
                items: items,
                target: list
            });
            sinon.assert.calledOnce(change);
        });

        it('removeAll', function() {
            var items = list.toArray();
            list.removeAll();
            
            expect(list.length).to.equal(0);

            sinon.assert.calledWith(remove, {
                type: ArrayList.REMOVE,
                items: items,
                target: list
            });
            sinon.assert.calledOnce(change);
        });

        it('push', function() {
            list.push('four', 'five');
            
            expect(list.length).to.equal(5);
            expect(list.last()).to.equal('five');
            
            sinon.assert.calledOnce(add);
            sinon.assert.calledOnce(change);
        });

        it('pop', function() {
            expect(list.pop()).to.equal('three');
            expect(list.join(',')).to.equal(['one', 'two'].join(','));

            sinon.assert.calledOnce(remove);
            sinon.assert.calledOnce(change);
        });

        it('shift', function() {
            expect(list.shift()).to.equal('one');
            expect(list.join(',')).to.equal(['two', 'three'].join(','));

            sinon.assert.calledOnce(remove);
            sinon.assert.calledOnce(change);
        });

        it('unshift', function() {
            list.unshift('minusone', 'zero');

            expect(list.length).to.equal(5);
            expect(list.first()).to.equal('minusone');
            expect(list.last()).to.equal('three');

            sinon.assert.calledOnce(add);
            sinon.assert.calledOnce(change);
        });
    });

});