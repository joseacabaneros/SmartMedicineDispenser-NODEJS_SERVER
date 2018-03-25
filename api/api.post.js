module.exports = function(app, gestorBD) {
	
	app.post("/api/update/action", function(req, res) {
		var criterio = { "_id" : gestorBD.mongo.ObjectID(req.body.id) };
		
		gestorBD.horarios.obtenerProgramacion(criterio, function(horario){
			if (horario === null || horario.length === 0){
				res.status(204);
				res.send();
			} else {
				var accion = req.body.accion;
				
				//Pulsado boton de confirmacion de toma de la medicacion
				if(accion === "tomadaBtn"){
					horario[0].tomadaBtn = true;
					gestorBD.horarios.actualizarProgramacion(criterio, horario[0], function(result){
						if(result === null){
							res.status(204);
					        res.json("");
						}else{
							res.status(200);
					        res.json("");
						}
					});
				}
				//Deteccion del sensor IR de confirmacion de toma de la medicacion
				if(accion === "tomadaIR"){
					horario[0].tomadaIR = true;
					gestorBD.horarios.actualizarProgramacion(criterio, horario[0], function(result){
						if(result === null){
							res.status(204);
					        res.json("");
						}else{
							res.status(200);
					        res.json("");
						}
					});
				}
			}
		});
	});
	
	app.post("/api/update/position", function(req, res) {
		/* La posicion de cada pastillero va de 0 a 12
		 * siendo 0 la posicion sin pastilla
		 * y 1-12 las pastillas */
		
		var criterio = { "key" : req.body.serial };
		
		gestorBD.serials.obtenerSerials(criterio, function(serial){
			if (serial === null || serial.length === 0){
				res.status(204);
				res.send();
			} else {
				var pastillero = req.body.pastillero; //A o B
				
				var pasicionNueva = parseInt(req.body.pastillas);
				var posicionAnterior = serial[0].posicion[pastillero];
				var posicionFinal = pasicionNueva + posicionAnterior;
				
				//Todas las pastillas dispensadas; resetear posicion a 0
				//Posicion 13 porque se aumento en 1 la posicion al solictar el horario
				//para posicionar el pastillero en el 0
				if(posicionFinal === 13){
					posicionFinal = 0;
				}
				
				//Actualizar posicion del pastillero
				serial[0].posicion[pastillero] = posicionFinal;
				gestorBD.serials.modificarSerial(criterio, serial[0], function(result) {
					if(result === null){
						res.status(204);
				        res.json("");
					}else{
						res.status(200);
				        res.json("");
					}
				});
			}
		});
	});
	
};