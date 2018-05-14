module.exports = function(app, gestorBD, util, senderEmails, handlerTelegramBot) {
	
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
		 * y 1-12 las pastillas (segun tratamiento) */
		
		var criterio = { serial : req.body.serial };
		
		gestorBD.serials.obtenerSerials(criterio, function(serials){
			if (serials === null || serials.length === 0){
				res.status(204);
				res.send();
			} else {
				var pastillero = req.body.pastillero; //A o B
				
				var posicionNueva = parseInt(req.body.pastillas);
				var posicionAnterior = serials[0].posicion[pastillero];
				var posicionFinal = posicionNueva + posicionAnterior;
				
				//Todas las pastillas dispensadas; resetear posicion a 0
				//Posicion 13 porque se aumento en 1 la posicion al solictar el horario
				//para posicionar el pastillero en el 0
				if(posicionFinal === 13){
					posicionFinal = 0;
				}
				
				//Obtener emails de usuarios registrados para el serial del usuario
				//iniciado en sesion
				gestorBD.usuarios.obtenerUsuarios(criterio, function(usuarios) {
					var emailsNot = '';
					
					usuarios.forEach(function(usuario) {
						emailsNot += usuario.email + ', ';
					});
					
					//Obtener emails de notificaciones
					serials[0].emailsnotificacion.forEach(function(email) {
						if(email !== ''){
							emailsNot += email + ', ';
						}
					});
					
					//NOTIFICACION Pocas Pastillas [Si esta activada la opcion en la configuracion]
					if(serials[0].configuracionnotificaciones.pocaspastillas.estado && 
							((serials[0].tratamiento[pastillero].pastillas - posicionFinal) <= 
								serials[0].configuracionnotificaciones.pocaspastillas.valor)){
						
						var quedan = serials[0].tratamiento[pastillero].pastillas - posicionFinal;
						//EMAIL
						senderEmails.sendEmail(emailsNot, 'POCAS PASTILLAS', 
								req.body.serial, 'Quedan <b>POCAS PASTILLAS en el pastillero \'' + pastillero + 
								'\' (' + quedan + ' pastillas)</b> según la configuración establecida del dispensador');
						//TELEGRAM
						handlerTelegramBot.sendMessage(req.body.serial, 
								'📢 [' + req.body.serial + '] 💊 Quedan POCAS PASTILLAS en el pastillero \'' + 
								pastillero + '\' 💊 (' + quedan + ' pastillas)');
					}
					
					console.log('POSICION FINAL ' + pastillero + ": " + posicionFinal);
					
					//Actualizar posicion del pastillero
					serials[0].posicion[pastillero] = posicionFinal;
					gestorBD.serials.modificarSerial(criterio, serials[0], function(result) {
						if(result === null){
							res.status(204);
					        res.json("");
						}else{
							res.status(200);
					        res.json("");
						}
					});
				});
			}
		});
	});
	
	app.post("/api/notification/notake", function(req, res) {
		var criterio = { "_id" : gestorBD.mongo.ObjectID(req.body.id) };
		
		gestorBD.horarios.obtenerProgramacion(criterio, function(horarios){
			if (horarios === null || horarios.length === 0){
				res.status(204);
				res.send();
			} else {
				var criterio = { serial: horarios[0].serial };
				
				//Obtener emails de usuarios registrados para el serial del usuario
				//iniciado en sesion
				gestorBD.usuarios.obtenerUsuarios(criterio, function(usuarios) {
					var emailsNot = '';
					
					usuarios.forEach(function(usuario) {
						emailsNot += usuario.email + ', ';
					});
					
					//Obtener emails de notificaciones
					gestorBD.serials.obtenerSerials(criterio, function(serials) {
						serials[0].emailsnotificacion.forEach(function(email) {
							if(email !== ''){
								emailsNot += email + ', ';
							}
						});
						
						var fechaMedicacion = util.moment(horarios[0].unixtime * 1000).tz('GMT').locale('es')
												.format("dddd, DD MMMM YYYY HH:mm");
						
						//NOTIFICACION DE MEDICACION NO TOMADA
						//EMAIL
						senderEmails.sendEmail(emailsNot, 'MEDICACIÓN NO TOMADA \'' + horarios[0].pastillero  + '\'', 
								horarios[0].serial, '<b>NO SE HA TOMADO LA MEDICACIÓN</b> del pastillero <b>\'' + 
								horarios[0].pastillero + '\'</b> correspondiente a la programación con fecha <b>' +
								fechaMedicacion + '</b> del dispensador');
						//TELEGRAM
						handlerTelegramBot.sendMessage(horarios[0].serial, 
								'📢 [' + horarios[0].serial + '] 📥 MEDICACIÓN NO TOMADA del pastillero \'' + 
								horarios[0].pastillero + '\' 📥 correspondiente a la programación con fecha ' + fechaMedicacion);
						
						res.status(200);
				        res.json("");
					});
				});
			}
		});
	});
	
	app.post("/api/notification/emergency", function(req, res) {
		var criterio = { serial : req.body.serial };
		
		//Obtener emails de usuarios registrados para el serial del usuario
		//iniciado en sesion
		gestorBD.usuarios.obtenerUsuarios(criterio, function(usuarios) {
			var emailsNot = '';
			
			usuarios.forEach(function(usuario) {
				emailsNot += usuario.email + ', ';
			});
			
			//Obtener emails de notificaciones
			gestorBD.serials.obtenerSerials(criterio, function(serials) {
				serials[0].emailsnotificacion.forEach(function(email) {
					if(email !== ''){
						emailsNot += email + ', ';
					}
				});
				
				//NOTIFICACION EMERGENCIA (PULSACION BOTON ROJO)
				//EMAIL
				senderEmails.sendEmail(emailsNot, 'EMERGENCIA', 
						req.body.serial, 'Se ha pulsado el botón de <b>EMERGENCIA</b> del dispensador');
				//TELEGRAM
				handlerTelegramBot.sendMessage(req.body.serial, 
						'📢 [' + req.body.serial + '] 🚨 EMERGENCIA 🚨 - Se ha pulsado el botón de EMERGENCIA del dispensador.');

				res.status(200);
		        res.json("");
			});
		});
	});
};