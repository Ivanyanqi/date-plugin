function normalizeDateValue(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    var year = value.getFullYear();
    var month = String(value.getMonth() + 1).padStart(2, "0");
    var date = String(value.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + date;
  }

  return String(value);
}

export function isDateSelectable(dateValue, options) {
  var currentValue = normalizeDateValue(dateValue);
  var config = options || {};
  var minDate = normalizeDateValue(config.minDate);
  var maxDate = normalizeDateValue(config.maxDate);
  var disabledDates = (config.disabledDates || []).map(normalizeDateValue);

  if (minDate && currentValue < minDate) {
    return false;
  }

  if (maxDate && currentValue > maxDate) {
    return false;
  }

  if (disabledDates.indexOf(currentValue) >= 0) {
    return false;
  }

  return true;
}
