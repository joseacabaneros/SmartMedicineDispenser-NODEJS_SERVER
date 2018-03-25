module.exports = function(app, gestorBD, util) {
	
	app.get("/api/schedule/:serial", function(req, res) {
		var unixTimestampNow = util.unixtimezonenow();
		//Buscar horarios programados 00:00:30 segundos por encima y por debajo a la hora actual
		var unixTimeNowMax = unixTimestampNow + 30;
		var unixTimeNowMin = unixTimestampNow - 30;
		
		var criterio = {
			serial: req.params.serial,
			unixtime: { $gte: unixTimeNowMin, $lt: unixTimeNowMax}
		};
		
		gestorBD.horarios.obtenerProgramacion(criterio, function(horarios){
			if (horarios === null || horarios.length === 0){
				//204 - No Content
				res.status(204);
				res.send();
			} else {
				var strJson = {};
				strJson["Numero horarios"] = horarios.length;
				var key = 'Horarios programados';
				strJson[key] = [];
				
				//Comprobar posicion actual del/los pastillero/s
				var criterio = { "key" : req.params.serial };
				gestorBD.serials.obtenerSerials(criterio, function(serial) {	
					horarios.forEach(function(h) {
						//Comprobar si la pastilla ya ha sido tomada, bien confirmada con el boton
						//o confirmada con el sensor IR
						if(h.tomadaBtn === false && h.tomadaIR === false){
							if (serial === null || serial.length === 0){
								res.status(204);
								res.send();
							} else {
								var pastillero = ((h.pastillero === "1") ? 'A' : 'B'); //A o B
								
								var pastillas = parseInt(h.pastillas);
								var posicionAnterior = serial[0].posicion[pastillero];
								var posicionFinal = pastillas + posicionAnterior;
								
								//Todas las pastillas serán dispensadas; avanzar una posicion más 
								//para posicionar el pastillero en 0
								if(posicionFinal === 12){
									pastillas++;
								}
								
								var dataHorario = {
									id: h._id,
									unixtimetoma: h.unixtime,
						            pastillero: h.pastillero,
						            pastillas: pastillas
								};
								
								strJson[key].push(dataHorario);
							}
						}
					});
					
					res.status(200);
					res.setHeader('Content-Type', 'application/json');
			        res.json(strJson);
				});
			}
		});
	});
	
};