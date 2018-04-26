function initializeTemperatura(dataJson){
	var data = JSON.parse(dataJson);
	
	// set the dimensions and margins of the graph
	var margin = {
		top: 140,
		right: 60,
		bottom: 40,
		left: 50
	};
	
	if(window.innerWidth < 700){
		margin.top = 110;
		margin.right = 50;
		margin.left = 40;
		margin.bottom = 20;
	}
	
	var windowWidth = window.innerWidth;
	//Restar width de la barra de menu
	if(window.innerWidth > 992){
		windowWidth -= 100;
	}
	
	var width = Math.max(Math.min(windowWidth, 1100), 300) - margin.left - margin.right;
	var height = (width / 24) * 8; //Same height than 'Tiempo Vida' chart

	// parse the date / time
	var parseTime = d3.timeParse("%d/%m %H:%M");

	// set the ranges
	var x = d3.scaleTime().range([0, width]);
	var y = d3.scaleLinear().range([height, 0]);

	// define the area
	var area = d3.area()
		.defined(function(d) { return (d.temp !== null) })
	    .x(function(d) { return x(d.time); })
	    .y0(height)
	    .y1(function(d) { return y(d.temp); });

	// define the line
	var valueline = d3.line()
		.defined(function(d) { return (d.temp !== null) })
	    .x(function(d) { return x(d.time); })
	    .y(function(d) { return y(d.temp); });

	// append the svg obgect to the body of the page
	// appends a 'group' element to 'svg'
	// moves the 'group' element to the top left margin
	var svg = d3.select('#temperaturaChart').append("svg")
	    .attr("width", width + margin.left + margin.right)
	    .attr("height", height + margin.top + margin.bottom)
	  .append("g")
	    .attr("transform",
	          "translate(" + margin.left + "," + margin.top + ")");

	// format the data
	data.forEach(function(d) {
		d.time = parseTime(d.time);
		d.temp = d.temp;
	});
	
	// scale the range of the data
	var miny = d3.min(data, function(d) { return d.temp; });
	var maxy = d3.max(data, function(d) { return d.temp; });
	
	x.domain(d3.extent(data, function(d) { return d.time; }));
	y.domain([miny - ((maxy - miny) / 10), maxy]);
	
	// add the area
	svg.append("path")
	   	.data([data])
	   		.attr("class", "areaTemperatura")
	   		.attr("d", area);
	
	// add the valueline path.
	svg.append("path")
	  	.data([data])
	  		.attr("class", "lineTemperatura")
	  		.attr("d", valueline);
	
	
	var sizeTick = 6;
	var numTicks = 10;
	if(width < 700){
		sizeTick = 2;
		numTicks = 5;
	}
	
	// add the X Axis
	svg.append("g")
		.attr("class", "xaxis")  // two classes, one for css formatting, one for selection below
	  	.attr("transform", "translate(0," + height + ")")
  		.call(d3.axisBottom(x)
  				.tickSize(sizeTick,0));
	
	d3.selectAll(".xaxis text")  // select all the text elements for the xaxis
		.attr("class", "axisLabels");
	
	// add the Y Axis
	svg.append("g")
		.attr("class", "yaxis")  // two classes, one for css formatting, one for selection below
		.call(d3.axisLeft(y)
				.ticks(numTicks)
				.tickSize(sizeTick,0));
	
	d3.selectAll(".yaxis text")  // select all the text elements for the xaxis
		.attr("class", "axisLabels");
	
	//Append title to the top
	svg.append("text")
		.attr("class", "title")
		.attr("x", width/2)
		.attr("y", -80)
		.style("text-anchor", "middle")
		.text("Registro de Temperatura en ºC");
	
	svg.append("text")
		.attr("class", "subtitle")
		.attr("x", width/2)
		.attr("y", -50)
		.style("text-anchor", "middle")
		.text("Últimas 24 horas");
};