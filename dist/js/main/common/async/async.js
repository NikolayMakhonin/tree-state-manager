"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isThenable = isThenable;
exports.resolveIterator = resolveIterator;
exports.resolveThenable = resolveThenable;
exports.resolveValue = resolveValue;
exports.resolveValueFunc = resolveValueFunc;
exports.ResolveResult = void 0;

var _helpers = require("../helpers/helpers");

function isThenable(value) {
  return value != null && typeof value.then === 'function';
}

let ResolveResult;
exports.ResolveResult = ResolveResult;

(function (ResolveResult) {
  ResolveResult[ResolveResult["None"] = 0] = "None";
  ResolveResult[ResolveResult["Immediate"] = 1] = "Immediate";
  ResolveResult[ResolveResult["Deferred"] = 2] = "Deferred";
  ResolveResult[ResolveResult["Error"] = 4] = "Error";
  ResolveResult[ResolveResult["ImmediateError"] = 5] = "ImmediateError";
  ResolveResult[ResolveResult["DeferredError"] = 6] = "DeferredError";
})(ResolveResult || (exports.ResolveResult = ResolveResult = {}));

function resolveIterator(iterator, isError, onImmediate, onDeferred) {
  if (!(0, _helpers.isIterator)(iterator)) {
    return ResolveResult.None;
  }

  function iterate(nextValue, isThrow, nextOnImmediate, nextOnDeferred) {
    const body = () => {
      while (true) {
        let iteratorResult;

        if (isThrow) {
          isThrow = false;
          iteratorResult = iterator.throw(nextValue);
        } else {
          iteratorResult = iterator.next(nextValue);
        }

        if (iteratorResult.done) {
          nextOnImmediate(iteratorResult.value, isError);
          return isError ? ResolveResult.ImmediateError : ResolveResult.Immediate;
        }

        const result = _resolveValue(iteratorResult.value, isError, (o, nextIsError) => {
          nextValue = o;
          isThrow = nextIsError;
        }, (o, nextIsError) => {
          iterate(o, nextIsError, nextOnDeferred, nextOnDeferred);
        });

        if ((result & ResolveResult.Deferred) !== 0) {
          return result;
        }
      }
    };

    try {
      return body();
    } catch (err) {
      nextOnImmediate(err, true);
      return ResolveResult.ImmediateError;
    }
  }

  return iterate(void 0, false, onImmediate, onDeferred);
}

function resolveThenable(thenable, isError, onImmediate, onDeferred) {
  if (!isThenable(thenable)) {
    return ResolveResult.None;
  }

  let result = isError ? ResolveResult.DeferredError : ResolveResult.Deferred;
  let deferred;
  (thenable.thenLast || thenable.then).call(thenable, value => {
    if (deferred) {
      onDeferred(value, isError);
    } else {
      result = isError ? ResolveResult.ImmediateError : ResolveResult.Immediate;
      onImmediate(value, isError);
    }
  }, err => {
    if (deferred) {
      onDeferred(err, true);
    } else {
      result = ResolveResult.ImmediateError;
      onImmediate(err, true);
    }
  });
  deferred = true;
  return result;
}

function _resolveValue(value, isError, onImmediate, onDeferred) {
  const nextOnImmediate = (o, nextIsError) => {
    if (nextIsError) {
      isError = true;
    }

    value = o;
  };

  const nextOnDeferred = (val, nextIsError) => {
    _resolveValue(val, isError || nextIsError, onDeferred, onDeferred);
  };

  while (true) {
    {
      const result = resolveThenable(value, isError, nextOnImmediate, nextOnDeferred);

      if ((result & ResolveResult.Deferred) !== 0) {
        return result;
      }

      if ((result & ResolveResult.Immediate) !== 0) {
        continue;
      }
    }
    {
      const result = resolveIterator(value, isError, nextOnImmediate, nextOnDeferred);

      if ((result & ResolveResult.Deferred) !== 0) {
        return result;
      }

      if ((result & ResolveResult.Immediate) !== 0) {
        continue;
      }
    }
    onImmediate(value, isError);
    return isError ? ResolveResult.ImmediateError : ResolveResult.Immediate;
  }
}

function resolveValue(value, onImmediate, onDeferred) {
  return _resolveValue(value, false, onImmediate, onDeferred);
}

function resolveValueFunc(func, onImmediate, onDeferred) {
  try {
    return resolveValue(func(), onImmediate, onDeferred);
  } catch (err) {
    onImmediate(err, true);
    return ResolveResult.ImmediateError;
  }
}