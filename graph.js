$(function () {
	var SUNDAY = 0;
	var SATURDAY = 6;

	var START_DATE = new Date(2012, 4, 21);
	var END_DATE = new Date(2012, 5, 29);
	var holidays = [
		new Date(2012, 4, 28).getTime()
	];
	$data = [];
	var startTimeString = "12:00pm";
	var endTimes = [
		"12:46pm", /* May 21 */
		"12:50pm", /* May 22 */
		"12:43pm", /* May 23 */
		"12:51pm", /* May 24 */
		"12:54pm", /* May 25 */
		"1:15pm", /* May 29 */
		"1:10pm", /* May 30 */
		"12:36pm", /* May 31 */
		"12:50pm", /* June 1 */
		"12:35pm", /* June 4 */
		"12:39pm", /* June 5 */
		"12:51pm", /* June 6 */
		"12:53pm", /* June 7 */
		"12:46pm", /* June 8 */
		"12:50pm", /* June 11 */
		"12:55pm", /* June 12 */
		"12:52pm", /* June 13 */
		"12:44pm", /* June 14 */
		"12:15pm", /* June 15 */
		"12:45pm", /* June 18 */
		"1:05pm", /* June 19 */
		"12:48pm", /* June 20 */
		"12:45pm" /* June 21 */
	];
	
	var i = 0;
	var totalClassTime = 0;
	for(var d = START_DATE; d <= END_DATE; d.setDate(d.getDate() + 1)) {
		var day = d.getDay();
		
		if( day == SATURDAY || day == SUNDAY || ($.inArray(d.getTime(), holidays) > -1) ) {
			continue;
		}
		
		var startTime = addTimeForDate(d, startTimeString);
		var duration = 0;
		if ( i < endTimes.length ) {
			// if we have a value for endTimes[i], set duration
			var endTime = addTimeForDate(d, endTimes[i]);
			duration = minutes(endTime - startTime);
		} else {
			break;
		}
		totalClassTime += duration;
		console.log(startTime + "= " + duration);
		$data.push([endTime.getTime(), duration]);
		i += 1;
	}
	var numDaysOfClass = i;
	var average_duration = totalClassTime/numDaysOfClass;
	var avg_duration_string = "Average Duration of each class:";
	var hours = 0;
	while(average_duration >= 60) {
		average_duration -= 60;
		hours += 1;
	}
	var mins = Math.round(average_duration);
	if(hours > 1) {
		avg_duration_string += " " + hours + " hours";
	} else if( hours > 0 ) {
		avg_duration_string += " " + hours + " hour";
	}
	if (mins > 0) {
		avg_duration_string += " " + mins + " mins"
	} else if (mins == 0 && hours == 0) {
		// only display this if there are no hours
		avg_duration_string += "0 mins";
	}
	
	$("#average_duration").html(avg_duration_string);
	console.log(average_duration);
     
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

	$("body").append("<span class='label'></span>");
 
 	var latestPosition = null;
    var lastIndex = null;
    function getLabel() {
        
        var pos = latestPosition;
        
        var axes = plot.getAxes();
        if (pos.x < axes.xaxis.min || pos.x > axes.xaxis.max ||
            pos.y < axes.yaxis.min || pos.y > axes.yaxis.max) {
			if(lastIndex != null) {
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

            if(lastIndex != null)
	            plot.unhighlight(0, lastIndex);
			plot.highlight(0,index);
			lastIndex = index;
			
			var point = series.data[index];
			var x = point[0]; /* date in milliseconds */
			var y = point[1]; /* duration in minutes */
			
			var date = new Date(x);
			date.setMinutes(date.getMinutes() + y);
			
			// Format the end time label
			var dateString = moment(date).format('MMM D');
			var hours = date.getHours()
			var minutes = date.getMinutes()
			
			var suffix = "am";
			if (hours >= 12) {
				suffix = "pm";
				hours = hours - 12;
			}
			if (hours == 0) {
				hours = 12;
			}
			
			if (minutes < 10)
				minutes = "0" + minutes;
			
			var cx = series.xaxis.p2c(x);
			var cy = series.xaxis.p2c(y);
			
			var label = hours + ":" + minutes + suffix + "\n" + dateString;
			return label;
        }
    }
    
    $("#graph").bind("plothover",  function (event, pos, atPoint)  {
	    latestPosition = pos;
    	label = getLabel();
    	
    	if(label != "") {
	    	showLabel(pos.pageY, pos.pageX, label);
    	} else {
	    	removeLabel();
    	}
/*
        if(atPoint) {
			showLabel(atPoint.pageY, atPoint.pageX, getLabel());
        } else {
	        removeLabel();
        }
*/
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

function minutes(milliseconds) {
	var one_millisecond = 1;
	var one_second = 1000*one_millisecond;
	var one_minute = 60*one_second;
	
	return Math.round(milliseconds/one_minute);
}

// timeString format: "%h:%m(am/pm)"
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