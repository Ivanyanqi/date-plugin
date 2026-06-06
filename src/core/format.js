export function addPadding(value) {
  return value < 10 ? "0" + value : String(value);
}

export function formatDate(year, month, date, format) {
  var normalized = new Date(year, month - 1, date);
  var safeFormat = format || "YYYY-MM-DD";
  var normalizedYear = normalized.getFullYear();
  var normalizedMonth = addPadding(normalized.getMonth() + 1);
  var normalizedDate = addPadding(normalized.getDate());

  if (safeFormat === "DD/MM/YYYY") {
    return normalizedDate + "/" + normalizedMonth + "/" + normalizedYear;
  }

  if (safeFormat === "MM/DD/YYYY") {
    return normalizedMonth + "/" + normalizedDate + "/" + normalizedYear;
  }

  return normalizedYear + "-" + normalizedMonth + "-" + normalizedDate;
}

export function parseDate(value, format) {
  if (!value) {
    return null;
  }

  var safeFormat = format || "YYYY-MM-DD";
  var match;
  var year;
  var month;
  var date;

  if (safeFormat === "DD/MM/YYYY") {
    match = String(value).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) {
      return null;
    }
    date = Number(match[1]);
    month = Number(match[2]);
    year = Number(match[3]);
  } else if (safeFormat === "MM/DD/YYYY") {
    match = String(value).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) {
      return null;
    }
    month = Number(match[1]);
    date = Number(match[2]);
    year = Number(match[3]);
  } else {
    match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      return null;
    }
    year = Number(match[1]);
    month = Number(match[2]);
    date = Number(match[3]);
  }

  var normalized = new Date(year, month - 1, date);
  if (
    normalized.getFullYear() !== year ||
    normalized.getMonth() + 1 !== month ||
    normalized.getDate() !== date
  ) {
    return null;
  }

  return {
    year: year,
    month: month,
    date: date,
    value: formatDate(year, month, date, safeFormat),
    isoValue: formatDate(year, month, date)
  };
}
