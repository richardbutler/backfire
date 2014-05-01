var chai            = require('chai');
var expect          = chai.expect;
var sinon           = require('sinon');
var Bindable        = require('../lib/Bindable');
var ClassRegistry   = require('../lib/ClassRegistry');

chai.config.includeStack = true;

describe('Bindable', function() {
    
    afterEach(function() {
        ClassRegistry.clear();
    });
    
    describe('simple binding', function() {
    
        var Model;
        var model;
        
        beforeEach(function() {
            Model = Bindable.define('Model', {
                foo: { writable: true }
            });
            model = new Model({ foo: 'bar' });
        });
        
        it('should add the class to the registry', function() {
            expect(Model.className).to.equal('Model');
            expect(ClassRegistry.getClass('Model')).to.equal(Model);
        });
        
        it('should detect simple changes', function() {
            var change = sinon.spy();
    
            expect(model.foo).to.equal('bar');

            var event = {
                type: Bindable.CHANGE,
                property: 'foo',
                newValue: 'baz',
                oldValue: 'bar',
                target: model
            };
            
            model.on(Bindable.CHANGE, change);
            model.foo = 'baz';

            sinon.assert.calledWith(change, event);
        });
        
        it('shouldn\'t fire if the value is the same', function() {
            var changeFoo = sinon.spy();
            
            expect(model.foo).to.equal('bar');
            
            model.on(Bindable.CHANGE, changeFoo);
            model.foo = 'baz';

            expect(model.foo).to.equal('baz');
            sinon.assert.calledOnce(changeFoo);
            
            model.foo = 'baz';

            sinon.assert.calledOnce(changeFoo);
        });
        
    });

    describe('dependencies', function() {

        it('should react to dependencies changing', function() {
            var change = sinon.spy();
            var User = Bindable.define('User', {
                forename: {
                    writable: true
                },
                surname: {
                    writable: true
                },
                name: {
                    writable: false,
                    depends: ['forename', 'surname'],
                    get: function() {
                        return this.forename + ' ' + this.surname;
                    }
                }
            });

            var user = new User({
                forename: 'John',
                surname: 'Smith'
            });

            expect(user.name).to.equal('John Smith');

            user.on(Bindable.CHANGE, change);
            user.forename = 'Paul';

            expect(user.name).to.equal('Paul Smith');

            sinon.assert.calledTwice(change);
            sinon.assert.calledWith(change, {
                type: Bindable.CHANGE,
                property: 'forename',
                oldValue: 'John',
                newValue: 'Paul',
                target: user
            });
            sinon.assert.calledWith(change, {
                type: Bindable.CHANGE,
                property: 'name',
                // oldValue: 'John Smith', // No oldValue for dependent properties
                newValue: 'Paul Smith',
                target: user
            });
        });

    });
    
    describe('child binding', function() {
        
        var User;
        var model;
        var john, paul;
        
        beforeEach(function() {
            User = Bindable.define({
                name: { defaultValue: 'John' },
                age: { defaultValue: 30 }
            });

            john = new User();
            paul = new User({ name: 'Paul', age: 35 });

            model = Bindable.fromObject({
                user: john
            });
        });
        
        it('should remove event handlers when another value is assigned', function() {
            expect(john.callbacks['change']).to.be.an('array');
            expect(john.callbacks['change'].length).to.equal(1);
            
            model.user = paul;
            
            expect(john.callbacks['change'].length).to.equal(0);
            expect(paul.callbacks['change']).to.be.an('array');
            expect(paul.callbacks['change'].length).to.equal(1);
        });

        it('should receive events from child objects', function() {
            var change = sinon.spy();
            
            model.on(Bindable.CHANGE, change);
            model.user.age = 32;
            
            sinon.assert.calledOnce(change);
        });
        
    });
    
});