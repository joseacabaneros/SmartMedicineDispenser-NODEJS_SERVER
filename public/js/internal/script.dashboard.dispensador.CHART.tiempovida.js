function initializeTiempoVida(dataJson){
	///////////////////////////////////////////////////////////////////////////
	////////////////////Set up and initiate svg containers ///////////////////
	///////////////////////////////////////////////////////////////////////////	
	
	var data = JSON.parse(dataJson);
	var minutes = [":00", ":10", ":20", ":30", ":40", ":50"];
	var hours = [];
	var heightBarLegend = 10;
	
	data.forEach(function(dato) {
		var hora = dato.hora.toString();
		if(dato.hora < 10)
			hora = "0" + hora;
		if(!hours.includes(hora))
			hours.push(hora);
	});
	
	var margin = {
		top: 140,
		right: 50,
		bottom: 50,
		left: 50
	};
	
	if(window.innerWidth < 700){
		margin.top = 110;
		margin.left = 40;
		
		heightBarLegend = 6;
	}
	
	if(window.innerWidth < 500){
		margin.bottom = 70;
	}
	
	var windowWidth = window.innerWidth;
	//Restar width de la barra de menu
	if(window.innerWidth > 992){
		windowWidth -= 100;
	}
	
	var width = Math.max(Math.min(windowWidth, 1100), 300) - margin.left - margin.right,
	gridSize = width / hours.length,
	height = gridSize * (minutes.length + 2);
	
	//SVG container
	var svg = d3.select('#tiempoVida')
		.append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
		.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	
	///////////////////////////////////////////////////////////////////////////
	////////////////////////////Draw Heatmap /////////////////////////////////
	///////////////////////////////////////////////////////////////////////////
	
	var colorScale = d3.scaleLinear()
		.domain([0, 
			d3.max(data, function(d) {
				return d.count; 
			})/2, 
			d3.max(data, function(d) {
				return d.count; 
			})
		])
		.range(["#E74C3C", "#F4D03F", "#58D68D"]);
	
	var minutesLabels = svg.selectAll(".minuteLabel")
		.data(minutes)
		.enter().append("text")
		.text(function (d) { return d; })
		.attr("x", 0)
		.attr("y", function (d, i) { return i * gridSize; })
		.style("text-anchor", "end")
		.attr("transform", "translate(-6," + gridSize / 1.5 + ")")
		.attr("class", function (d, i) { return ((data[data.length-1].minuto === parseInt(d.substring(1))) ? 
				"axisLabels mono axis axis-hourNow" : "axisLabels mono axis"); });
		
	var hoursLabels = svg.selectAll(".hourLabel")
		.data(hours)
		.enter().append("text")
		.text(function(d) { return d; })
		.attr("x", function(d, i) { return i * gridSize; })
		.attr("y", 0)
		.style("text-anchor", "middle")
		.attr("transform", "translate(" + gridSize / 2 + ", -6)")
		.attr("class", function(d, i) { 
			if(data[data.length-1].hora === parseInt(d)){
				return "axisLabels mono axis axis-minutesNow";
			}
			if(parseInt(d) === 0){
				return "axisLabels mono axis axis-changeDay";
			}
			
			return "axisLabels mono axis"; 
		});
	
	var heatMap = svg.selectAll(".hour")
		.data(data)
		.enter().append("rect")
		.attr("x", function(d, i) { return Math.floor(i/6) * gridSize; })
		.attr("y", 0)
		.attr("class", "hour bordered")
		.attr("width", gridSize)
		.attr("height", gridSize)
		.style("stroke", "white")
		.style("stroke-opacity", 0.6)
		.style("fill", "white")
		.transition()
			.duration(1000)
			.attr("y", function(d) { return (d.minuto / 10) * gridSize; })
			.style("fill", function(d) { return colorScale(d.count); });
	
	//Append title to the top
	svg.append("text")
		.attr("class", "title")
		.attr("x", width/2)
		.attr("y", -80)
		.style("text-anchor", "middle")
		.text("Tiempo de Vida");
	svg.append("text")
		.attr("class", "subtitle")
		.attr("x", width/2)
		.attr("y", -50)
		.style("text-anchor", "middle")
		.text("Últimas 24 horas");
	
	///////////////////////////////////////////////////////////////////////////
	////////////////Create the gradient for the legend ///////////////////////
	///////////////////////////////////////////////////////////////////////////
	
	//Extra scale since the color scale is interpolated
	var countScale = d3.scaleLinear()
		.domain([0, d3.max(data, function(d) {return d.count; })])
		.range([0, width])
	
	//Calculate the variables for the temp gradient
	var numStops = 10;
	countRange = countScale.domain();
	countRange[2] = countRange[1] - countRange[0];
	countPoint = [];
	for(var i = 0; i < numStops; i++) {
		countPoint.push(i * countRange[2]/(numStops-1) + countRange[0]);
	}//for i
	
	//Create the gradient
	svg.append("defs")
		.append("linearGradient")
		.attr("id", "legend-traffic")
		.attr("x1", "0%").attr("y1", "0%")
		.attr("x2", "100%").attr("y2", "0%")
		.selectAll("stop") 
		.data(d3.range(numStops))                
		.enter().append("stop") 
		.attr("offset", function(d,i) { 
			return countScale( countPoint[i] )/width;
		})   
		.attr("stop-color", function(d,i) { 
			return colorScale( countPoint[i] ); 
		});
	
	///////////////////////////////////////////////////////////////////////////
	//////////////////////////Draw the legend ////////////////////////////////
	///////////////////////////////////////////////////////////////////////////
	
	var legendWidth = Math.min(width*0.8, 300);
	//Color Legend container
	var legendsvg = svg.append("g")
		.attr("class", "legendWrapper")
		.attr("transform", "translate(" + (width/2) +
				"," + (gridSize * minutes.length + 50) + ")");
	
	//Draw the Rectangle
	legendsvg.append("rect")
		.attr("class", "legendRect")
		.attr("x", -legendWidth/2)
		.attr("y", 0)
		//.attr("rx", hexRadius*1.25/2)
		.attr("width", 0)
		.attr("height", heightBarLegend)
		.style("fill", "url(#legend-traffic)")
		.transition()
			.duration(1000)
			.attr("width", legendWidth);
	
	//Append title
	legendsvg.append("text")
		.attr("class", "legendTitle")
		.attr("x", 0)
		.attr("y", -10)
		.style("text-anchor", "middle")
		.text("Solicitudes del Dispensador");
	
	//Set scale for x-axis
	var xScale = d3.scaleLinear()
		.range([-legendWidth/2, legendWidth/2])
		.domain([ 0, d3.max(data, function(d) { return d.count; })] );
	
	//Define x-axis
	var xAxis = d3.axisBottom()
		.ticks(5)
		//.tickFormat(formatPercent)
		.scale(xScale);
	
	//Set up X axis
	legendsvg.append("g")
		.attr("class", "axis")
		.attr("transform", "translate(0," + (10) + ")")
		.call(xAxis);
};