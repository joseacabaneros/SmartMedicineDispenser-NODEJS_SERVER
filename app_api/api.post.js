module.exports = function(app, gestorBD) {
	
	app.post("/api/update", function(req, res) {
		var criterio = { "_id" : gestorBD.mongo.ObjectID(req.body.id) };
		
		gestorBD.obtenerProgramacion(criterio, function(horario){
			if (horario === null || horario.length === 0){
				res.status(204);
				res.send();
			} else {
				var accion = req.body.accion;
				
				//Pulsado boton de confirmacion de toma de la medicacion
				if(accion === "tomadaBtn"){
					horario[0].tomadaBtn = true;
					gestorBD.actualizarProgramacion(criterio, horario[0], function(result){
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
					gestorBD.actualizarProgramacion(criterio, horario[0], function(result){
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
	
};