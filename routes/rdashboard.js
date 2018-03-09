module.exports = function(app, swig, gestorBD) {
	
	//DASHBOARD - GET vista
	app.get("/dashboard", function(req, res) {
		var respuesta = swig.renderFile('web/views/dashboard.html', {});
		res.send(respuesta);
	});
	
	//DASHBOARD - POST programacion horarios
	app.post('/dashboard/:pastillero', function (req, res) {
		var usuarioSession = req.session.usuario;
		var nPastillero = req.params.pastillero;
		var formHorario = {
			date: req.body.datepicker,
			time: req.body.timepicker,
			pastillas: req.body.pastillas,
			rep: req.body.rep,
			tomas: req.body.tomas
		};
		
		var parts = formHorario.date.split('/');
		var dateISOstring = parts[2] + "-" + parts[1] + "-" + parts[0] + "T" + formHorario.time + ":00"; 
		console.log(dateISOstring);
		var unixTimestamp = Math.round(new Date(dateISOstring).getTime()/1000);
		console.log(unixTimestamp);
		
		for(var i = 0; i < formHorario.tomas; i++){
			var sumUnixTime = (i * formHorario.rep * 3600) + unixTimestamp;
			
			var horario = {
				serial: usuarioSession.serial,
				unixtime: sumUnixTime,
				pastillero: nPastillero,
				pastillas: formHorario.pastillas,
				tomadaBtn: false,
				tomadaIR: false
			};
			
			gestorBD.insertarProgramacion(horario, function(id) {
				if (id === null){
					req.session.error = {
						mensaje: 'Error al programar horario. Inténtelo de nuevo más tarde',
						tipo: 'GENERAL'
					};
					res.redirect("/dashboard");
				}
			});
		}
		
		res.redirect("/dashboard");
	});
};