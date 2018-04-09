module.exports = function(app, gestorBD, util) {
	
	function getHorariosToca(req, res){
		var unixTimestampNow = util.unixTimezoneNow();
		
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
								var pastillas = parseInt(h.pastillas);
								var posicionAnterior = serial[0].posicion[h.pastillero];
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
	}
	
	//------------------------------------ GET API ---------------------------------------------
	
	app.get("/api/schedule/:serial", function(req, res) {
		//----------------- Almacenar datos: ping, temperatura, humedad, gas -------------------
		
		//Se almacenan los ping en rangos de 10 minutos, por ello los minutos de cada
		//fecha y hora son multiplos de 10
		var minutos = parseInt(util.moment().minute()/10) * 10;
		var momentParseMin = util.moment().startOf('hour').minutes(minutos);
		var unixtime = util.unixTimezoneParam(momentParseMin);
		
		var criterio = { unixtime: unixtime };
		
		gestorBD.datos.obtenerDatos(criterio, function(datos) {
			//Insertar una nueva fecha de pings
			if(datos === null || datos.length === 0){
				var dato = {
					unixtime: unixtime,
					pings: 1,
					temperatura: 0,
					humedad: 0,
					gas: false
				};
				
				gestorBD.datos.insertarDato(dato, function(id){
					if (id === null){
						//204 - Error conexion MongoDB
						res.status(204);
						res.send();
					}else{
						//Consultar si toca dispensar medicamento
						getHorariosToca(req, res);
					}
				});
			//Aumentar en 1 los pings de dicha fecha-hora multiplo de 10 minutos
			}else{
				var criterio = { "_id" : gestorBD.mongo.ObjectID(datos[0]._id) };
				datos[0].pings++;
				
				gestorBD.datos.actualizarDato(criterio, datos[0], function(result) {
					if (result === null){
						//204 - Error conexion MongoDB
						res.status(204);
						res.send();
					}else{
						//Consultar si toca dispensar medicamento
						getHorariosToca(req, res);
					}
				});
			}
		});
	});

};