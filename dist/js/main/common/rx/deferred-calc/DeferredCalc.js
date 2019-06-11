"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DeferredCalc = void 0;

var _timing2 = require("./timing");

class DeferredCalc {
  constructor({
    canBeCalcCallback,
    calcFunc,
    calcCompletedCallback,
    minTimeBetweenCalc,
    throttleTime,
    maxThrottleTime,
    autoInvalidateInterval,
    timing
  }) {
    this._canBeCalcCallback = canBeCalcCallback;
    this._calcFunc = calcFunc;
    this._calcCompletedCallback = calcCompletedCallback;

    if (minTimeBetweenCalc) {
      this._minTimeBetweenCalc = minTimeBetweenCalc;
    }

    if (throttleTime) {
      this._throttleTime = throttleTime;
    }

    if (maxThrottleTime != null) {
      this._maxThrottleTime = maxThrottleTime;
    }

    if (autoInvalidateInterval != null) {
      this._autoInvalidateInterval = autoInvalidateInterval;
    }

    this._timing = timing || _timing2.timingDefault;
    this.invalidate();
  } // region Properties
  // region minTimeBetweenCalc


  get minTimeBetweenCalc() {
    return this._minTimeBetweenCalc;
  }

  set minTimeBetweenCalc(value) {
    if (this._minTimeBetweenCalc === value) {
      return;
    }

    this._minTimeBetweenCalc = value;

    this._pulse();
  } // endregion
  // region throttleTime


  get throttleTime() {
    return this._throttleTime;
  }

  set throttleTime(value) {
    if (this._throttleTime === value) {
      return;
    }

    this._throttleTime = value;

    this._pulse();
  } // endregion
  // region maxThrottleTime


  get maxThrottleTime() {
    return this._maxThrottleTime;
  }

  set maxThrottleTime(value) {
    if (this._maxThrottleTime === value) {
      return;
    }

    this._maxThrottleTime = value;

    this._pulse();
  } // endregion
  // region autoInvalidateInterval


  get autoInvalidateInterval() {
    return this._autoInvalidateInterval;
  }

  set autoInvalidateInterval(value) {
    if (this._autoInvalidateInterval === value) {
      return;
    }

    this._autoInvalidateInterval = value;

    this._pulse();
  } // endregion
  // endregion
  // region Private methods


  _calc() {
    this._timeInvalidateFirst = null;
    this._timeInvalidateLast = null;
    this._canBeCalcEmitted = false;
    this._calcRequested = false;
    this._timeCalcStart = this._timing.now();
    this._timeCalcEnd = null;

    this._pulse();

    this._calcFunc.call(this, () => {
      this._timeCalcEnd = this._timing.now();

      this._calcCompletedCallback.call(this);

      this._pulse();
    });
  }

  _canBeCalc() {
    this._canBeCalcEmitted = true;

    this._canBeCalcCallback.call(this);
  }

  _pulse() {
    // region Timer
    const {
      _timing
    } = this;

    const now = _timing.now();

    let {
      _timeNextPulse: timeNextPulse
    } = this;

    if (timeNextPulse == null) {
      timeNextPulse = now;
    } else if (timeNextPulse <= now) {
      this._timerId = null;
    } // endregion
    // region Auto invalidate


    const {
      _autoInvalidateInterval
    } = this;

    if (_autoInvalidateInterval != null) {
      const autoInvalidateTime = Math.max((this._timeCalcStart || 0) + _autoInvalidateInterval, (this._timeInvalidateLast || 0) + _autoInvalidateInterval, now);

      if (autoInvalidateTime <= now) {
        this._invalidate();
      } else if (autoInvalidateTime > timeNextPulse) {
        timeNextPulse = autoInvalidateTime;
      }
    } // endregion
    // region Can be calc


    if (!this._canBeCalcEmitted && !this._calcRequested && this._timeInvalidateLast && (this._timeCalcEnd || !this._timeCalcStart)) {
      const {
        _throttleTime,
        _maxThrottleTime
      } = this;
      let canBeCalcTime = this._timeInvalidateLast + (_throttleTime || 0);

      if (_maxThrottleTime != null) {
        canBeCalcTime = Math.min(canBeCalcTime, this._timeInvalidateFirst + (_maxThrottleTime || 0));
      }

      if (this._timeCalcEnd) {
        canBeCalcTime = Math.max(canBeCalcTime, this._timeCalcEnd + this._minTimeBetweenCalc || 0);
      }

      if (canBeCalcTime <= now) {
        this._canBeCalc();

        this._pulse();

        return;
      } else if (canBeCalcTime > timeNextPulse) {
        timeNextPulse = canBeCalcTime;
      }
    } // endregion
    // region Calc


    if (this._calcRequested && (this._timeCalcEnd || !this._timeCalcStart)) {
      const {
        _throttleTime,
        _maxThrottleTime
      } = this;
      let calcTime = this._timeInvalidateLast + (_throttleTime || 0);

      if (_maxThrottleTime != null) {
        calcTime = Math.min(calcTime, this._timeInvalidateFirst + (_maxThrottleTime || 0));
      }

      if (this._timeCalcEnd) {
        calcTime = Math.max(calcTime, this._timeCalcEnd + this._minTimeBetweenCalc || 0);
      }

      if (calcTime <= now) {
        this._calc();

        return;
      } else if (calcTime > timeNextPulse) {
        timeNextPulse = calcTime;
      }
    } // endregion
    // region Timer


    if (timeNextPulse > now && timeNextPulse !== this._timeNextPulse) {
      const {
        _timerId: timerId
      } = this;

      if (timerId != null) {
        _timing.clearTimeout(timerId);
      }

      this._timeNextPulse = timeNextPulse;
      this._timerId = _timing.setTimeout(() => this._pulse(), timeNextPulse - now);
    } // endregion

  }

  _invalidate() {
    const now = this._timing.now();

    if (this._timeInvalidateFirst == null) {
      this._timeInvalidateFirst = now;
    }

    this._timeInvalidateLast = now;
  } // endregion
  // region Public methods


  invalidate() {
    this._invalidate();

    this._pulse();
  }

  calc() {
    this._calcRequested = true;

    this._pulse();
  } // endregion


}

exports.DeferredCalc = DeferredCalc;