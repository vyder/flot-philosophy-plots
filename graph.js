$(function () {
	var SUNDAY = 0;
	var SATURDAY = 6;

	var START_DATE = new Date(2012, 4, 21);
	var END_DATE = new Date(2012, 5, 29);
	var holidays = [
		new Date(2012, 4, 28).getTime()
	];
	var startTimeString = "12:00pm";
	var endTimes = {};
	
	endTimes["May 21"] = "12:46pm"; 
	endTimes["May 22"] = "12:50pm";
	endTimes["May 23"] = "12:43pm";
	endTimes["May 24"] = "12:51pm";
	endTimes["May 25"] = "12:54pm";
	endTimes["May 29"] = "1:15pm";
	endTimes["May 30"] = "1:10pm";
	endTimes["May 31"] = "12:36pm";
	endTimes["Jun 1"] = "12:50pm";
	endTimes["Jun 4"] = "12:35pm";
	endTimes["Jun 5"] = "12:39pm";
	endTimes["Jun 6"] = "12:51pm";
	endTimes["Jun 7"] = "12:53pm";
	endTimes["Jun 8"] = "12:46pm";
	endTimes["Jun 11"] = "12:50pm";
	endTimes["Jun 12"] = "12:55pm";
	endTimes["Jun 13"] = "12:52pm";
	endTimes["Jun 14"] = "12:44pm";
	endTimes["Jun 15"] = "12:15pm";
	endTimes["Jun 18"] = "12:45pm";
	endTimes["Jun 19"] = "1:05pm";
	endTimes["Jun 20"] = "12:48pm";
	endTimes["Jun 21"] = "12:45pm";
	
	// [ (date, duration), ... ]
	$data = [];
	$ticks = [];

	// Loop through raw data and make an array of data points - (date, duration)
	var i = 0;
	var totalClassTime = 0;

	for(var d = START_DATE; d <= END_DATE; d.setDate(d.getDate() + 1)) {
	 	date = moment(d);
		var day = d.getDay();
		
		// Skip weekends and holidays
		if( day == SATURDAY || day == SUNDAY || ($.inArray(d.getTime(), holidays) > -1) ) {
			continue;
		}
		
		var startTime = addTimeForDate(d, startTimeString);
		var duration = 0;

		// if we have a value for endTimes[i], set duration
		var dateString = date.format('MMM D');
		if ( dateString in endTimes ) {
			var endTime = addTimeForDate(d, endTimes[dateString]);
			duration = minutes(endTime - startTime);
		}
		else {
			break;
		}
		
		// Log some data
		totalClassTime += duration;
		
		// Load up the value
		var plotDate = date.toDate();
		$data.push([plotDate.getTime(), duration]);
		$ticks.push(plotDate.getTime());
		
		i += 1;
	}
	
	// Calculate average
	var numDaysOfClass = i;
	var average_duration = totalClassTime/numDaysOfClass;
	var avg_duration_string = "Average Duration of each class: ";
	
	avg_duration_string += pretty_print_minutes(average_duration);
	
	$("#average_duration").html(avg_duration_string);
	
	// Actual Plot   
	// $.plot(placeholder, [ options ]);
	var plot = $.plot($("#graph"), [{
		data: $data,
		color: "#5AAAE5",
		shadowSize:0
		}], {
	  line: { 
	  	show: true
	  },
	  xaxis: {
	      mode: "time",
	      timeformat: "%b %d",
	      ticks: $ticks,
	      max: ( END_DATE ).getTime()
	  },
	  yaxis: {
	    min: 0,
	    max: 90,
	    minTickSize:1
	  },
	  grid: {
	    hoverable: true,
	    autoHighlight: true
	  }
	});



	// Hover over data points label
	//
	$("body").append("<span class='label'></span>"); 
 	var latestPosition = null;
	var lastIndex = null;
  
 	function getLabel() {
      
		var pos = latestPosition;

		var axes = plot.getAxes();
		// If out of canvas
		if (pos.x < axes.xaxis.min || pos.x > axes.xaxis.max ||
			pos.y < axes.yaxis.min || pos.y > axes.yaxis.max) {
			if(lastIndex != null) {
			  // reset lastIndex
				plot.unhighlight(0, lastIndex);
				lastIndex = null;
			}
		  
			return "";
		}

		var i, j, dataset = plot.getData();
		// Loop through all datasets
		for (i = 0; i < dataset.length; ++i) {
			var series = dataset[i];

			// find the nearest points, x-wise
			for (j = 0; j < series.data.length; ++j) {
			  if (series.data[j][0] > pos.x)
			      break;
			}

			// assign value to whichever is closer to cursor
			// p1[0] < pos.x < p2[0]
			var p1 = series.data[j - 1];
			var p2 = series.data[j];
			var index = 0;

			if (p1 == null) {
			  y = p2[1];
			  index = j;
			}
			else if (p2 == null) {
			  y = p1[1];
			  index = j - 1;
			}
			else {
				if( (pos.x - p1[0]) >= (p2[0] - pos.x) ) {
				// x is closer to p2 or exactly halfway
					y = p2[1];
				    index = j;
				} else {
				// x is closer to p1
					y = p1[1];
					index = j - 1;
				}
			}
		}

		if(lastIndex != null) {
			plot.unhighlight(0, lastIndex);
			plot.highlight(0,index);
			lastIndex = index;
		}

		var point = series.data[index];
		var x = point[0]; /* date in milliseconds */
		var y = point[1]; /* duration in minutes */

		var date = moment(addTimeForDate(new Date(x), startTimeString));
		date.add('minutes',y);
		// var startTime = addTimeForDate(date, startTimeString);



		var cx = series.xaxis.p2c(x);
		var cy = series.xaxis.p2c(y);

		var label = date.format('h:mma - MMM D');
		return label;
	}
  
	$("#graph").bind("plothover",  function (event, pos, atPoint)  {
		latestPosition = pos;
		label = getLabel();
		
		if(label != "") {
			showLabel(pos.pageY, pos.pageX, label);
		} else {
			removeLabel();
		}
	});
    
  function showLabel(x,y,labelText) {
  	if(labelText == "")
  		return;

  	$("span.label").css({
  		'font-size': '10pt',
  		position: 'absolute',
    	'z-index': 100,
		top: x + 15,
		left: y + 15,
		'background-color': '#B5D5FF',
		padding: '2px'
  	});
  	$("span.label").show();
    $("span.label").html(labelText);
  }
  
  function removeLabel() {
    $("span.label").hide();
  }
});

