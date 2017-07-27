(function(){
	var datepicker = {};
	datepicker.getMonthAndDate = function(year,month){
		var res = [] ;// 日历的数据
		if((!year || !month) && month != 0) { // 默认为当前日期
			var today = new Date();
			year = today.getFullYear();
			month = today.getMonth() + 1;
		}
		// 获取当前月的第一天
		var firstDayOfMonth = new Date(year,month-1,1);
		year = firstDayOfMonth.getFullYear();
		month = firstDayOfMonth.getMonth() + 1;
		//获取当前月的最后一天
		var lastDayOfMonth = new Date(year,month,0);
		//获取第一天的星期
		var firstDayWeek = firstDayOfMonth.getDay();
		if(firstDayWeek === 0) firstDayWeek = 7 ; // 星期日
		//获取上个月的最后一天，好计算日历的开始天数
		var lastMonthDay = new Date(year,month-1,0);
		var lastMonthDate = lastMonthDay.getDate();
		var lastMonth  = firstDayWeek - 1; 

		// 首先计算本月的天数
		var daysOfMonth = lastDayOfMonth.getDate() - firstDayOfMonth.getDate() + 1;
		//加上上个月要显示的天数
		var showDays = daysOfMonth + lastMonth;
		//计算要显示的行数
		var lineNum  = showDays % 7 === 0 ? showDays / 7 : Math.ceil(showDays / 7); 
		for(var i = 0 ; i<7*lineNum; i++) {
			var date = i + 1 - lastMonth;
			var showDate = date;
			var thisMonth = month;
			if(date <= 0){
				showDate = lastMonthDate + date;
				thisMonth = month -1 ;	
			}else if(date > lastDayOfMonth.getDate()){
				showDate = date - lastDayOfMonth.getDate();
				thisMonth = month + 1;
			}
			res.push({
				date : date,
				showDate : showDate,
				month : thisMonth
			});
		}
		return {
			year : year,
			month : month,
			dateList : res
		};
	}
	window.datepicker = datepicker;
})();

(function(){
	var datepickerinit = {};
	var warpper ;
	var year ;
	var month;
	function addPadding (data) {
		if( data < 10) data = '0' + data;
		return data;
	}

	function formatDate(year,month,date){
		var date = new Date(year,month - 1 ,date);
		return date.getFullYear() + "-" + 
		addPadding(date.getMonth() + 1) + "-" + addPadding(date.getDate());
	}
	datepickerinit.buildUI = function  (toDate) {
		if(toDate){
			if(toDate === 'prev') month--;
			else if(toDate === 'next') month++;		
		}
		var data = window.datepicker.getMonthAndDate(year,month);
		year = data.year;
		month = data.month;
		var html = '<div class="date-plugin-ui-hearder">'+
				'<sapn class="date-plugin-btn date-plugin-prev-btn">&lt;</sapn>'+
				'<sapn class="date-plugin-btn date-plugin-next-btn">&gt;</sapn>'+
				'<sapn class="data-plugin-month">'+ year+'- '+ addPadding(month) +'</sapn>'+
			'</div>'+
			'<div class="date-plugin-ui-body">'+
				'<table>'+
					'<thead>'+
						'<tr>'+
							'<th>一</th>'+
							'<th>二</th>'+
							'<th>三</th>'+
							'<th>四</th>'+
							'<th>五</th>'+
							'<th>六</th>'+
							'<th>七</th>'+
						'</tr>'+
					'</thead>'+
					'<tbody>';
					var len = data.dateList.length;
					for(var i=0;i<len;i++){
						if( i % 7 == 0){
							html += '<tr>';
						}
						html += '<td data-date="'+ data.dateList[i].date +'">' + data.dateList[i].showDate + '</td>';
						if( i % 7 == 6 ){
							html += '</tr>';
						} 
					}
					'</tbody>'+
				'</table>'+
			'</div>';
			document.querySelector(".date-plugin-ui-warpper").innerHTML = html;
	}

	datepickerinit.init = function(input){
		datepickerinit.buildUI();
		var show = false;
		input.addEventListener("click", function(){
			warpper.style.left = this.offsetLeft + "px";
			warpper.style.top = this.offsetTop + input.offsetHeight + 2 + "px";
			if(show){
				warpper.classList.remove("date-plugin-ui-warpper-show");
				show = false;
			}else{
				warpper.classList.add("date-plugin-ui-warpper-show");
				show = true;
			}
			var self = this;
			warpper.addEventListener("click",function(e){
				var target = e.target;
				if(target.classList.contains('date-plugin-prev-btn')){
					datepickerinit.buildUI('prev');
				}else if(target.classList.contains("date-plugin-next-btn")){
					datepickerinit.buildUI('next');
				}else if(target.tagName.toLowerCase() === 'td'){ // 点击单元格日期
					var date;
					if(target.dataset){
						date = target.dataset.date;
					}else {
						date = target.getAttribute("data-date");
					}
					self.value = formatDate(year,month,date);
					warpper.classList.remove("date-plugin-ui-warpper-show");
					show = false;
				}	
			},false);
		}, false);
	}	
	window.onload = function(){
		var input = document.querySelectorAll(".my-datepicker-box");
		if(input){
			warpper = document.createElement("div");
			warpper.setAttribute("class","date-plugin-ui-warpper");
			document.body.appendChild(warpper);
			for(var i=0 ; i<input.length;i++){
				datepickerinit.init(input[i]);
			}
		}
	}
})();


