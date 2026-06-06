function loadLegacyDatePicker() {
  if (window.datepickerinit) {
    return Promise.resolve(window.datepickerinit);
  }

  return import("../date.plugin.ext.js").then(function () {
    return window.datepickerinit;
  });
}

export class DatePicker {
  constructor(input, options) {
    if (!input) {
      throw new Error("DatePicker 需要一个 input 元素");
    }

    this.input = input;
    this.options = options || {};
    this.instance = null;
    this.wrapper = null;
    this.destroyed = false;
    this.ready = loadLegacyDatePicker().then(function (datepickerinit) {
      var instance = datepickerinit.init(input, this.options);
      this.instance = instance;
      this.wrapper = instance.wrapper;
      if (instance.ready && typeof instance.ready.then === "function") {
        return instance.ready.then(function () {
          return instance;
        });
      }
      return instance;
    }.bind(this));
  }

  open() {
    return this.ready.then(function (instance) {
      if (this.destroyed) {
        return;
      }
      return instance.open();
    }.bind(this));
  }

  close() {
    return this.ready.then(function (instance) {
      if (this.destroyed) {
        return;
      }
      return instance.close();
    }.bind(this));
  }

  getValue() {
    return this.input.value;
  }

  setValue(value) {
    this.input.value = value;
    return this.ready.then(function (instance) {
      if (this.destroyed) {
        return value;
      }
      if (typeof instance.setValue === "function") {
        return instance.setValue(value);
      }
      return value;
    }.bind(this));
  }

  setMonth(year, month) {
    return this.ready.then(function (instance) {
      if (this.destroyed) {
        return {
          year: year,
          month: month
        };
      }
      if (typeof instance.setMonth === "function") {
        return instance.setMonth(year, month);
      }
      return {
        year: year,
        month: month
      };
    }.bind(this));
  }

  destroy() {
    return this.ready.then(function (instance) {
      if (this.destroyed) {
        return;
      }
      if (typeof instance.destroy === "function") {
        return instance.destroy().then(function () {
          this.destroyed = true;
          this.wrapper = instance.wrapper;
          this.instance = instance;
        }.bind(this));
      }
      this.destroyed = true;
      this.wrapper = instance.wrapper;
      this.instance = instance;
    }.bind(this));
  }
}
