"use strict";

var _interopRequireWildcard = require("@babel/runtime-corejs3/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

var _indexOf = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/index-of"));

var _module = _interopRequireWildcard(require("./src/module1"));

var _module2 = _interopRequireWildcard(require("./src/module2"));

/* eslint-disable no-duplicate-imports,no-var */
// Test set window.location error. This happens if you use commonjs (cjs).
// noinspection ES6ConvertVarToLetConst
var location = 'http://fake-site.err';
describe('common > env > modules', function () {
  it('babel', function (done) {
    var func1Str = _module.func1.toString().replace(/\s+/g, ' ');

    assert.ok(func1Str);
    assert.strictEqual((0, _module.func1)('qwe', [1, 2]), 'qwe 3 1 2');
    assert.strictEqual((0, _module.func1)('qwe', 1, 2), 'qwe 3 2 3');
    assert.strictEqual((0, _module.func1)('qwe'), 'qwe 3 0 1');
    assert.strictEqual((0, _module.func1)(), 'undefined undefined 0 0');
    assert.strictEqual((0, _module.func1)(null), 'null undefined 0 1');
    assert.ok((0, _indexOf.default)(func1Str).call(func1Str, '.?') < 0, "babel is not worked 1:\r\n".concat(func1Str)); // assert.ok(func1Str.indexOf('arguments.length') >= 0, `babel is not worked 2:\r\n${func1Str}`)
    // assert.ok(func1Str.match(/function func1\(p1\)|function *\((\w|p1)\)/), `babel is not worked 3:\r\n${func1Str}`)
    // console.log(func1.toString());

    done();
  });
  it('import/export', function (done) {
    assert.strictEqual(_module.var1, 'var1');
    assert.strictEqual(_module.default.func1, _module.func1);
    assert.strictEqual(_module.default.var_1_1, _module.var1);
    assert.strictEqual(_module.default.var_1_2, _module.var1);
    assert.strictEqual(_module2.var2, _module.var1);
    assert.strictEqual(_module2.default.func1, _module.func1);
    assert.strictEqual(_module2.default.var_2_1, _module.var1);
    assert.strictEqual(_module2.default.var_2_2, _module.var1);
    done();
  });
});