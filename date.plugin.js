(function(){
	var corePromise = import("./src/core/index.js").then(function(core){
		window.datepicker = {
			getMonthAndDate : core.getMonthAndDate
		};
		return core;
	});
	window.datepickerCoreReady = corePromise;

	function withCore(callback) {
		return corePromise.then(callback);
	}

	var datepickerinit = {};
	var year ;
	var month;

	datepickerinit.buildUI = function  (warpper,toDate) {
		return withCore(function(core){
			if(toDate){
				if(toDate === 'prev') month--;
				else if(toDate === 'next') month++;		
			}
			var data = core.getMonthAndDate(year,month);
			year = data.year;
			month = data.month;
			var html = '<div class="date-plugin-ui-hearder">'+
					'<sapn class="date-plugin-btn date-plugin-prev-btn">&lt;</sapn>'+
					'<sapn class="date-plugin-btn date-plugin-next-btn">&gt;</sapn>'+
					'<sapn class="data-plugin-month">'+ year+'-'+ core.addPadding(month) +'</sapn>'+
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
				warpper.innerHTML = html;
		});
	}

	function deleteWarpper(){
		var warppers = document.querySelectorAll(".date-plugin-ui-warpper");
		Array.prototype.forEach.call(warppers, function(item){
			document.body.removeChild(item);
		});
	}

	var lastclick ; 
	datepickerinit.init = function(input){
		input.addEventListener("click", function(e){ // 添加事件监听可以添加多个事件，直接绑定只能绑定一个事件
			e.stopPropagation();  // 阻止事件冒泡
			if(!this.dataset.index) this.dataset.index = this.offsetLeft + this.offsetTop;
			var currentClick = this.dataset.index;
			var show = false;
			if(lastclick === currentClick){ // 操作同一个输入框
				show = document.querySelector(".date-plugin-ui-warpper") ? 
				(document.querySelector(".date-plugin-ui-warpper")
				.classList.contains("date-plugin-ui-warpper-show") ? true:false ): false;
			} 
			lastclick = currentClick;
			deleteWarpper();
			var warpper = document.createElement("div");
			warpper.setAttribute("class","date-plugin-ui-warpper");
			document.body.appendChild(warpper);
			datepickerinit.buildUI(warpper);
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
				e.stopPropagation();
				var target = e.target;
				if(target.classList.contains('date-plugin-prev-btn')){
					datepickerinit.buildUI(warpper,'prev');
				}else if(target.classList.contains("date-plugin-next-btn")){
					datepickerinit.buildUI(warpper,'next');
				}else if(target.tagName.toLowerCase() === 'td'){ // 点击单元格日期
					var date;
					if(target.dataset){
						date = target.dataset.date;
					}else {
						date = target.getAttribute("data-date");
					}
					withCore(function(core){
						self.value = core.formatDate(year,month,date);
					});
					warpper.classList.remove("date-plugin-ui-warpper-show");
					show = false;
				}
			},false);
		}, false);
	}	

	window.addEventListener("load", function(){
		withCore(function(){
			var input = document.querySelectorAll(".my-datepicker-box");
			if(input){
				for(var i=0 ; i<input.length;i++){
					datepickerinit.init(input[i]);
				}
			}
		});
	}, false);
	document.addEventListener("click", deleteWarpper, false);
})();
