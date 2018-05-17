module.exports = function(app, swig, gestorBD, util) {
	
	//DASHBOARD(PASTILLEROS/HORARIOS) - GET vista
	app.get("/dashboard/pillbox/:pastillero", function(req, res) {
		//Obtener posicion actual del pastillero seleccionado (parametro)
		var criterio = { serial : req.session.usuario.serial };
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
				 * Libres = Tratamiento - Programadas - Tomadas
				 */
				
				var estadoA = {
					tomadas: serial[0].posicion.A,
					programadas: 0,
					libres: serial[0].tratamiento.A.pastillas - serial[0].posicion.A
				};
				var estadoB = {
					tomadas: serial[0].posicion.B,
					programadas: 0,
					libres: serial[0].tratamiento.B.pastillas - serial[0].posicion.B	
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
					//Posicion reposo
					if(estado.tomadas > 0){
						clasesSvg[cont] = "past-pos-neutro";
						cont++;
					}
					//Pastillas tomadas
					for(var i = 0 ; i < (estado.tomadas-1); i++){
						clasesSvg[cont] = "past-pos-tomada";
						cont++;
					}
					//Posicion pastillero
					clasesSvg[cont] = "past-pos-pastillero";
					cont++;
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
					//Pastillas no disponibles (por tratamiento)
					var quedan = cont;
					for(i = 0 ; i < (13-quedan); i++){
						clasesSvg[cont] = "past-pos-no-disponible";
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
					menu: "horarios",
					error: req.session.error,
					datos: req.session.datos,
					pastillero: pastillero,
					tratamiento: serial[0].tratamiento[pastillero],
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
			} 
			//Redirecionar flujo al pastillero programado
			if(req.params.pastillero === 'A'){
				res.redirect("/dashboard/pillbox/A");
			}else{
				res.redirect("/dashboard/pillbox/B");
			}
		});
	});
	
	//DASHBOARD(DISPENSADOR) - GET vista
	app.get("/dashboard/dispenser", function(req, res) {
		//Se almacenan pings en rangos de 10 minutos, por ello los minutos de cada
		//fecha y hora son multiplos de 10
		var minutos = parseInt(util.moment().minute()/10) * 10;
		var momentUnixTimeHour = util.unixTimezoneParam(util.moment().startOf('hour'));
		
		//Datos de las ultimas 23 horas (23*60*60 = 82800s)
		var unixTimeMax = momentUnixTimeHour + minutos * 60;
		var unixTimeMin = momentUnixTimeHour - 82800;
		//console.log(unixTimeMax);
		//console.log(unixTimeMin);
		
		var criterio = { 
			serial: req.session.usuario.serial,
			unixtime: { $gte: unixTimeMin, $lte: unixTimeMax}
		};
		
		var sumSec = 0;
		function getDatoByUnixTime(dato){
			return dato.unixtime === unixTimeMin + sumSec;
		}
		
		
		gestorBD.datos.obtenerDatos(criterio, function(datos) {
			//Datos para la grafica "TIEMPO DE VIDA", "TEMPERATURA" y "HUMEDAD"
			var dataTiempoVida = [];
			var dataTempHume = [];
			
			for(var i = 0; i < 144; i++){
				sumSec = 10 * 60 * i;
				var dato = datos.find(getDatoByUnixTime);
				var fechaMoment = util.moment((unixTimeMin + sumSec) * 1000).tz('GMT').locale('es');
				
				var count = 0;
				var temp = null;
				var hume = null;
				if(dato !== undefined){
					count = dato.pings;
					temp = dato.temperatura;
					hume = dato.humedad;
				}
				
				//Minutos de la hora actual que aun no han llegado
				if((unixTimeMin + sumSec) <= unixTimeMax){
					dataTiempoVida.push({hora: fechaMoment.hours(), minuto: fechaMoment.minutes(), count: count});
					dataTempHume.push({time: fechaMoment.format("DD/MM HH:mm"), temp: temp, hume: hume});
				}
				
				//console.log({hora: fechaMoment.hours(), minuto: fechaMoment.minutes(), count: count})
			}
			
			//Datos para paneles de informacion
			var panelInfo = {};
			
			if(datos.length > 0){
				var ultimoDato = datos[datos.length-1];
				
				panelInfo.temperatura = ultimoDato.temperatura;
				panelInfo.humedad = ultimoDato.humedad;
				panelInfo.icalor = ultimoDato.icalor;
				panelInfo.gas = (ultimoDato.gas) ? "SI" : "NO";
				panelInfo.caida = (ultimoDato.vibracion) ? "SI" : "NO";
				
				//El dispensador estará conectado si el ultimo ping ha sido 
				//realizado hace menos de 60 segundos
				var criterio = { serial: req.session.usuario.serial };
				gestorBD.serials.obtenerSerials(criterio, function(serials) {
					panelInfo.conexion = ((util.unixTimezoneNow() - serials[0].ultimoping) <= 60) ? "SI" : "NO";
					
					var respuesta = swig.renderFile('web/views/dashboard.dispensador.html', {
						menu: "dispensador",
						panelInfo: panelInfo,
						dataTiempoVida: JSON.stringify(dataTiempoVida),
						dataTempHume: JSON.stringify(dataTempHume)
					});
					
					res.send(respuesta);
				});
			}else{
				panelInfo.temperatura = 0;
				panelInfo.humedad = 0;
				panelInfo.icalor = 0;
				panelInfo.gas = "NO";
				panelInfo.caida = "NO";
				panelInfo.conexion = "NO";
			
				var respuesta = swig.renderFile('web/views/dashboard.dispensador.html', {
					menu: "dispensador",
					panelInfo: panelInfo,
					dataTiempoVida: JSON.stringify(dataTiempoVida),
					dataTempHume: JSON.stringify(dataTempHume)
				});
				
				res.send(respuesta);
			}
		});
	});
	
	//DASHBOARD(PERFIL) - GET vista
	app.get("/dashboard/profile", function(req, res) {
		var respuesta = swig.renderFile('web/views/dashboard.perfil.html', {
			menu: "perfil",
			datosUsuario: req.session.usuario,
			error: req.session.error,
			success: req.session.success
		});
		
		//Borrar futuras peticiones
		delete req.session.error;
		delete req.session.success;
		
		res.send(respuesta);
	});
	
	//DASHBOARD(AJUSTES) - GET vista
	app.get("/dashboard/settings", function(req, res) {
		var criterio = { serial: req.session.usuario.serial};
		
		//Obtener emails de usuarios registrados para el serial del usuario
		//iniciado en sesion
		gestorBD.usuarios.obtenerUsuarios(criterio, function(usuarios) {
			var emailsUsuarios = [];
			
			usuarios.forEach(function(usuario) {
				emailsUsuarios.push(usuario.email);
			});
			
			//Obtener emails y ajustes del dispensador
			gestorBD.serials.obtenerSerials(criterio, function(serials) {
				var respuesta = swig.renderFile('web/views/dashboard.ajustes.html', {
					menu: "ajustes",
					error: req.session.error,
					success: req.session.success,
					emailsNotUsuarios: emailsUsuarios,
					serialConfig: serials[0]
				});
				
				//Borrar futuras peticiones
				delete req.session.error;
				delete req.session.success;
				
				res.send(respuesta);
			});
		});
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
			//console.log(dateISOstring);
			var unixTimestamp = Math.round(new Date(dateISOstring).getTime()/1000);
			//console.log(unixTimestamp);
			
			//Obtener tiempoEspera entre tomas (será la diferencia de tiempo que debe de haber entre horarios)
			gestorBD.serials.obtenerSerials({serial : usuarioSession.serial}, function(serials){
				//TIEMPO ESPERA + 50SEG = SEGUNDOS QUE DEBEN DISTAR LAS PROGRAMACIONES
				var segEspera = (serials[0].toma.tiempoespera * 60) + 50;
			
				//Comprobar si la/s programacion/es distan 'TIEMPO ESPERA + 50SEG' de otros horarios ya programados
				var unixTimestampMin =  unixTimestamp - segEspera;
				var criterio = {
					serial: usuarioSession.serial,
					unixtime: { $gte: unixTimestampMin }
				};
		
				gestorBD.horarios.obtenerProgramacion(criterio, function(horarios){
					var pastilleroRedirect = pastilleros[0];
					
					var sumUnixTime;
					var pastilleroAux;
					function filterHorarios(horario){
						return (horario.unixtime > (sumUnixTime - segEspera)) &&
						   	   (horario.unixtime < (sumUnixTime + segEspera));
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
										mensaje: " la programación introducida " + 
											"se superpone con otros horarios. Recuerde que cada horario " + 
											"programado debe distar al menos 'TIEMPO de ESPERA + 50SEG = " + 
											serials[0].toma.tiempoespera + "MIN + 50SEG' de otros.",
										extra: " Pastillero '" + conflicto.pastillero + 
											 "' y horario '" + conflicto.fecha + " " + conflicto.hora + 
											 "'",
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
						
						//Esperar 1 segundo a insertar las programaciones de horarios (asincrono)
						setTimeout(function(){
							//Redirecionar flujo al pastillero programado
							if(pastilleroRedirect === 'A'){
								res.redirect("/dashboard/pillbox/A");
							}else{
								res.redirect("/dashboard/pillbox/B");
							}
						}, 1000);
					}else{
						//Redirecionar flujo al pastillero programado
						if(pastilleroRedirect === 'A'){
							res.redirect("/dashboard/pillbox/A");
						}else{
							res.redirect("/dashboard/pillbox/B");
						}
					}
				});
			});
		}
	});
	
	//DASHBOARD(PERFIL) - POST datos personales de usuario
	//ADMIN(PERFIL) - POST datos personales de admin
	app.post('/profile', function (req, res) {
		var pass1 = req.body.pass1;
		var pass2 = req.body.pass2;
		
		//Comprobar contraseñas iguales
		if(pass1 !== "" && pass2 !== "" && pass1 !== pass2){
			req.session.error = {
				mensaje: 'Las contraseñas introducidas no coinciden',
				tipo: 'PASSWORD'
			};
			
			//USUARIO
			if(req.session.usuario.tipo === 'USUARIO'){
				res.redirect('/dashboard/profile');
			//ADMIN
			}else if(req.session.usuario.tipo === 'ADMIN'){
				res.redirect('/admin/profile');
			}
		}else{
			//Comprobar que el email no esté ya registrado
			var criterio = { email: req.body.email };
			
			gestorBD.usuarios.obtenerUsuarios(criterio, function(usuarios) {
				//Email no registrado o el mismo - OK
				if (usuarios === null || usuarios.length === 0 || req.body.email === req.session.usuario.email) {
					var criterio = { "_id" : gestorBD.mongo.ObjectID(req.session.usuario._id) };
					
					var usuario = {
						nombre: req.body.nombre,
						apellido: req.body.apellido,
						telefono: req.body.tlfn,
						email: req.body.email
					};
					
					//Modificar password si ha sido introducida una nueva
					if(pass1 !== ""){
						usuario.password = app.get("crypto").createHmac('sha256', app.get('clave'))
		    				.update(pass1).digest('hex');
					}
					
					gestorBD.usuarios.modificarUsuario(criterio, usuario, function(result) {
						if (result === null){
							req.session.error = {
								mensaje: 'Error al modificar datos personales. Inténtelo de nuevo más tarde',
								tipo: 'GENERAL'
							};
							
							//USUARIO
							if(req.session.usuario.tipo === 'USUARIO'){
								res.redirect('/dashboard/profile');
							//ADMIN
							}else if(req.session.usuario.tipo === 'ADMIN'){
								res.redirect('/admin/profile');
							}
						} else {
							var criterio = { "_id" : gestorBD.mongo.ObjectID(req.session.usuario._id) };
							
							//Actualizar datos personales del usuario uniciado en sesion
							gestorBD.usuarios.obtenerUsuarios(criterio, function(usuarios) {
								req.session.usuario = usuarios[0];
								req.session.success = 'Datos personales modificados con éxito';
								
								//USUARIO
								if(req.session.usuario.tipo === 'USUARIO'){
									res.redirect('/dashboard/profile');
								//ADMIN
								}else if(req.session.usuario.tipo === 'ADMIN'){
									res.redirect('/admin/profile');
								}
							});
						}
					});
					
				//Email ya registrado - WRONG
				} else {
					req.session.error = {
						mensaje: 'La dirección de correo electrónico \'' + req.body.email + 
							'\' ya ha sido registrada',
						tipo: 'EMAIL'
					};
					
					res.redirect('/dashboard/profile');
				}
			});
		}
	});
	
	//DASHBOARD(AJUSTES/EMAILS) - POST emails de notificacion
	app.post("/dashboard/settings/emails", function(req, res) {
		var criterio = { serial: req.session.usuario.serial};
		
		var serial = { emailsnotificacion: [req.body.email1, req.body.email2] };
		
		gestorBD.serials.modificarSerial(criterio, serial, function(result) {
			if(result === null){
				req.session.error = {
					mensaje: 'Error al modificar emails de notificación. Inténtelo de nuevo más tarde',
					tipo: 'GENERAL'
				};
				
				res.redirect('/dashboard/settings');
			}else{
				req.session.success = 'Emails de notificación modificados con éxito';
				
				res.redirect('/dashboard/settings');
			}
		});
	});
	
	//DASHBOARD(AJUSTES/TRATAMIENTO) - POST medicamento y numero de pastillas del tratamiento
	app.post("/dashboard/settings/treatment", function(req, res) {
		var criterio = { serial: req.session.usuario.serial};
		
		var serial = { 
			tratamiento: {
				A: {
					medicamento: req.body.tratamientoAMedicamento,
					pastillas: parseInt(req.body.tratamientoAPastillas)
				},
				B: {
					medicamento: req.body.tratamientoBMedicamento,
					pastillas: parseInt(req.body.tratamientoBPastillas)
				}
			} 
		};
		
		gestorBD.serials.obtenerSerials(criterio, function(serialGet){
			//Conocer si el numero de pastillas del tratamiento de cada uno de los pastillero quiere
			//modificarse
			var tratamientoAMod = (serial.tratamiento.A.pastillas !== serialGet[0].tratamiento.A.pastillas);
			var tratamientoBMod = (serial.tratamiento.B.pastillas !== serialGet[0].tratamiento.B.pastillas);
			
			var criterio = {
				serial: req.session.usuario.serial,
				unixtime: { $gte: util.unixTimezoneNow() }
			};
			
			//Obtener siguientes horarios programados, de todos los pastilleros
			gestorBD.horarios.obtenerProgramacion(criterio, function(horarios){
				var programadasA = false;
				var programadasB = false;
				
				horarios.forEach(function(horario){
					if(horario.pastillero === 'A'){
						programadasA = true;
					}else if(horario.pastillero === 'B'){
						programadasB = true;
					}
				});
				
				//Error si quiere modificarse el numero de pastillas del tratamiento de un pastillero
				//y este ya ha comenzado o dispone de horarios ya programados
				if((tratamientoAMod && (programadasA || serialGet[0].posicion.A !== 0)) ||
						(tratamientoBMod && (programadasB || serialGet[0].posicion.B !== 0))){
					req.session.error = {
						mensaje: 'No puede modificarse el número de pastillas del tratamiento de ' +
							'un pastillero si ya ha comenzado el tratamiento o dispone de horarios programados',
						tipo: 'TRATAMIENTO'
					};
					
					res.redirect('/dashboard/settings');
				}else{
					var criterio = { serial: req.session.usuario.serial};
					
					gestorBD.serials.modificarSerial(criterio, serial, function(result) {
						if(result === null){
							req.session.error = {
								mensaje: 'Error al modificar tratamiento. Inténtelo de nuevo más tarde',
								tipo: 'GENERAL'
							};
							
							res.redirect('/dashboard/settings');
						}else{
							req.session.success = 'Tratamiento modificado con éxito';
							
							res.redirect('/dashboard/settings');
						}
					});
				}
			});
		});
	});
	
	//DASHBOARD(AJUSTES/TOMA) - POST tiempo de espera, sensor de deteccion y btn confirmacion
	app.post("/dashboard/settings/take", function(req, res) {
		var criterio = { serial: req.session.usuario.serial};
		
		var serial = { 
			toma: {
				tiempoespera: parseInt(req.body.tiempoEspera),
				irdeteccion: (req.body.deteccion === 'si'),
				btnconfirmacion: (req.body.btnConfirmacion === 'si')
			} 
		};
		
		gestorBD.serials.obtenerSerials(criterio, function(serialGet){
			//Conocer si el tiempo de espera requiere modificarse
			var tiempoEsperaMod = (serial.toma.tiempoespera !== serialGet[0].toma.tiempoespera);
			
			var criterio = {
				serial: req.session.usuario.serial,
				unixtime: { $gte: util.unixTimezoneNow() }
			};
			
			//Obtener siguientes horarios programados, de todos los pastilleros
			gestorBD.horarios.obtenerProgramacion(criterio, function(horarios){
				//ERROR: Dispone de horarios programados (alguno o ambos pastilleros) y 
				//requiere de modificacion del tiempo de espera de toma de medicacion
				if(tiempoEsperaMod && horarios.length > 0){
					req.session.error = {
						mensaje: 'No puede modificarse el tiempo de espera de toma de medicación ' +
							'si se dispone de horarios programados',
						tipo: 'TOMA'
					};
					
					res.redirect('/dashboard/settings');
				//OK: No dispone de horarios programados o no se requiere modificar el tiempo de espera
				}else{
					var criterio = { serial: req.session.usuario.serial};
					
					gestorBD.serials.modificarSerial(criterio, serial, function(result) {
						if(result === null){
							req.session.error = {
								mensaje: 'Error al modificar ajustes de toma de medicación. Inténtelo de nuevo más tarde',
								tipo: 'GENERAL'
							};
							
							res.redirect('/dashboard/settings');
						}else{
							req.session.success = 'Ajustes de toma de medicación modificados con éxito';
							
							res.redirect('/dashboard/settings');
						}
					});
				}
			});
		});
	});
	
	//DASHBOARD(AJUSTES/DISPENSADOR) - POST led notificacion y zumbador
	app.post("/dashboard/settings/dispenser", function(req, res) {
		var criterio = { serial: req.session.usuario.serial};
		
		var serial = { 
			dispensador: {
				lednotificacion: (req.body.ledNotificacion === 'si'),
				sonidonotificacion: {
					estado: (req.body.sonidoNotificacionEstado === 'si')
				}
			} 
		};
		
		//Almacenar tiempo si se ha elegido sonido de notificacion, null en caso contrario
		if(serial.dispensador.sonidonotificacion.estado){
			serial.dispensador.sonidonotificacion.valor = parseInt(req.body.sonidoNotificacionValor);
		}else{
			serial.dispensador.sonidonotificacion.valor = null;
		}
		
		gestorBD.serials.modificarSerial(criterio, serial, function(result) {
			if(result === null){
				req.session.error = {
					mensaje: 'Error al modificar ajustes del dispensador. Inténtelo de nuevo más tarde',
					tipo: 'GENERAL'
				};
				
				res.redirect('/dashboard/settings');
			}else{
				req.session.success = 'Ajustes del dispensador modificados con éxito';
				
				res.redirect('/dashboard/settings');
			}
		});
	});
	
	//DASHBOARD(AJUSTES/NOTIFICACIONES) - POST sin conexion, quedan pocas, temperatura, humedad, gas y caida
	app.post("/dashboard/settings/notifications", function(req, res) {
		var criterio = { serial: req.session.usuario.serial};
		
		var serial = { 
			configuracionnotificaciones: {
				sinconexion: {
					estado: (req.body.sinConexionEstado === 'si')
				},
				pocaspastillas: {
					estado: (req.body.pocasPastillasEstado === 'si')
				},
				temperatura: {
					estado: (req.body.temperaturaEstado === 'si')
				},
				humedad: {
					estado: (req.body.humedadEstado === 'si')
				},
				detecciongas: (req.body.deteccionGas === 'si'),
				deteccioncaida: (req.body.deteccionCaida === 'si')
			} 
		};
		
		//Almacenar tiempo si se ha elegido notificacion "sin conexion", null en caso contrario
		if(serial.configuracionnotificaciones.sinconexion.estado){
			serial.configuracionnotificaciones.sinconexion.valor = parseInt(req.body.sinConexionValor);
		}else{
			serial.configuracionnotificaciones.sinconexion.valor = null;
		}
		
		//Almacenar pastillas si se ha elegido notificacion "pocas pastillas", null en caso contrario
		if(serial.configuracionnotificaciones.pocaspastillas.estado){
			serial.configuracionnotificaciones.pocaspastillas.valor = parseInt(req.body.pocasPastillasValor);
		}else{
			serial.configuracionnotificaciones.pocaspastillas.valor = null;
		}
		
		//Almacenar temperatura max y min si se ha elegido notificacion "temperatura", null en caso contrario
		if(serial.configuracionnotificaciones.temperatura.estado){
			serial.configuracionnotificaciones.temperatura.min = parseInt(req.body.temperaturaMin);
			serial.configuracionnotificaciones.temperatura.max = parseInt(req.body.temperaturaMax);
		}else{
			serial.configuracionnotificaciones.temperatura.min = null;
			serial.configuracionnotificaciones.temperatura.max = null;
		}
		
		//Almacenar humedad max y min si se ha elegido notificacion "humedad", null en caso contrario
		if(serial.configuracionnotificaciones.humedad.estado){
			serial.configuracionnotificaciones.humedad.min = parseInt(req.body.humedadMin);
			serial.configuracionnotificaciones.humedad.max = parseInt(req.body.humedadMax);
		}else{
			serial.configuracionnotificaciones.humedad.min = null;
			serial.configuracionnotificaciones.humedad.max = null;
		}
		
		gestorBD.serials.modificarSerial(criterio, serial, function(result) {
			if(result === null){
				req.session.error = {
					mensaje: 'Error al modificar ajustes de notificaciones. Inténtelo de nuevo más tarde',
					tipo: 'GENERAL'
				};
				
				res.redirect('/dashboard/settings');
			}else{
				req.session.success = 'Ajustes de notificaciones modificados con éxito';
				
				res.redirect('/dashboard/settings');
			}
		});
	});
};