// Returns milliseconds to nearest minute
function minutes(milliseconds) {
	var one_millisecond = 1;
	var one_second = 1000*one_millisecond;
	var one_minute = 60*one_second;
	
	return Math.round(milliseconds/one_minute);
}

function pretty_print_minutes(totalMinutes) {
	var pretty_string = "";
	var hours = 0;
	while(totalMinutes >= 60) {
		totalMinutes -= 60;
		hours += 1;
	}
	var mins = Math.round(totalMinutes);
	if(hours > 1) {
		pretty_string += hours + " hours";
	} else if( hours > 0 ) {
		pretty_string += hours + " hour";
	}
	if (mins > 0) {
		if (hours > 0) {
			pretty_string += " ";
		}
		pretty_string += mins + " mins"
	} else if (mins == 0 && hours == 0) {
		// only display this if there are no hours
		pretty_string += "0 mins";
	}

	return pretty_string;
}

// timeString format: "%h:%m(am|pm)"
function addTimeForDate(date, timeString) {
	if (timeString.match(/\d{1,2}\:\d{2}(am|pm)/)) {
		var newDate = new Date(date);
		var hour = timeString.match(/\d{1,2}/)[0];
		var mins = timeString.match(/\:\d{2}/)[0].slice(1);
		
		if ( hour < 1 || hour > 12 || mins < 0 || mins >= 60) {
			return null;
		}
		
		var pm = (timeString.match(/(am|pm)/)[0] == "pm");
		if(pm && hour < 12) {
			hour = parseInt(hour) + 12;
		} else if( !pm && hour == 12 ) {
			hour = parseInt(hour) - 12;
		}
		
		newDate.setHours(hour);
		newDate.setMinutes(mins);
		
		return newDate;

	}
	return null;
}
