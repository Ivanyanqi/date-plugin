(function(){
	function createFallbackState(config) {
		var options = config || {};
		return {
			isOpen: false,
			selectedDate: null,
			visibleYear: null,
			visibleMonth: null,
			focusedDate: null,
			inputError: null,
			inputValue: options.inputValue || "",
			options: options.options || {}
		};
	}

	var corePromise = import("./src/core/index.js").then(function(core){
		window.datepicker = {
			getMonthAndDate : core.getMonthAndDate
		};
		return core;
	});
	var statePromise = import("./src/state/create-picker-state.js").then(function(stateModule){
		window.datepickerCreatePickerState = stateModule.createPickerState;
		return stateModule;
	});
	var interactionPromise = import("./src/interactions/keyboard-navigation.js").then(function(interactionModule){
		window.datepickerKeyboardNavigation = interactionModule;
		return interactionModule;
	});
	window.datepickerCoreReady = Promise.all([corePromise, statePromise, interactionPromise]);
	var scrollLockCount = 0;
	var previousBodyOverflow = "";
	var previousBodyTouchAction = "";
	var mobileSheetTransitionMs = 180;

	function withCore(callback) {
		return corePromise.then(callback);
	}

	function withInteractions(callback) {
		return interactionPromise.then(callback);
	}

	function ensureInputA11y(input) {
		input.setAttribute("aria-haspopup", "dialog");
		input.setAttribute("aria-expanded", "false");
		input.setAttribute("aria-invalid", "false");
	}

	function setExpandedState(input, expanded) {
		input.setAttribute("aria-expanded", expanded ? "true" : "false");
	}

	function setInvalidState(input, invalid) {
		input.setAttribute("aria-invalid", invalid ? "true" : "false");
	}

	function invokeHook(callback) {
		if (typeof callback !== "function") {
			return;
		}

		var args = Array.prototype.slice.call(arguments, 1);
		callback.apply(null, args);
	}

	function lockBodyScroll() {
		if (scrollLockCount === 0) {
			previousBodyOverflow = document.body.style.overflow;
			previousBodyTouchAction = document.body.style.touchAction;
			document.body.style.overflow = "hidden";
			document.body.style.touchAction = "none";
		}
		scrollLockCount++;
	}

	function unlockBodyScroll() {
		if (scrollLockCount === 0) {
			return;
		}
		scrollLockCount--;
		if (scrollLockCount === 0) {
			document.body.style.overflow = previousBodyOverflow;
			document.body.style.touchAction = previousBodyTouchAction;
		}
	}

	function setOpenState(node, value) {
		if (!node) {
			return;
		}
		node.setAttribute("data-open-state", value);
	}

	function clearPresentationTimers(state) {
		if (state.closeTimer) {
			window.clearTimeout(state.closeTimer);
			state.closeTimer = null;
		}
		if (state.openFrame) {
			window.cancelAnimationFrame(state.openFrame);
			state.openFrame = null;
		}
	}

	function getDefaultOptions(options) {
		var config = options || {};
		return {
			locale: config.locale || "zh-CN",
			format: config.format || "YYYY-MM-DD",
			defaultValue: config.defaultValue || "",
			minDate: config.minDate || null,
			maxDate: config.maxDate || null,
			disabledDates: config.disabledDates || [],
			allowManualInput: config.allowManualInput !== false,
			closeOnSelect: config.closeOnSelect !== false,
			showToday: !!config.showToday,
			showClear: !!config.showClear,
			onOpen: config.onOpen || null,
			onClose: config.onClose || null,
			onChange: config.onChange || null,
			onMonthChange: config.onMonthChange || null,
			onInputError: config.onInputError || null
		};
	}

	function emitOpen(input, state) {
		invokeHook(state.options.onOpen, {
			value: input.value,
			state: state
		});
	}

	function emitClose(input, state, source) {
		invokeHook(state.options.onClose, {
			value: input.value,
			source: source || "api",
			state: state
		});
	}

	function emitChange(input, state, source, parsed) {
		invokeHook(state.options.onChange, input.value, {
			source: source || "api",
			parsed: parsed || null,
			state: state
		});
	}

	function emitMonthChange(state, source) {
		invokeHook(state.options.onMonthChange, {
			source: source || "api",
			year: state.visibleYear,
			month: state.visibleMonth,
			state: state
		});
	}

	function emitInputError(state, value, source) {
		invokeHook(state.options.onInputError, {
			value: value,
			source: source || "input",
			format: state.options.format,
			state: state
		});
	}

	function getTodayParts() {
		var today = new Date();
		return {
			year: today.getFullYear(),
			month: today.getMonth() + 1,
			date: today.getDate()
		};
	}

	function isMobileViewport(viewportWidth) {
		return viewportWidth <= 640;
	}

	function prefersReducedMotion() {
		return !!(
			window.matchMedia &&
			window.matchMedia("(prefers-reduced-motion: reduce)").matches
		);
	}

	function positionPicker(input, warpper) {
		var rect = input.getBoundingClientRect();
		var scrollX = window.pageXOffset || window.scrollX || 0;
		var scrollY = window.pageYOffset || window.scrollY || 0;
		var viewportWidth = document.documentElement.clientWidth || window.innerWidth;
		var viewportHeight = document.documentElement.clientHeight || window.innerHeight;
		var panelWidth = warpper.offsetWidth || 280;
		var panelHeight = warpper.offsetHeight || 0;
		var gap = 8;
		var mobile = isMobileViewport(viewportWidth);
		var placement = "bottom";

		warpper.setAttribute("data-mobile", mobile ? "true" : "false");

		if (mobile) {
			warpper.style.position = "fixed";
			warpper.style.left = gap + "px";
			warpper.style.right = gap + "px";
			warpper.style.bottom = gap + "px";
			warpper.style.top = "auto";
			warpper.style.width = Math.max(280, viewportWidth - gap * 2) + "px";
			warpper.style.maxWidth = Math.max(280, viewportWidth - gap * 2) + "px";
			warpper.setAttribute("data-placement", "sheet");
			return;
		}

		warpper.style.position = "absolute";
		warpper.style.right = "auto";
		warpper.style.bottom = "auto";
		warpper.style.width = "";
		warpper.style.maxWidth = "";
		var minLeft = scrollX + gap;
		var maxLeft = scrollX + viewportWidth - panelWidth - gap;
		var left = scrollX + rect.left;
		if (left < minLeft) {
			left = minLeft;
		}
		if (left > maxLeft) {
			left = Math.max(minLeft, maxLeft);
		}

		var top = scrollY + rect.bottom + gap;
		var bottomEdge = rect.bottom + gap + panelHeight;
		if (panelHeight && bottomEdge > viewportHeight && rect.top > panelHeight + gap) {
			top = scrollY + rect.top - panelHeight - gap;
			placement = "top";
		}

		warpper.style.left = left + "px";
		warpper.style.top = top + "px";
		warpper.setAttribute("data-placement", placement);
	}

	function setBackdropState(backdrop, visible, openState) {
		if (!backdrop) {
			return;
		}
		if (!!backdrop.__active === !!visible) {
			if (openState) {
				setOpenState(backdrop, openState);
			}
			return;
		}

		backdrop.__active = !!visible;
		if (visible) {
			backdrop.classList.add("date-plugin-backdrop-show");
			backdrop.setAttribute("aria-hidden", "false");
			setOpenState(backdrop, openState || "open");
			lockBodyScroll();
			return;
		}

		backdrop.classList.remove("date-plugin-backdrop-show");
		backdrop.setAttribute("aria-hidden", "true");
		setOpenState(backdrop, openState || "closed");
		unlockBodyScroll();
	}

	function isSheetMode(warpper) {
		return warpper.getAttribute("data-placement") === "sheet" &&
			warpper.getAttribute("data-mobile") === "true";
	}

	function syncMobilePresentation(warpper, state) {
		var backdrop = warpper.__datepickerBackdrop;
		var mobile = warpper.getAttribute("data-mobile") === "true";
		var active = mobile && state.isOpen;
		var reducedMotion = prefersReducedMotion();
		warpper.setAttribute("data-reduced-motion", reducedMotion ? "true" : "false");
		if (backdrop) {
			backdrop.setAttribute("data-reduced-motion", reducedMotion ? "true" : "false");
		}
		warpper.setAttribute("data-safe-area", mobile ? "true" : "false");
		if (active) {
			setBackdropState(backdrop, true, backdrop.getAttribute("data-open-state") || "open");
		} else if (!state.closeTimer) {
			setBackdropState(backdrop, false, "closed");
		}
		warpper.setAttribute("aria-modal", active ? "true" : "false");
	}

	function syncInputValue(input, state, config) {
		var options = config || {};
		var value = options.hasOwnProperty("value") ? options.value : input.value;
		var source = options.source || "input";
		state.inputValue = value;

		if (!value) {
			state.selectedDate = null;
			state.focusedDate = null;
			state.inputError = null;
			setInvalidState(input, false);
			if (options.emitChange) {
				emitChange(input, state, source, null);
			}
			return Promise.resolve({
				valid: true,
				empty: true,
				value: value
			});
		}

		return withCore(function(core){
			var parsed = core.parseDate(value, state.options.format);
			if (parsed) {
				state.selectedDate = parsed.value;
				state.focusedDate = parsed.value;
				state.visibleYear = parsed.year;
				state.visibleMonth = parsed.month;
				state.inputError = null;
				setInvalidState(input, false);
				if (options.emitChange) {
					emitChange(input, state, source, parsed);
				}
				return {
					valid: true,
					parsed: parsed,
					value: parsed.value
				};
			}

			state.selectedDate = null;
			state.focusedDate = null;
			state.inputError = {
				value: value,
				source: source
			};
			setInvalidState(input, true);
			if (options.emitError) {
				emitInputError(state, value, source);
			}
			return {
				valid: false,
				value: value
			};
		});
	}

	var datepickerinit = {};
	datepickerinit.buildUI = function(warpper, state, toDate) {
		return withCore(function(core){
			if ((state.visibleYear === null || state.visibleMonth === null) && state.inputValue) {
				var parsed = core.parseDate(state.inputValue, state.options.format);
				if (parsed) {
					state.visibleYear = parsed.year;
					state.visibleMonth = parsed.month;
					state.selectedDate = parsed.value;
				}
			}

			if (toDate) {
				if (toDate === "prev") state.visibleMonth--;
				else if (toDate === "next") state.visibleMonth++;
			}
			var data = core.getMonthAndDate(state.visibleYear, state.visibleMonth);
			state.visibleYear = data.year;
			state.visibleMonth = data.month;
			var weekdayLabels = core.getWeekdayLabels(state.options.locale);
			var actionLabels = core.getActionLabels(state.options.locale);
			var todayParts = getTodayParts();
			var todayIso = core.formatDate(todayParts.year, todayParts.month, todayParts.date);
			var todayDisplay = core.formatDate(
				todayParts.year,
				todayParts.month,
				todayParts.date,
				state.options.format
			);
			var todaySelectable = core.isDateSelectable(todayIso, state.options);
			var html = '<div class="date-plugin-ui-hearder">'+
					'<sapn class="date-plugin-btn date-plugin-prev-btn">&lt;</sapn>'+
					'<sapn class="date-plugin-btn date-plugin-next-btn">&gt;</sapn>'+
					'<sapn class="data-plugin-month">'+ state.visibleYear+'-'+ core.addPadding(state.visibleMonth) +'</sapn>'+
				'</div>'+
				'<div class="date-plugin-ui-body">'+
					'<table role="grid">'+
						'<thead>'+
							'<tr>'+
								'<th>'+ weekdayLabels[0] +'</th>'+
								'<th>'+ weekdayLabels[1] +'</th>'+
								'<th>'+ weekdayLabels[2] +'</th>'+
								'<th>'+ weekdayLabels[3] +'</th>'+
								'<th>'+ weekdayLabels[4] +'</th>'+
								'<th>'+ weekdayLabels[5] +'</th>'+
								'<th>'+ weekdayLabels[6] +'</th>'+
							'</tr>'+
						'</thead>'+
					'<tbody>';
			var len = data.dateList.length;
			for (var i = 0; i < len; i++) {
				var cellValue = core.formatDate(state.visibleYear, state.visibleMonth, data.dateList[i].date);
				var displayValue = core.formatDate(
					state.visibleYear,
					state.visibleMonth,
					data.dateList[i].date,
					state.options.format
				);
				var selectable = core.isDateSelectable(cellValue, state.options);
				var disabledAttr = selectable ? "" : ' aria-disabled="true"';
				var classNames = [];
				var isSelected = displayValue === state.selectedDate;
				var isOutside = data.dateList[i].month !== state.visibleMonth;
				var isToday = cellValue === todayIso;
				if (data.dateList[i].month !== state.visibleMonth) {
					classNames.push("date-plugin-cell-outside");
				}
				if (isSelected) {
					classNames.push("date-plugin-cell-selected");
				}
				if (isToday) {
					classNames.push("date-plugin-cell-today");
				}
				if (!selectable) {
					classNames.push("date-plugin-cell-disabled");
				}
				var classAttr = classNames.length ? ' class="' + classNames.join(" ") + '"' : "";
				var selectedAttr = ' aria-selected="' + (isSelected ? "true" : "false") + '"';
				var outsideAttr = ' data-outside="' + (isOutside ? "true" : "false") + '"';
				var currentAttr = isToday ? ' aria-current="date"' : "";
				if (i % 7 == 0) {
					html += "<tr>";
				}
				html += '<td data-date="'+ data.dateList[i].date +'" data-value="'+ cellValue +'" data-display-value="'+ displayValue +'" tabindex="-1" role="gridcell"' + disabledAttr + selectedAttr + outsideAttr + currentAttr + classAttr + ">" + data.dateList[i].showDate + "</td>";
				if (i % 7 == 6) {
					html += "</tr>";
				}
			}
			html += "</tbody></table></div>";
			if (state.options.showToday || state.options.showClear) {
				html += '<div class="date-plugin-ui-footer">';
				if (state.options.showClear) {
					html += '<button type="button" class="date-plugin-action-btn" data-action="clear">' + actionLabels.clear + "</button>";
				}
				if (state.options.showToday) {
					html += '<button type="button" class="date-plugin-action-btn" data-action="today" data-value="' + todayDisplay + '"' +
						(todaySelectable ? "" : " disabled") + ">" + actionLabels.today + "</button>";
				}
				html += "</div>";
			}
			warpper.innerHTML = html;
		});
	};

	function hideWarpper(currentWarpper) {
		var warppers = document.querySelectorAll(".date-plugin-ui-warpper");
		Array.prototype.forEach.call(warppers, function(item){
			if (item === currentWarpper) {
				return;
			}
			if (item.__datepickerController) {
				item.__datepickerController.close({
					restoreFocus: false,
					source: "outside"
				});
				return;
			}
			item.classList.remove("date-plugin-ui-warpper-show");
			if (item.__datepickerState) {
				item.__datepickerState.isOpen = false;
			}
		});
	}

	function finishClose(input, warpper, state, config, wasOpen, resolve) {
		warpper.classList.remove("date-plugin-ui-warpper-show");
		state.closeTimer = null;
		syncMobilePresentation(warpper, state);
		setOpenState(warpper, "closed");
		if (config.restoreFocus !== false) {
			input.focus();
		}
		if (wasOpen && !config.silentHook) {
			emitClose(input, state, config.source);
		}
		if (typeof resolve === "function") {
			resolve();
		}
	}

	function applyVisibleMonth(state, year, month) {
		return withCore(function(core){
			var normalized = core.getMonthAndDate(year, month);
			state.visibleYear = normalized.year;
			state.visibleMonth = normalized.month;
			return {
				year: normalized.year,
				month: normalized.month
			};
		});
	}

	function closePicker(input, warpper, state, options) {
		var config = options || {};
		var wasOpen = state.isOpen || warpper.classList.contains("date-plugin-ui-warpper-show");
		clearPresentationTimers(state);
		state.isOpen = false;
		setExpandedState(input, false);
		if (isSheetMode(warpper) && wasOpen && !config.skipAnimation && !prefersReducedMotion()) {
			setOpenState(warpper, "closing");
			setBackdropState(warpper.__datepickerBackdrop, true, "closing");
			return new Promise(function(resolve){
				state.closeTimer = window.setTimeout(function(){
					finishClose(input, warpper, state, config, wasOpen, resolve);
				}, mobileSheetTransitionMs);
			});
		}
		finishClose(input, warpper, state, config, wasOpen);
		return Promise.resolve();
	}

	function focusCurrentCell(warpper, state, keyboardApi) {
		if (!keyboardApi) {
			return Promise.resolve(false);
		}

		return withCore(function(core){
			return keyboardApi.focusInitialCell({
				wrapper: warpper,
				state: state,
				formatDate: function(year, month, date) {
					return core.formatDate(year, month, date, state.options.format);
				}
			});
		});
	}

	function refreshPickerUI(warpper, state, keyboardApi, shouldFocus) {
		return datepickerinit.buildUI(warpper, state).then(function(){
			if (warpper.__datepickerInput) {
				positionPicker(warpper.__datepickerInput, warpper);
			}
			syncMobilePresentation(warpper, state);
			if (!shouldFocus) {
				return false;
			}
			return focusCurrentCell(warpper, state, keyboardApi);
		});
	}

	function openPicker(input, warpper, state, keyboardApi) {
		hideWarpper(warpper);
		clearPresentationTimers(state);
		warpper.classList.add("date-plugin-ui-warpper-show");
		setOpenState(warpper, "opening");
		setExpandedState(input, true);
		state.isOpen = true;

		return syncInputValue(input, state, {
			value: input.value,
			source: "input",
			emitChange: false,
			emitError: false
		}).then(function(){
			return refreshPickerUI(warpper, state, keyboardApi, true);
		}).then(function(){
			if (isSheetMode(warpper) && !prefersReducedMotion()) {
				setBackdropState(warpper.__datepickerBackdrop, true, "opening");
				state.openFrame = window.requestAnimationFrame(function(){
					state.openFrame = window.requestAnimationFrame(function(){
						state.openFrame = null;
						if (!state.isOpen) {
							return;
						}
						setOpenState(warpper, "open");
						setBackdropState(warpper.__datepickerBackdrop, true, "open");
					});
				});
			} else {
				setOpenState(warpper, "open");
				if (isSheetMode(warpper)) {
					setBackdropState(warpper.__datepickerBackdrop, true, "open");
				}
			}
			emitOpen(input, state);
			return warpper;
		});
	}

	datepickerinit.init = function(input, options){
		var warpper = document.createElement("div");
		var stateFactory = window.datepickerCreatePickerState || createFallbackState;
		var normalizedOptions = getDefaultOptions(options);
		if (!input.value && normalizedOptions.defaultValue) {
			input.value = normalizedOptions.defaultValue;
		}
		input.readOnly = !normalizedOptions.allowManualInput;

		var state = stateFactory({
			inputValue: input.value,
			options: normalizedOptions
		});
		ensureInputA11y(input);
		warpper.setAttribute("class", "date-plugin-ui-warpper");
		warpper.setAttribute("role", "dialog");
		warpper.setAttribute("aria-label", "Date picker");
		warpper.setAttribute("aria-modal", "false");
		warpper.__datepickerState = state;
		warpper.__datepickerInput = input;
		var backdrop = document.createElement("div");
		backdrop.setAttribute("class", "date-plugin-backdrop");
		backdrop.setAttribute("aria-hidden", "true");
		backdrop.setAttribute("data-open-state", "closed");
		backdrop.__active = false;
		warpper.__datepickerBackdrop = backdrop;
		document.body.appendChild(backdrop);
		document.body.appendChild(warpper);

		var keyboardApi = null;
		function handleWindowPositionChange() {
			if (state.isOpen) {
				positionPicker(input, warpper);
				syncMobilePresentation(warpper, state);
				if (!isSheetMode(warpper)) {
					setOpenState(warpper, "open");
				}
			}
		}

		var ready = Promise.all([
			syncInputValue(input, state, {
				value: input.value,
				source: "init",
				emitChange: false,
				emitError: false
			}),
			datepickerinit.buildUI(warpper, state),
			withInteractions(function(interactions){
				keyboardApi = interactions;
				return withCore(function(core){
					interactions.attachKeyboardNavigation({
						wrapper: warpper,
						input: input,
						state: state,
						formatDate: function(year, month, date) {
							return core.formatDate(year, month, date, state.options.format);
						},
						onEnter: function(activeElement) {
							if (activeElement && activeElement.tagName.toLowerCase() === "td") {
								activeElement.click();
							}
						},
						onEscape: function() {
							closePicker(input, warpper, state, {
								source: "escape"
							});
						}
					});
				});
			})
		]);

		warpper.__datepickerController = {
			close: function(config) {
				closePicker(input, warpper, state, config);
			}
		};
		backdrop.addEventListener("click", function(e){
			e.stopPropagation();
			if (!state.isOpen) {
				return;
			}
			closePicker(input, warpper, state, {
				restoreFocus: false,
				source: "overlay"
			});
		}, false);

		warpper.addEventListener("click", function(e){
			e.stopPropagation();
			var target = e.target;
			if (target.classList.contains("date-plugin-prev-btn")) {
				var previousYear = state.visibleYear;
				var previousMonth = state.visibleMonth;
				state.visibleMonth--;
				refreshPickerUI(warpper, state, keyboardApi, state.isOpen).then(function(){
					if (state.visibleYear !== previousYear || state.visibleMonth !== previousMonth) {
						emitMonthChange(state, "prev");
					}
				});
				return;
			}
			if (target.classList.contains("date-plugin-next-btn")) {
				var lastYear = state.visibleYear;
				var lastMonth = state.visibleMonth;
				state.visibleMonth++;
				refreshPickerUI(warpper, state, keyboardApi, state.isOpen).then(function(){
					if (state.visibleYear !== lastYear || state.visibleMonth !== lastMonth) {
						emitMonthChange(state, "next");
					}
				});
				return;
			}
			if (target.tagName.toLowerCase() === "td") {
				if (target.getAttribute("aria-disabled") === "true") {
					return;
				}

				var selectedValue = target.getAttribute("data-display-value") || target.getAttribute("data-value");
				input.value = selectedValue;
				syncInputValue(input, state, {
					value: selectedValue,
					source: "select",
					emitChange: true,
					emitError: true
				}).then(function(){
					if (state.options.closeOnSelect !== false) {
						closePicker(input, warpper, state, {
							source: "select"
						});
						return;
					}
					return refreshPickerUI(warpper, state, keyboardApi, true);
				});
				return;
			}
			if (target.getAttribute("data-action") === "today") {
				if (target.disabled) {
					return;
				}
				var todayValue = target.getAttribute("data-value");
				input.value = todayValue;
				syncInputValue(input, state, {
					value: todayValue,
					source: "today",
					emitChange: true,
					emitError: true
				}).then(function(){
					if (state.options.closeOnSelect !== false) {
						closePicker(input, warpper, state, {
							source: "today"
						});
						return;
					}
					return refreshPickerUI(warpper, state, keyboardApi, true);
				});
				return;
			}
			if (target.getAttribute("data-action") === "clear") {
				input.value = "";
				syncInputValue(input, state, {
					value: "",
					source: "clear",
					emitChange: true,
					emitError: false
				}).then(function(){
					closePicker(input, warpper, state, {
						source: "clear"
					});
				});
			}
		}, false);

		input.addEventListener("input", function(){
			ready.then(function(){
				if (!state.options.allowManualInput) {
					input.value = state.inputValue;
					return;
				}

				return syncInputValue(input, state, {
					value: input.value,
					source: "input",
					emitChange: true,
					emitError: true
				}).then(function(){
					if (state.isOpen) {
						return refreshPickerUI(warpper, state, keyboardApi, true);
					}
				});
			});
		}, false);

		input.addEventListener("click", function(e){
			e.stopPropagation();
			ready.then(function(){
				if (warpper.classList.contains("date-plugin-ui-warpper-show")) {
					closePicker(input, warpper, state, {
						restoreFocus: false,
						source: "toggle"
					});
					return;
				}
				return openPicker(input, warpper, state, keyboardApi);
			});
		}, false);
		window.addEventListener("resize", handleWindowPositionChange, false);
		window.addEventListener("scroll", handleWindowPositionChange, true);

		return {
			input: input,
			wrapper: warpper,
			state: state,
			ready: ready,
			open: function() {
				return ready.then(function(){
					if (state.isOpen) {
						return warpper;
					}
					return openPicker(input, warpper, state, keyboardApi);
				});
			},
			close: function() {
				return ready.then(function(){
					return closePicker(input, warpper, state, {
						source: "api"
					});
				});
			},
			getValue: function() {
				return input.value;
			},
			setValue: function(value) {
				input.value = value;
				return ready.then(function(){
					return syncInputValue(input, state, {
						value: value,
						source: "api",
						emitChange: true,
						emitError: true
					}).then(function(){
						if (state.isOpen) {
							return refreshPickerUI(warpper, state, keyboardApi, true);
						}
					}).then(function(){
						return value;
					});
				});
			},
			setMonth: function(year, month) {
				return ready.then(function(){
					var previousYear = state.visibleYear;
					var previousMonth = state.visibleMonth;
					return applyVisibleMonth(state, year, month).then(function(result){
						if (state.isOpen) {
							return refreshPickerUI(warpper, state, keyboardApi, true).then(function(){
								if (result.year !== previousYear || result.month !== previousMonth) {
									emitMonthChange(state, "api");
								}
								return result;
							});
						}
						if (result.year !== previousYear || result.month !== previousMonth) {
							emitMonthChange(state, "api");
						}
						return result;
					});
				});
			},
			destroy: function() {
				return ready.then(function(){
					clearPresentationTimers(state);
					return closePicker(input, warpper, state, {
						restoreFocus: false,
						silentHook: true,
						skipAnimation: true,
						source: "destroy"
					}).then(function(){
						if (warpper.parentNode) {
							warpper.parentNode.removeChild(warpper);
						}
						if (backdrop.parentNode) {
							setBackdropState(backdrop, false, "closed");
							backdrop.parentNode.removeChild(backdrop);
						}
						window.removeEventListener("resize", handleWindowPositionChange, false);
						window.removeEventListener("scroll", handleWindowPositionChange, true);
						state.destroyed = true;
					});
				});
			}
		};
	};
	document.addEventListener("click", function(){
		hideWarpper(null);
	}, false);
	window.datepickerinit = datepickerinit;
})();
