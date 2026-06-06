export function getWeekdayLabels(locale) {
  var safeLocale = locale || "zh-CN";

  if (safeLocale === "en-US" || safeLocale === "en") {
    return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  }

  return ["一", "二", "三", "四", "五", "六", "七"];
}

export function getActionLabels(locale) {
  var safeLocale = locale || "zh-CN";

  if (safeLocale === "en-US" || safeLocale === "en") {
    return {
      today: "Today",
      clear: "Clear"
    };
  }

  return {
    today: "今天",
    clear: "清空"
  };
}
