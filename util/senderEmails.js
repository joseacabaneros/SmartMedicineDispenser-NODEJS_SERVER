module.exports = {
	app : null,
	transporter : null,
	init : function(app, nodemailer){
		this.app = app;
		this.transporter = nodemailer.createTransport({
		  service: 'gmail',
		  auth: {
		    user: this.app.get('email'),
		    pass: this.app.get('passemail')
		  }
		});
	},
	sendEmail : function(emailsTo, accion, serial, cuerpo){
		var mailOptions = {
		  from: this.app.get('email'),
		  to: emailsTo,
		  subject: '[' + accion + '] Smart Medicine Dispenser',
		  html: '<h1>' + accion + '</h1><h2>' + serial + '</h2><p>' + cuerpo + ' con serial <i>' + serial + 
		  	'</i>.</p><p>Recomendamos ponerse en contacto con el usuario que hace uso del dispensador.</p>' + 
		  	'<p>Atentamente, el equipo de Smart Medicine Dispenser.'
		};

		this.transporter.sendMail(mailOptions, function(error, info){
		  if (error) {
		    console.log(error);
		  } else {
		    console.log('Email sent: ' + info.response);
		  }
		});
	}
};