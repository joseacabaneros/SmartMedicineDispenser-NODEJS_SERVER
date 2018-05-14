module.exports = function(app, gestorBD, util, senderEmails, handlerTelegramBot) {
	
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
				//Ordenar horarios por pastillero
				horarios.sort(function (horario1, horario2) {
				  if (horario1.pastillero < horario2.pastillero){
					    return -1;
					  }if (horario1.pastillero > horario2.pastillero){
					    return 1;
					  }
					  return 0;
				});
				
				var strJson = {};
				strJson["Numero horarios"] = horarios.length;
				var hprogramados = 'Horarios programados';
				strJson[hprogramados] = [];
				var configHorarios = 'Configuracion horarios';
				strJson[configHorarios] = [];
				
				//Comprobar posicion actual del/los pastillero/s
				var criterio = { serial : req.params.serial };
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
								var pastTratamiento = serial[0].tratamiento[h.pastillero].pastillas;
								
								//Todas las pastillas serán dispensadas; avanzar hasta
								//posicionar el pastillero en 0
								if(posicionFinal === pastTratamiento){
									pastillas += (13 - pastTratamiento);
								}
								
								var dataHorario = {
									id: h._id,
									unixtimetoma: h.unixtime,
						            pastillero: h.pastillero,
						            pastillas: String(pastillas)
								};
								
								strJson[hprogramados].push(dataHorario);
							}
						}
					});
					
					//Configuracion horarios (Toma de medicacion y Dispensador)
					//T.Espera(segundos), IR, Btn confirmacion, led not, zum not, segundos zumbador
					var configuracion = {
						tespera: String(serial[0].toma.tiempoespera * 60),
						ir: String(serial[0].toma.irdeteccion), 
						btn: String(serial[0].toma.btnconfirmacion),
						led: String(serial[0].dispensador.lednotificacion),
						zumbador: String(serial[0].dispensador.sonidonotificacion.estado),
						tzumbador: String(serial[0].dispensador.sonidonotificacion.valor)
					};
					strJson[configHorarios].push(configuracion);
					
					res.status(200);
					res.setHeader('Content-Type', 'application/json');
			        res.json(strJson);
				});	
			}
		});
	}
	
	function updateUltimoPing(req, res, serial){
		var criterio = { serial : serial };
		
		gestorBD.serials.obtenerSerials(criterio, function(serials){
			if (serials === null || serials.length === 0){
				res.status(204);
				res.send();
			} else {
				serials[0].ultimoping = util.unixTimezoneNow();
				gestorBD.serials.modificarSerial(criterio, serials[0], function(result) {
					if(result === null){
						res.status(204);
						res.send();
					}else{
						//Consultar si toca dispensar medicamento
						getHorariosToca(req, res);
					}
				});
			}
		});
	}
	
	//------------------------------------ GET API ---------------------------------------------
	//156.35.98.12:8081/api/schedule/xxxxx-xxxxx-xxxxx-xxxxx-xxxxx?temp=20.2&hume=75&icalor=19.8&gas=0&vibracion=0
	app.get("/api/schedule/:serial", function(req, res) {
		//----------------- Almacenar datos: ping, temperatura, humedad, gas -------------------
		//console.log(req.query);
		
		//Se almacenan los ping en rangos de 10 minutos, por ello los minutos de cada
		//fecha y hora son multiplos de 10
		var minutos = parseInt(util.moment().minute()/10) * 10;
		var momentParseMin = util.moment().startOf('hour').minutes(minutos);
		var unixtime = util.unixTimezoneParam(momentParseMin);
		
		var datoTemp = {
			temperatura: parseFloat(req.query.temp),
			humedad: parseFloat(req.query.hume),
			icalor: parseFloat(req.query.icalor),
			gas: (req.query.gas === '1'),
			vibracion: (req.query.vibracion === '1')
		};

		var criterio = { serial: req.params.serial};
		
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
				
				//NOTIFICACIONES
				//Notificacion de Deteccion de Vibracion (caida) [Si esta activada la opcion en la configuracion]
				if(serials[0].configuracionnotificaciones.deteccioncaida && datoTemp.vibracion){
					//EMAIL
					senderEmails.sendEmail(emailsNot, 'DETECCIÓN CAIDA', 
							req.params.serial, 'Se ha detectado una <b>CAIDA (golpe)</b> del dispensador');
					//TELEGRAM
					handlerTelegramBot.sendMessage(req.params.serial, 
							'📢 [' + req.params.serial + '] 🚩 Se ha detectado una CAIDA (golpe) 🚩 del dispensador');
				}
				//Notificacion de Deteccion de Gas [Si esta activada la opcion en la configuracion]
				if(serials[0].configuracionnotificaciones.detecciongas && datoTemp.gas){
					//EMAIL
					senderEmails.sendEmail(emailsNot, 'DETECCIÓN DE GAS', 
							req.params.serial, 'Se ha detectado <b>GAS</b> en las inmediaciones del dispensador');
					//TELEGRAM
					handlerTelegramBot.sendMessage(req.params.serial, 
							'📢 [' + req.params.serial + '] ⚠ Se ha detectado GAS ⚠ en las ' + 
							'inmediaciones del dispensador');
				}
				//Notificacion de Temperatura [Si esta activada la opcion en la configuracion]
				if(serials[0].configuracionnotificaciones.temperatura.estado){
					//Temperatura baja
					if(datoTemp.temperatura < serials[0].configuracionnotificaciones.temperatura.min){
						//EMAIL
						senderEmails.sendEmail(emailsNot, 'TEMPERATURA BAJA', 
								req.params.serial, 'La <b>TEMPERATURA (' + datoTemp.temperatura + ' Cº)</b> es' + 
								' menor a al mínimo establecido en la configuración del dispensador');
						//TELEGRAM
						handlerTelegramBot.sendMessage(req.params.serial, 
								'📢 [' + req.params.serial + '] La 📉 TEMPERATURA (' + datoTemp.temperatura + ' Cº) 📉 ' + 
								'es menor a al mínimo establecido en la configuración del dispensador');
					}
					//Temperatura alta
					if(datoTemp.temperatura > serials[0].configuracionnotificaciones.temperatura.max){
						senderEmails.sendEmail(emailsNot, 'TEMPERATURA ALTA', 
								req.params.serial, 'La <b>TEMPERATURA (' + datoTemp.temperatura + ' Cº)</b> es' + 
								' mayor a al máximo establecido en la configuración del dispensador');
						//TELEGRAM
						handlerTelegramBot.sendMessage(req.params.serial, 
								'📢 [' + req.params.serial + '] La 📈 TEMPERATURA (' + datoTemp.temperatura + ' Cº) 📈 ' + 
								'es mayor a al máximo establecido en la configuración del dispensador');
					}
				}
				//Notificacion de Humedad [Si esta activada la opcion en la configuracion]
				if(serials[0].configuracionnotificaciones.humedad.estado){
					//Humedad baja
					if(datoTemp.humedad < serials[0].configuracionnotificaciones.humedad.min){
						//EMAIL
						senderEmails.sendEmail(emailsNot, 'HUMEDAD BAJA', 
								req.params.serial, 'La <b>HUMEDAD (' + datoTemp.humedad + ' %)</b> es' + 
								' menor a al mínimo establecido en la configuración del dispensador');
						//TELEGRAM
						handlerTelegramBot.sendMessage(req.params.serial, 
								'📢 [' + req.params.serial + '] La 📉 HUMEDAD (' + datoTemp.humedad + ' %) 📉 ' + 
								'es menor a al mínimo establecido en la configuración del dispensador');
					}
					//Humedad alta
					if(datoTemp.humedad > serials[0].configuracionnotificaciones.humedad.max){
						//EMAIL
						senderEmails.sendEmail(emailsNot, 'HUMEDAD ALTA', 
								req.params.serial, 'La <b>HUMEDAD (' + datoTemp.humedad + ' %)</b> es' + 
								' mayor a al máximo establecido en la configuración del dispensador');
						//TELEGRAM
						handlerTelegramBot.sendMessage(req.params.serial, 
								'📢 [' + req.params.serial + '] La 📈 HUMEDAD (' + datoTemp.humedad + ' %) 📈 ' + 
								'es mayor a al máximo establecido en la configuración del dispensador');
					}
				}
				
				var criterio = { unixtime: unixtime };
				
				gestorBD.datos.obtenerDatos(criterio, function(datos) {
					//Insertar una nueva fecha de pings, temperatura, humedad, icalor, gas y vibracion
					if(datos === null || datos.length === 0){
						var dato = {
							serial: req.params.serial,
							unixtime: unixtime,
							pings: 1,
							temperatura: datoTemp.temperatura,
							humedad: datoTemp.humedad,
							icalor: datoTemp.icalor,
							gas: datoTemp.gas,
							vibracion: datoTemp.vibracion
						};
						
						gestorBD.datos.insertarDato(dato, function(id){
							if (id === null){
								//204 - Error conexion MongoDB
								res.status(204);
								res.send();
							}else{
								//Actualizar serial con la fecha (unixtime) del ultimo ping
								//Despues, consultar si toca dispensar medicamento
								updateUltimoPing(req, res, req.params.serial);
							}
						});
					//Aumentar en 1 los pings de dicha fecha-hora multiplo de 10 minutos
					//Media de temperatura, humedad e icalor
					//Registrar si ha habido gas o vibracion
					}else{
						var criterio = { "_id" : gestorBD.mongo.ObjectID(datos[0]._id) };
						
						//Actualizar datos
						datos[0].pings++;
						datos[0].temperatura = Math.round(((datos[0].temperatura + datoTemp.temperatura) / 2) * 100) / 100;
						datos[0].humedad = Math.round(((datos[0].humedad + datoTemp.humedad) / 2) * 100) / 100;
						datos[0].icalor = Math.round(((datos[0].icalor + datoTemp.icalor) / 2) * 100) / 100;
						if(!datos[0].gas && datoTemp.gas){
							datos[0].gas = true;
						}
						if(!datos[0].vibracion && datoTemp.vibracion){
							datos[0].vibracion = true;
						}
						
						gestorBD.datos.actualizarDato(criterio, datos[0], function(result) {
							if (result === null){
								//204 - Error conexion MongoDB
								res.status(204);
								res.send();
							}else{
								//Actualizar serial con la fecha (unixtime) del ultimo ping
								//Despues, consultar si toca dispensar medicamento
								updateUltimoPing(req, res, req.params.serial);
							}
						});
					}
				});
			});
		});
	});

};