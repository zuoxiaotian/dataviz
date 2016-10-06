var multibarChart = {

	xScale 		: d3.scale.ordinal(),
	yScale 		: d3.scale.linear(),
	xScaleP 	: d3.scale.ordinal(),
	xAxis 		: d3.svg.axis(),
	yAxis 		: d3.svg.axis(),
	color 		:  d3.scale.ordinal().range(["#9ac5a0", "#4a95c5", "#c6c7c9"]),
	margin 		: {top: 20, right: 20, bottom: 30, left: 40},
	width 		: 960 - 40 - 20,
	height 		: 500 - 20 - 30,
	svg 		: d3.select("body").append("svg"),

	insertLinebreaks : function (d) {
		var el = d3.select(this);
		var words = d.split(' ');
		el.text('');
		for (var i = 0; i < words.length; i++) {
			var tspan = el.append('tspan').text(words[i]);
			if (i > 0)
				tspan.attr('x', 0).attr('dy', '15');
		}
	},
	changeData : function(data){
		data.forEach(function(d){
			d.erosion = d["New Wins"] - d["Net Growth"]
		});
		return data;
	},
	getMaxMinInter: function(data){
		var max = d3.max(data, function(d) { return d3.max(d.ages, 		function(d) { return d.value; }); }) + 3;
		var min = d3.max(data, function(d) { return d3.max(d.erosion, 	function(d) { return d.value; }); }) + 3;
		var interval = max - min;
		return [max, min, interval]
	},
	make_y_axis : function () {        
		return d3.svg.axis()
			.scale(multibarChart.yScale)
			.orient("left");
	},
	make_x_axis : function () {        
		return d3.svg.axis()
			.scale(multibarChart.xScale)
			.orient("bottom");
	},
	addGradient: function(svg){
		return function(id, y1, y2, color){
			areaGradient = svg.append("defs")
				.append("linearGradient")
				.attr("id", id)
				.attr("x1", "0%").attr("y1", y1)
				.attr("x2", "0%").attr("y2", y2);
			areaGradient.append("stop")
				.attr("offset", "0%")
				.attr("stop-color", color)
				.attr("stop-opacity", 1);
			areaGradient.append("stop")
				.attr("offset", "100%")
				.attr("stop-color", color)
				.attr("stop-opacity", 0.2);
		}
	},
	draw : function(data) {
		data = multibarChart.changeData(data);

		var ageNames 	= d3.keys(data[0]).filter(function(key) { return key !== "Time" && key !== "erosion"; });
		var age2Names 	= d3.keys(data[0]).filter(function(key) { return key === "erosion"; });
		
		data.forEach(function(d) {
			d.ages 		= ageNames .map(function(name) { return {name: name, value: +d[name]}});
			d.erosion 	= age2Names.map(function(name) { return {name: name, value: +d[name], valueBegin: +d["New Wins"]}});
		});

		var [max, min, interval] = multibarChart.getMaxMinInter(data);

		multibarChart.xScale
    		.rangeRoundBands([0, multibarChart.width], 0.1)
			.domain(data.map(function(d) { return d.Time; }));

		multibarChart.xScaleP
			.domain(ageNames)
			.rangeRoundBands([0, multibarChart.xScale.rangeBand()]);

		multibarChart.yScale
			.range([multibarChart.height, 0])
			.domain([-min, max]);

		multibarChart.xAxis
			.scale(multibarChart.xScale)
			.orient("bottom");

		multibarChart.yAxis
			.scale(multibarChart.yScale)
			.orient("left")
			.tickFormat(d3.format(".2s"))
			.tickFormat(function(d){return d.toFixed(1) + "%"});

		var svg = multibarChart.svg
			.attr("width", multibarChart.width + multibarChart.margin.left + multibarChart.margin.right)
			.attr("height", multibarChart.height + multibarChart.margin.top + multibarChart.margin.bottom)
			.append("g")
			.attr("transform", "translate(" + multibarChart.margin.left + "," + multibarChart.margin.top + ")");

		var addGradient = multibarChart.addGradient(svg);
		addGradient("areaGradient1", "0%", "100%", "#9ac5a0");
		addGradient("areaGradient2", "0%", "100%", "#4a95c5");
		addGradient("areaGradient3", "100%", "0%", "#c6c7c9");
		addGradient("areaGradient4", "0%", "100%", "#c6c7c9");

		var tip = d3.tip()
				.attr('class', 'd3-tip')
				.offset([-10, 0])
				.html(function(d) {			 
			  		return "<strong>Pourcentage:</strong> <span style='color:red'>" +d.value.toFixed(1)+ " %</span>";
				});
		svg.call(tip);
		svg.append("g")         
	        .attr("class", "gridx")
	        .attr("transform", "translate(0," + multibarChart.height + ")")
	        .call(multibarChart.make_x_axis()
	            .tickSize(-multibarChart.height, 0, 0)
	            .tickFormat("")
	        );

		svg.append("g")         
	        .attr("class", "gridy")
	        .call(multibarChart.make_y_axis()
	            .tickSize(-multibarChart.width, 0, 0)
	            .tickFormat("")
	        );

		svg.append("g")
			.attr("class", "y axis")
			.call(multibarChart.yAxis)
			.append("text")
			.attr("transform", "rotate(-90)")
			.attr("y", 6)
			.attr("dy", ".71em");
	
		var state = svg.selectAll(".state")
			.data(data)
			.enter().append("g")
			.attr("class", "state")
			.attr("transform", function(d) { return "translate(" + multibarChart.xScale(d.Time) + ",0)"; });

		state.selectAll("rect")
			.data(function(d) { return d.ages})
			.enter().append("rect")
			.attr("class", "bar")
			.attr("width", multibarChart.xScaleP.rangeBand())
			.attr("x", function(d) { return multibarChart.xScaleP(d.name); })
			.attr("y", function(d) { return multibarChart.yScale(d.value); })
			.attr("height", function(d) { return multibarChart.height - multibarChart.yScale(d.value) - multibarChart.yScale(interval); })
			//.style("fill", function(d) { return multibarChart.color(d.name); })
			.style("fill", function(d) { return d.name=="New Wins"?"url(#areaGradient1)":"url(#areaGradient2)"})
			.on('mouseover', mouseover)
			.on('mouseout', mouseout);


		var erosion = svg.selectAll(".erosion")
			.data(data)
			.enter().append("g")
			.attr("class", "erosion")
			.attr("transform", function(d) { return "translate(" + multibarChart.xScale(d.Time) + ",0)"; });

		erosion.selectAll("rect")
			.data(function(d) { return d.erosion; })
			.enter().append("rect")
			.attr("class", "bar")
			.attr("width", multibarChart.xScaleP.rangeBand())
			.attr("x", function(d) { return multibarChart.xScaleP.rangeBand() / 2; })
			.attr("y", function(d) { return multibarChart.yScale(0); })
			.attr("height", function(d) {return multibarChart.height - multibarChart.yScale(d.value) - multibarChart.yScale(interval)})
			.attr("stroke", "black")
			.attr("stroke-dasharray", "5, 5")
			.attr("stroke-width", "1")
			//.style("fill", function(d) { return multibarChart.color(d.name); })
			.style("fill", "url(#areaGradient3)")	
			.on('mouseover', mouseover)
			.on('mouseout', mouseout);


		var erosion2 = svg.selectAll(".erosion2")
			.data(data)
			.enter().append("g")
			.attr("class", "erosion2")
			.attr("transform", function(d) { return "translate(" + multibarChart.xScale(d.Time) + ",0)"; });
		
		erosion2.selectAll("rect")
			.data(function(d) { return d.erosion; })
			.enter().append("rect")
			.attr("class", "bar")
			.attr("width", multibarChart.xScaleP.rangeBand())
			.attr("x", function(d) { return multibarChart.xScaleP.rangeBand(); })
			.attr("y", function(d) { return multibarChart.yScale(d.valueBegin); })
			.attr("height", function(d) { return multibarChart.height - multibarChart.yScale(d.value) - multibarChart.yScale(interval)})
			.attr("stroke", "black")
			.attr("stroke-dasharray", "5, 5")
			.attr("stroke-width", "1")
			//.style("fill", function(d) { return multibarChart.color(d.name); })
			.style("fill", "url(#areaGradient4)")	
			.on('mouseover', mouseover)
			.on('mouseout', mouseout);

		svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + multibarChart.yScale(0) + ")")
			.call(multibarChart.xAxis);

		svg.selectAll('g.x.axis g text').each(multibarChart.insertLinebreaks).style("font-size", "1.2em");

		var legend = svg.selectAll(".legend")
			.data(ageNames.concat(age2Names).slice())
			.enter().append("g")
			.attr("class", "legend")
			.attr("transform", function(d, i) { return "translate(" + (-i * 100-360) + ", 420)"; });

		legend.append("rect")
			.attr("x", multibarChart.width - 42)
			.attr("width", 18)
			.attr("height", 18)
			.style("fill", multibarChart.color);

		legend.append("text")
			.attr("x", multibarChart.width - 18)
			.attr("y", 9)
			.attr("dy", ".35em")
			.text(function(d) { return d; });

		function mouseover(d){
			d3.selectAll("rect.bar").style("opacity", 0.3); 
			d3.select(this).style("opacity", 1); 
			tip.show(d);
		};

		function mouseout(d){
			d3.selectAll("rect.bar").style("opacity", 1); 
			tip.hide(d);
		};
	},

	update : function(data){
		data = multibarChart.changeData(data);
		var ageNames 	= d3.keys(data[0]).filter(function(key) { return key !== "Time" && key !== "erosion"; });
		var age2Names 	= d3.keys(data[0]).filter(function(key) { return key === "erosion"; });
		data.forEach(function(d) {
			d.ages 		= ageNames .map(function(name) { return {name: name, value: +d[name]}});
			d.erosion 	= age2Names.map(function(name) { return {name: name, value: +d[name], valueBegin: +d["New Wins"]}});
		});
		var [max, min, interval] = multibarChart.getMaxMinInter(data);
		multibarChart.xScale
			.domain(data.map(function(d) { return d.Time; }));

		multibarChart.xScaleP
			.domain(ageNames)
			.rangeRoundBands([0, multibarChart.xScale.rangeBand()]);

		multibarChart.yScale
			.domain([-min, max]);

		multibarChart.xAxis
			.scale(multibarChart.xScale)
			.orient("bottom");

		multibarChart.yAxis
			.scale(multibarChart.yScale)
			.orient("left")
			.tickFormat(d3.format(".2s"))
			.tickFormat(function(d){return d.toFixed(1) + "%"});


		multibarChart.svg.select(".gridx").transition().duration(750)
	        .call(multibarChart.make_x_axis()
	            .tickSize(-multibarChart.height, 0, 0)
	            .tickFormat("")
	        );

		multibarChart.svg.select(".gridy").transition().duration(750)
	        .call(multibarChart.make_y_axis()
	            .tickSize(-multibarChart.width, 0, 0)
	            .tickFormat("")
	        );

		multibarChart.svg.select("g.y").transition().duration(750)
			.call(multibarChart.yAxis);


		multibarChart.svg.select("g.x").transition().duration(750)
			.attr("transform", "translate(0," + multibarChart.yScale(0) + ")")
			.call(multibarChart.xAxis);		

		multibarChart.svg.selectAll('g.x.axis g text').each(multibarChart.insertLinebreaks).style("font-size", "1.2em");


		multibarChart.svg.selectAll("g.state").selectAll("rect").transition().duration(750).attr("x", 1000);
		multibarChart.svg.selectAll("g.erosion").selectAll("rect").transition().duration(750).attr("x", 1000);
		multibarChart.svg.selectAll("g.erosion2").selectAll("rect").transition().duration(750).attr("x", 1000);


		var state = multibarChart.svg.selectAll("g.state")
			.data(data);
			
		state.transition().duration(750)
			.attr("transform", function(d) { return "translate(" + multibarChart.xScale(d.Time) + ",0)"; });

		state.selectAll("rect")
			.data(function(d) { return d.ages })
			.transition().duration(750)
			.attr("width", multibarChart.xScaleP.rangeBand())
			.attr("x", function(d) { return multibarChart.xScaleP(d.name); })
			.attr("y", function(d) { return multibarChart.yScale(d.value); })
			.attr("height", function(d) { return multibarChart.height - multibarChart.yScale(d.value) - multibarChart.yScale(interval); });


		var erosion = multibarChart.svg.selectAll(".erosion")
			.data(data);

		erosion
			.transition().duration(750)		
			.attr("transform", function(d) { return "translate(" + multibarChart.xScale(d.Time) + ",0)"; });

		erosion.selectAll("rect")
			.data(function(d) { return d.erosion; })
			.transition().duration(750)
			.attr("width", multibarChart.xScaleP.rangeBand())
			.attr("x", function(d) { return multibarChart.xScaleP.rangeBand() / 2; })
			.attr("y", function(d) { return multibarChart.yScale(0); })
			.attr("height", function(d) {return multibarChart.height - multibarChart.yScale(d.value) - multibarChart.yScale(interval)});

		var erosion2 = multibarChart.svg.selectAll(".erosion2")
			.data(data);
		
		erosion2
			.transition().duration(750)		
			.attr("transform", function(d) { return "translate(" + multibarChart.xScale(d.Time) + ",0)"; });
		erosion2.selectAll("rect")
			.data(function(d) { return d.erosion; })
			.transition().duration(750)
			.attr("width", multibarChart.xScaleP.rangeBand())
			.attr("x", function(d) { return multibarChart.xScaleP.rangeBand(); })
			.attr("y", function(d) { return multibarChart.yScale(d.valueBegin); })
			.attr("height", function(d) { return multibarChart.height - multibarChart.yScale(d.value) - multibarChart.yScale(interval)});
	}
}