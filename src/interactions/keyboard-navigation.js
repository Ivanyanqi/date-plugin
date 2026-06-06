function getDateCells(wrapper) {
  return Array.prototype.slice.call(
    wrapper.querySelectorAll("td[data-date]")
  );
}

function getEnabledDateCells(wrapper) {
  return Array.prototype.slice.call(
    wrapper.querySelectorAll('td[data-date]:not([aria-disabled="true"])')
  );
}

function getFormattedDate(state, cell, formatDate) {
  var explicitValue = cell.getAttribute("data-display-value") ||
    cell.getAttribute("data-value");
  if (explicitValue) {
    return explicitValue;
  }

  return formatDate(
    state.visibleYear,
    state.visibleMonth,
    Number(cell.getAttribute("data-date"))
  );
}

function setFocusedCell(wrapper, state, cell, formatDate) {
  if (!cell) {
    return false;
  }

  var cells = getDateCells(wrapper);
  cells.forEach(function (item) {
    item.setAttribute("tabindex", "-1");
  });

  cell.setAttribute("tabindex", "0");
  cell.focus();
  state.focusedDate = getFormattedDate(state, cell, formatDate);
  return true;
}

export function focusInitialCell(options) {
  var wrapper = options.wrapper;
  var state = options.state;
  var formatDate = options.formatDate;
  var cells = getEnabledDateCells(wrapper);

  if (!cells.length) {
    return false;
  }

  var selectedCell = null;
  if (state.selectedDate) {
    selectedCell = cells.find(function (cell) {
      return getFormattedDate(state, cell, formatDate) === state.selectedDate;
    }) || null;
  }

  var currentMonthCell = cells.find(function (cell) {
    return Number(cell.getAttribute("data-date")) > 0;
  }) || cells[0];

  return setFocusedCell(
    wrapper,
    state,
    selectedCell || currentMonthCell,
    formatDate
  );
}

function moveFocus(options, delta) {
  var wrapper = options.wrapper;
  var state = options.state;
  var formatDate = options.formatDate;
  var cells = getEnabledDateCells(wrapper);

  if (!cells.length) {
    return false;
  }

  var currentIndex = cells.findIndex(function (cell) {
    return cell === wrapper.ownerDocument.activeElement;
  });

  if (currentIndex < 0) {
    currentIndex = cells.findIndex(function (cell) {
      return cell.getAttribute("tabindex") === "0";
    });
  }

  if (currentIndex < 0) {
    currentIndex = 0;
  }

  var nextIndex = currentIndex + delta;
  if (nextIndex < 0) {
    nextIndex = 0;
  }
  if (nextIndex >= cells.length) {
    nextIndex = cells.length - 1;
  }

  return setFocusedCell(wrapper, state, cells[nextIndex], formatDate);
}

export function attachKeyboardNavigation(options) {
  var wrapper = options.wrapper;
  var input = options.input;
  var state = options.state;
  var formatDate = options.formatDate;
  var onEnter = options.onEnter;
  var onEscape = options.onEscape;

  function handleKeydown(event) {
    if (!state.isOpen) {
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      moveFocus({ wrapper: wrapper, state: state, formatDate: formatDate }, 1);
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveFocus({ wrapper: wrapper, state: state, formatDate: formatDate }, -1);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveFocus({ wrapper: wrapper, state: state, formatDate: formatDate }, 7);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveFocus({ wrapper: wrapper, state: state, formatDate: formatDate }, -7);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (typeof onEnter === "function") {
        onEnter(wrapper.ownerDocument.activeElement);
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      if (typeof onEscape === "function") {
        onEscape();
      }
      input.focus();
    }
  }

  wrapper.addEventListener("keydown", handleKeydown, false);

  return function detachKeyboardNavigation() {
    wrapper.removeEventListener("keydown", handleKeydown, false);
  };
}
