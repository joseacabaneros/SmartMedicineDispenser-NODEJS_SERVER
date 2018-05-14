module.exports = {
	init : function(gestorBD, util, senderEmails, handlerTelegramBot){
		var minutes = 1, the_interval = minutes * 60 * 1000;
		
		setInterval(function() {
			var unixTimestampNow = util.unixTimezoneNow();
			
			//NOTIFICACION Sin Conexion [Si esta activada la opcion en la configuracion]
			gestorBD.serials.obtenerSerials({}, function(serials) {
				serials.forEach(function(serial) {
					var sinConexion = serial.configuracionnotificaciones.sinconexion;
					if(sinConexion.estado && 
							(unixTimestampNow >= (serial.ultimoping + (sinConexion.valor*60)))){
						//Solo una notificacion de Sin Conexion
						if((unixTimestampNow - (serial.ultimoping + (sinConexion.valor*60))) < minutes*60){
							var criterio = { serial: serial.serial};
							
							//Obtener emails de usuarios registrados para el serial del usuario
							//iniciado en sesion
							gestorBD.usuarios.obtenerUsuarios(criterio, function(usuarios) {
								var emailsNot = '';
								
								usuarios.forEach(function(usuario) {
									emailsNot += usuario.email + ', ';
								});
								
								//Obtener emails de notificaciones
								serial.emailsnotificacion.forEach(function(email) {
									if(email !== ''){
										emailsNot += email + ', ';
									}
								});
								
								//NOTIFICACION SIN CONEXION
								//EMAIL
								senderEmails.sendEmail(emailsNot, 'SIN CONEXIÓN', 
										serial.serial, 'Notificación <b>SIN CONEXIÓN</b>' + 
										' establecida en la configuración del dispensador');
								//TELEGRAM
								handlerTelegramBot.sendMessage(serial.serial, 
										'📢 [' + serial.serial + '] 📶 DISPENSADOR SIN CONEXIÓN 📶 ');
							});
						}
					}
				});
			});
		}, the_interval);
	}
};