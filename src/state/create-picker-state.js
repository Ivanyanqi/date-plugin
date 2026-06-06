export function createPickerState(config) {
  var options = config || {};

  return {
    isOpen: false,
    selectedDate: null,
    visibleYear: null,
    visibleMonth: null,
    focusedDate: null,
    inputError: null,
    closeTimer: null,
    openFrame: null,
    inputValue: options.inputValue || "",
    options: options.options || {}
  };
}
