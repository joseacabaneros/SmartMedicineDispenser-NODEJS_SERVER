module.exports = function(app, swig, gestorBD, util) {
	
	//DASHBOARD(PASTILLEROS/HORARIOS) - GET vista
	app.get("/dashboard/pillbox/:pastillero", function(req, res) {
		//Obtener posicion actual del pastillero A
		var criterio = { "key" : req.session.usuario.serial };
		var pastillero = req.params.pastillero; //A o B
		
		gestorBD.serials.obtenerSerials(criterio, function(serial){
			var criterio = {
				serial: req.session.usuario.serial,
				unixtime: { $gte: util.unixTimezoneNow() }
			};
			
			//Obtener siguientes horarios programados, de todos los pastilleros
			gestorBD.horarios.obtenerProgramacion(criterio, function(horarios){
				var horariosA = [];
				var horariosB = [];
				
				/*
				 * Tomadas = posicion pastillero
				 * Programadas = sum(pastillas horarios programados)
				 * Libres = 12 - Programadas - Tomadas
				 */
				
				var estadoA = {
					tomadas: serial[0].posicion['A'],
					programadas: 0,
					libres: 12 - serial[0].posicion['A']
				};
				var estadoB = {
					tomadas: serial[0].posicion['B'],
					programadas: 0,
					libres: 12 - serial[0].posicion['B']	
				};
				
				//Obtener horarios y resumen de cada pastillero
				horarios.forEach(function(horario){
					if(horario.pastillero === 'A'){
						horariosA.push(horario);
						estadoA.programadas += parseInt(horario.pastillas);
						estadoA.libres -= parseInt(horario.pastillas);
					}else if(horario.pastillero === 'B'){
						horariosB.push(horario);
						estadoB.programadas += parseInt(horario.pastillas);
						estadoB.libres -= parseInt(horario.pastillas);
					}
				});
				
				//Funcion para obtener informacion a mostrar en la vista (fechas y horas)
				function getInfoHorarios(horarios){
					var horariosForDate = [];
					
					for (var i = 0; i < horarios.length; i++) {
						var horarioAux = {
							fecha: util.moment(horarios[i].unixtime * 1000).tz('GMT').locale('es')
								.format("dddd, DD MMMM YYYY"),
							hora: util.moment(horarios[i].unixtime * 1000).tz('GMT').locale('es')
								.format("HH:mm"),
							pastillas: horarios[i].pastillas,
							id: horarios[i]._id.toString()
						};
						horariosForDate.push(horarioAux);
					}
					return horariosForDate;
				}
				
				//Funcion para pintar los colores correspondientes en el pastillero SVG
				function getClasesSvg(estado){
					var clasesSvg = [];
					var cont = 0;
					
					//Pastillas tomadas
					for(var i = 0 ; i < estado.tomadas; i++){
						clasesSvg[cont] = "past-pos-tomada";
						cont++;
					}
					//Pastillas programadas
					for(i = 0 ; i < estado.programadas; i++){
						clasesSvg[cont] = "past-pos-programada";
						cont++;
					}
					//Pastillas libres (sin programar y sin tomar)
					for(i = 0 ; i < estado.libres; i++){
						clasesSvg[cont] = "past-pos-libre";
						cont++;
					}
					
					return clasesSvg;
				}
				
				var horariosForDate = [];
				var clasesSvg = [];
				var estadoPasSelect;
				var estadoPasOtro;
				
				if(pastillero === 'A'){
					//Obtener informacion de horarios A
					horariosForDate = getInfoHorarios(horariosA);
					//Obtener colores para pintar pastillero A SVG 
					clasesSvg = getClasesSvg(estadoA);
					//Abtraer cual es el pastillero seleccionado (facilitar 
					//la construcion de la vista)
					estadoPasSelect = estadoA;
					estadoPasOtro = estadoB;
				}else if(pastillero === 'B'){
					//Obtener informacion de horarios B
					horariosForDate = getInfoHorarios(horariosB);
					//Obtener colores para pintar pastillero B SVG 
					clasesSvg = getClasesSvg(estadoB);
					//Abtraer cual es el pastillero seleccionado (facilitar 
					//la construcion de la vista)
					estadoPasSelect = estadoB;
					estadoPasOtro = estadoA;
				}
				
				var respuesta = swig.renderFile('web/views/dashboard.horarios.html', {
					error: req.session.error,
					datos: req.session.datos,
					menu: "horarios",
					pastillero: pastillero,
					horarios: horariosForDate,
					clasessvg: clasesSvg,
					estadoPasSelect: estadoPasSelect,
					estadoPasOtro: estadoPasOtro
				});
				
				//Borrar futuras peticiones
				delete req.session.error;
				delete req.session.datos;
				
				res.send(respuesta);
			});
		});
	});
	
	//DASHBOARD(PASTILLEROS/HORARIOS) - GET BORRAR horario
	app.get("/dashboard/pillbox/delete/:pastillero/:id", function(req, res) {
		var criterio = { "_id" : gestorBD.mongo.ObjectID(req.params.id) };
				
		gestorBD.horarios.eliminarProgramacion(criterio, function(horarios){
			if (horarios === null){
				req.session.error = {
					mensaje: ' Inténtelo de nuevo más tarde',
					tipo: 'PROGRAMACION'
				};
			} else {
				//Redirecionar flujo al pastillero programado
				if(req.params.pastillero === 'A'){
					res.redirect("/dashboard/pillbox/A");
				}else{
					res.redirect("/dashboard/pillbox/B");
				}
			}
		});
	});
	
	//DASHBOARD(DISPENSADOR) - GET vista
	app.get("/dashboard/dispenser", function(req, res) {
		var respuesta = swig.renderFile('web/views/dashboard.dispensador.html', {
			menu: "dispensador"
		});
		res.send(respuesta);
	});
	
	//DASHBOARD(PERFIL) - GET vista
	app.get("/dashboard/profile", function(req, res) {
		var respuesta = swig.renderFile('web/views/dashboard.perfil.html', {
			menu: "perfil"
		});
		res.send(respuesta);
	});
	
	//DASHBOARD(AJUSTES) - GET vista
	app.get("/dashboard/settings", function(req, res) {
		var respuesta = swig.renderFile('web/views/dashboard.ajustes.html', {
			menu: "ajustes"
		});
		res.send(respuesta);
	});
	
	//DASHBOARD(PASTILLEROS/HORARIOS) - POST programacion horarios
	app.post('/dashboard/pillbox', function (req, res) {
		var usuarioSession = req.session.usuario;
		
		var formHorario = {
			pastillero: req.body.pastillero,
			date: req.body.datepicker,
			time: req.body.timepicker,
			pastillas: req.body.pastillas,
			rep: parseInt(req.body.rep),
			tomas: parseInt(req.body.tomas)
		};
		
		var pastilleros = [];
		//Pastillero X = programacion tanto para el pastillero A como para el B
		if(formHorario.pastillero === 'X'){
			pastilleros = ['A','B'];
		}else{
			pastilleros = [formHorario.pastillero];
		}
		
		//Comprobar que los campos 'Fecha' y 'Hora' han sido completados
		//Campos 'Fecha' y/o 'Hora' NO HAN SIDO COMPLETADOS
		if(formHorario.date === '' || formHorario.time === ''){
			req.session.error = {
				tipo: 'CAMPOSOBLIGATORIOS'
			};
			req.session.datos = formHorario;
			
			if(formHorario.date === ''){
				req.session.error.campoFecha = true;
			}
			if(formHorario.time === ''){
				req.session.error.campoHora = true;
			}
			
			//Redirecionar flujo al pastillero intentado programar
			if(pastilleros[0] === 'A'){
				res.redirect("/dashboard/pillbox/A");
			}else{
				res.redirect("/dashboard/pillbox/B");
			}
		//Campos 'Fecha' y 'Hora' SI HAN SIDO COMPLETADOS
		}else{
			//Calculo del UNIXtime de programacion del horario
			var parts = formHorario.date.split('/');
			var dateISOstring = parts[2] + "-" + parts[1] + "-" + parts[0] + "T" + formHorario.time + ":00"; 
			console.log(dateISOstring);
			var unixTimestamp = Math.round(new Date(dateISOstring).getTime()/1000);
			console.log(unixTimestamp);
			
			//Comprobar si la/s programacion/es distan 15min de otros horarios ya programados
			var unixTimestampMin =  unixTimestamp - 900;
			var criterio = {
				serial: usuarioSession.serial,
				unixtime: { $gte: unixTimestampMin }
			};
	
			gestorBD.horarios.obtenerProgramacion(criterio, function(horarios){
				var pastilleroRedirect = pastilleros[0];
				
				var sumUnixTime;
				var pastilleroAux;
				function filterHorarios(horario){
					return (horario.unixtime > (sumUnixTime - 900)) &&
					   	   (horario.unixtime < (sumUnixTime + 900));
				}
				function mismoPastilleroFilterHorarios(horario){
					return (horario.pastillero === pastilleroAux) &&
						   (horario.unixtime === sumUnixTime);
				}
				function distintoPastilleroHorarios(horario){
					return (horario.pastillero !== pastilleroAux) &&
						   (horario.unixtime === sumUnixTime);
				}
				
				//No conexion a Mongo
				if(horarios === null){
					req.session.error = {
						mensaje: ' Inténtelo de nuevo más tarde',
						tipo: 'PROGRAMACION'
					};
				//Si conexion a Mongo
				}else{
					pastilleros.forEach(function(pastillero) {
						for(var i = 0; i < formHorario.tomas; i++){
							sumUnixTime = (i * formHorario.rep * 3600) + unixTimestamp;
							pastilleroAux = pastillero;
							
							var horariosConflicto = horarios.filter(filterHorarios);
							
							//Situacion especial: permitir programar un horario en el pastillero
							//"contrario" para la misma fecha y hora (misma programacion que 
							//programar ambos pastilleros a la vez)
							var conflictos;
							var mismoPastillero = horariosConflicto.filter(mismoPastilleroFilterHorarios);
							var distintoPastillero = horariosConflicto.filter(distintoPastilleroHorarios);
							
							//Conflicto: mismo pastillero y mismo horario
							if(mismoPastillero.length > 0){ 
								conflictos = mismoPastillero;
							//NO Conflicto: distinto pastillero y mismo horario
							}else if(distintoPastillero.length > 0){
								conflictos = [];
							//Conflicto: resto
							}else{
								conflictos = horariosConflicto;
							}
							
							//Si existe algun horario que diste menos de 15 minutos del que se va
							//a programar: error
							if (conflictos.length > 0){
								//Redireccionar flujo al pastillero en conflicto para la programacion
								pastilleroRedirect = conflictos[0].pastillero;
								
								var conflicto = {
									pastillero: conflictos[0].pastillero,
									fecha: util.moment(conflictos[0].unixtime * 1000).tz('GMT')
										.locale('es').format("dddd DD MMMM YYYY"),
									hora: util.moment(conflictos[0].unixtime * 1000).tz('GMT')
										.locale('es').format("HH:mm")
								};
								
								req.session.error = {
									mensaje: ' la programación introducida ' + 
										'se superpone con otros horarios. Recuerde que cada horario ' + 
										'programado debe distrar al menos 15 minutos de otros',
									extra: ' Pastillero \'' + conflicto.pastillero + 
										 '\' y horario \'' + conflicto.fecha + ' ' + conflicto.hora + 
										 '\'',
									tipo: 'PROGRAMACION'
								};
								
								req.session.datos = formHorario;
							}
						}
					});
				}
				
				function noInsert(id) {
					if (id === null){
						req.session.error = {
							mensaje: ' Inténtelo de nuevo más tarde',
							tipo: 'PROGRAMACION'
						};
					}
				}
				
				//Intertar programacion/es (si req.session.error es undefined (no ha habido 
				//conflicto de horarios), la programacion/es pueden realizarse)
				if(req.session.error === undefined){
					pastilleros.forEach(function(pastillero) {
						for(var i = 0; i < formHorario.tomas; i++){
							var sumUnixTime = (i * formHorario.rep * 3600) + unixTimestamp;
							
							var horario = {
								serial: usuarioSession.serial,
								unixtime: sumUnixTime,
								pastillero: pastillero,
								pastillas: formHorario.pastillas,
								tomadaBtn: false,
								tomadaIR: false
							};
							
							gestorBD.horarios.insertarProgramacion(horario, noInsert);
						}
					});
				}
				
				//Redirecionar flujo al pastillero programado
				if(pastilleroRedirect === 'A'){
					res.redirect("/dashboard/pillbox/A");
				}else{
					res.redirect("/dashboard/pillbox/B");
				}
			});
		}
	});
};