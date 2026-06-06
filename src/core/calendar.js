export function getMonthAndDate(year, month) {
  var res = [];

  if ((!year || !month) && month !== 0) {
    var today = new Date();
    year = today.getFullYear();
    month = today.getMonth() + 1;
  }

  var firstDayOfMonth = new Date(year, month - 1, 1);
  year = firstDayOfMonth.getFullYear();
  month = firstDayOfMonth.getMonth() + 1;

  var lastDayOfMonth = new Date(year, month, 0);
  var firstDayWeek = firstDayOfMonth.getDay();

  if (firstDayWeek === 0) {
    firstDayWeek = 7;
  }

  var lastMonthDay = new Date(year, month - 1, 0);
  var lastMonthDate = lastMonthDay.getDate();
  var lastMonth = firstDayWeek - 1;
  var daysOfMonth = lastDayOfMonth.getDate() - firstDayOfMonth.getDate() + 1;
  var showDays = daysOfMonth + lastMonth;
  var lineNum = showDays % 7 === 0 ? showDays / 7 : Math.ceil(showDays / 7);

  for (var i = 0; i < 7 * lineNum; i++) {
    var date = i + 1 - lastMonth;
    var showDate = date;
    var thisMonth = month;

    if (date <= 0) {
      showDate = lastMonthDate + date;
      thisMonth = month - 1;
    } else if (date > lastDayOfMonth.getDate()) {
      showDate = date - lastDayOfMonth.getDate();
      thisMonth = month + 1;
    }

    res.push({
      date: date,
      showDate: showDate,
      month: thisMonth
    });
  }

  return {
    year: year,
    month: month,
    dateList: res
  };
}
