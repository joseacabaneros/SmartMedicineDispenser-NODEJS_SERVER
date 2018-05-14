module.exports = {
	bot : null,
	gestorBD : null,
	init : function(bot, gestorBD, util){
		this.bot = bot;
		this.gestorBD = gestorBD;
		
		var regExpSerial = new RegExp('([a-z|A-Z|0-9]){5}-([a-z|A-Z|0-9]){5}-([a-z|A-Z|0-9]){5}' + 
								'-([a-z|A-Z|0-9]){5}-([a-z|A-Z|0-9]){5}');
		
		//Comando /start
		bot.onText(/\/start/, function(msg) {
			bot.sendMessage(msg.chat.id, "💊 ¡Bienvenido! ¿Me puede decir el serial de su dispensador? 💊");
		});
		
		//Resto de mensajes
		bot.on('message', function(msg) {
			if (msg.text.toString().includes('/') && !msg.text.toString().includes('/start')){
				var text = msg.text.toString().split(" ");
				var command = text[0];
				
				//Comando /dispensador XXXXX-XXXXX-XXXXX-XXXXX-XXXXX
				if(command === '/dispensador'){
					if(text.length === 2){
						var serial = text[1];
						if(regExpSerial.test(serial)){
							var criterio = { serial : serial };
							
							gestorBD.serials.obtenerSerials(criterio, function(serials){
								//Serial no existe
								if (serials === null || serials.length === 0){
									bot.sendMessage(msg.chat.id, "❌ El serial introducido no corresponde con ningún" + 
											" dispensador registrado. Compruebe de nuevo el serial.");
								} else {
									gestorBD.datos.obtenerDatos(criterio, function(datos) {
										if(datos.length > 0){
											var ultimoDato = datos[datos.length-1];
											
											var temperatura = ultimoDato.temperatura;
											var humedad = ultimoDato.humedad;
											var icalor = ultimoDato.icalor;
											var gas = (ultimoDato.gas) ? "SI" : "NO";
											var caida = (ultimoDato.vibracion) ? "SI" : "NO";
											var conexion = ((util.unixTimezoneNow() - serials[0].ultimoping) <= 60) ? "SI" : "NO";
											
											bot.sendMessage(msg.chat.id, "📈 Temperatura " + temperatura + " Cº");
											bot.sendMessage(msg.chat.id, "📉 Humedad " + humedad + " %");
											bot.sendMessage(msg.chat.id, "📈 Índice de calor  " + icalor + " Cº");
											bot.sendMessage(msg.chat.id, "⚠ Gas " + gas);
											bot.sendMessage(msg.chat.id, "🚩 Caida " + caida);
											bot.sendMessage(msg.chat.id, "📶 Conexión " + conexion);
										}
									});
								}
							});
						}else{
							bot.sendMessage(msg.chat.id, "❌ El comando /dispensador debe ir seguido del serial de " + 
							"consulta: '/dispensador XXXXX-XXXXX-XXXXX-XXXXX-XXXXX'");
						}
					}else{
						bot.sendMessage(msg.chat.id, "❌ El comando /dispensador debe ir seguido del serial de " + 
								"consulta: '/dispensador XXXXX-XXXXX-XXXXX-XXXXX-XXXXX'");
					}
				}else if(command === '/horarios'){
					if(text.length === 2){
						var serial = text[1];
						if(regExpSerial.test(serial)){
							var criterio = { serial : serial };
							
							gestorBD.serials.obtenerSerials(criterio, function(serials){
								//Serial no existe
								if (serials === null || serials.length === 0){
									bot.sendMessage(msg.chat.id, "❌ El serial introducido no corresponde con ningún" + 
											" dispensador registrado. Compruebe de nuevo el serial.");
								} else {
									var criterio = {
										serial: serial,
										unixtime: { $gte: util.unixTimezoneNow() }
									};
									
									//Obtener siguientes horarios programados, de todos los pastilleros
									gestorBD.horarios.obtenerProgramacion(criterio, function(horarios){
										if (horarios === null || horarios.length === 0){
											bot.sendMessage(msg.chat.id, "El dispensador con serial " + serial +  
													" no dispone de horarios próximos programados.");
										}else{
											horarios.forEach(function(horario){
												var fecha = util.moment(horario.unixtime * 1000).tz('GMT').locale('es')
																.format("dddd, DD MMMM YYYY HH:mm");
												
												bot.sendMessage(msg.chat.id, "📅 Pastillero '" + horario.pastillero + "' - " + 
														horario.pastillas + " pastillas - " + fecha);
											});
										}
									});
								}
							});
						}else{
							bot.sendMessage(msg.chat.id, "❌ El comando /horarios debe ir seguido del serial de " + 
							"consulta: '/horarios XXXXX-XXXXX-XXXXX-XXXXX-XXXXX'");
						}
					}else{
						bot.sendMessage(msg.chat.id, "❌ El comando /horarios debe ir seguido del serial de " + 
						"consulta: '/horarios XXXXX-XXXXX-XXXXX-XXXXX-XXXXX'");
					}
				}else{
					bot.sendMessage(msg.chat.id, "❌ El comando introducido no se corresponde con ninguna acción.");
				}
			}else if(regExpSerial.test(msg.text.toString())){
				var criterio = { serial : msg.text.toString() };
				
				gestorBD.serials.obtenerSerials(criterio, function(serials){
					//Serial no existe
					if (serials === null || serials.length === 0){
						bot.sendMessage(msg.chat.id, "❌ El serial introducido no corresponde con ningún" + 
								" dispensador registrado. Compruebe de nuevo el serial.");
					} else {
						var containsId = serials[0].idstelegram.find(function(id){
							return id === msg.chat.id;
						});
						
						//Ya suscrito a las notificaciones del dispensador con el serial introducido
						if(containsId !== undefined){
							bot.sendMessage(msg.chat.id, "Ya se encuentra suscrito a las notificaciones" + 
								" del dispensador con serial " + msg.text.toString() + ".");
						}else{
							//Suscribir id del usuario a las notificaciones del dispensador con el serial introducido
							serials[0].idstelegram.push(msg.chat.id);
							gestorBD.serials.modificarSerial(criterio, serials[0], function(result) {
								if(result === null){
									bot.sendMessage(msg.chat.id, "❌ Ha habido un problema en el registro de la" + 
											" suscripción. Por favor, inténtelo de nuevo más tarde.");
								}else{
									bot.sendMessage(msg.chat.id, "✅ ¡Suscripción realizada con éxito!" + 
									" Ahora recibirá las notificaciones del dispensador con serial " + 
									msg.text.toString() + " aquí.");
								}
							});
						}
					}
				});
			}else if (!msg.text.toString().includes('/')){
				bot.sendMessage(msg.chat.id, "❌ El formato del serial introducido es incorrecto. " + 
						"Recuerde que debe seguir el siguiente formato XXXXX-XXXXX-XXXXX-XXXXX-XXXXX");
			}
		});
	},
	sendMessage : function(serial, message){
		var criterio = { serial : serial };
		var botAux = this.bot;
		
		this.gestorBD.serials.obtenerSerials(criterio, function(serials){
			var idsTelegramUsuarios = serials[0].idstelegram;
			
			idsTelegramUsuarios.forEach(function(id){
				botAux.sendMessage(id, message);
			});
		});
	}
};