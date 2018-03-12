module.exports = function(app, gestorBD) {
	
	app.get("/api/schedule/:serial", function(req, res) {
		var unixTimestampNow = Math.round(new Date().getTime()/1000);
		//Para Espana, una hora mas a la UTC
		unixTimestampNow += 3600;
		//Buscar horarios programados 00:00:30 segundos por encima y por debajo a la hora actual
		var unixTimeNowMax = unixTimestampNow + 30;
		var unixTimeNowMin = unixTimestampNow - 30;
		
		var criterio = {
			serial: req.params.serial,
			unixtime: { $gte: unixTimeNowMin, $lt: unixTimeNowMax}
		};
		
		gestorBD.obtenerProgramacion(criterio, function(horarios){
			if (horarios === null || horarios.length === 0){
				//204 - No Content
				res.status(204);
				res.send();
			} else {
				var strJson = {};
				strJson["Numero horarios"] = horarios.length;
				var key = 'Horarios programados';
				strJson[key] = [];
				
				horarios.forEach(function(horario) {
					//Comprobar si la pastilla ya ha sido tomada, bien confirmada con el boton
					//o confirmada con el sensor IR
					if(horario.tomadaBtn === false && horario.tomadaIR === false){
						var dataHorario = {
							id: horario._id,
							unixtimetoma: horario.unixtime,
				            pastillero: horario.pastillero,
				            pastillas: horario.pastillas
						};
						strJson[key].push(dataHorario);
					}
				});
				
				res.status(200);
				res.setHeader('Content-Type', 'application/json');
		        res.json(strJson);
			}
		});
	});
	
};