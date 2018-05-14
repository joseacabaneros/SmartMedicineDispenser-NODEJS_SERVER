//*****************************  MÓDULOS  ****************************
var express = require('express');
var app = express();
app.use(express.static('public'));

//Favicon
var favicon = require('serve-favicon');
app.use(favicon(__dirname + '/public/img/favicon.ico'));

//Sesion
var expressSession = require('express-session');
app.use(expressSession({
    secret: 'abcdefg',
    resave: true,
    saveUninitialized: true,
    cookie: { 
    	//Caducar sesion despues de 10 minutos sin uso
    	maxAge: 10 * 60 * 1000
	}
}));

//Encriptar password usuario
var crypto = require('crypto');

var rest = require('request');
app.set('rest',rest); 

//Base de datos MongoDB
var mongo = require('mongodb');
var gestorBD = require("./db/db.gestor.js");
gestorBD.init(app, mongo);

//Swig - HTML dinamico y distribuido 
var swig = require('swig');

//Parser de formularios
var bodyParser = require('body-parser');
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true })); 

//Control de usos horarios
var moment = require('moment-timezone');

//Control de usos horarios
var util = require("./util/util.js");
util.init(moment);

//Envio de correos de notificacion
var nodemailer = require('nodemailer');
var senderEmails = require("./util/senderEmails.js");

//Rutina de comprobacion de "Sin Conexion" de dispensadores registrados
var scheduleSinConexion = require("./util/scheduleSinConexion.js");

//Telegram bot "SmartMedicineDispenser"
process.env["NTBA_FIX_319"] = 1;
var TelegramBot = require('node-telegram-bot-api');
var token = '584216354:AAE-edHEpXld-bR3pj_duCoTWoMiuNWtpfQ';
var bot = new TelegramBot(token, {polling: true});
var handlerTelegramBot = require("./util/handlerTelegramBot.js");
//*******************************************************************


//*****************************  ROUTER  ****************************
//RouterUSUARIOSession
var routerUsuarioSession = express.Router(); 
routerUsuarioSession.use(function(req, res, next){
	//console.log("routerUsuarioSession");
	var usuario = req.session.usuario;
	if(usuario !== undefined && usuario.tipo === "USUARIO"){
		next();
	}else{
		res.redirect("/login");
	}
});
//Aplicar RouterUSUARIOSession
app.use("/dashboard", routerUsuarioSession);

//RouterADMINSession
var routerAdminSession = express.Router(); 
routerAdminSession.use(function(req, res, next){
	 //console.log("routerAdminSession");
	 var usuario = req.session.usuario;
	 if(usuario !== undefined && usuario.tipo === "ADMIN"){
		 next();
	 }else{
		 res.redirect("/login");
	 }
});
//Aplicar RouterADMINSession
app.use("/admin", routerAdminSession);
//*******************************************************************


//*****************************  VARIABLES  *************************
app.set('port', 8081);
app.set('db','mongodb://localhost:27017/smartmedicinedispenser');
app.set('clave','abcdefg');
app.set('crypto',crypto);
app.set('email','smartmedicinedispenser@gmail.com');
app.set('passemail','smartmedicinedispenser2018');
//*******************************************************************


//*****************************  RUTAS  *****************************
//Controladores por lógica
require("./routes/route.usuarios.js")(app, swig, gestorBD);
require("./routes/route.admin.js")(app, swig, gestorBD, util);
require("./routes/route.general.js")(app, swig, gestorBD);
require("./routes/route.dashboard.js")(app, swig, gestorBD, util);
//API REST de acceso por el 
require("./api/api.get.js")(app, gestorBD, util, senderEmails, handlerTelegramBot);
require("./api/api.post.js")(app, gestorBD, util, senderEmails, handlerTelegramBot);
//Init senderEmails
senderEmails.init(app, nodemailer);
//Init scheduleSinConexion
scheduleSinConexion.init(gestorBD, util, senderEmails, handlerTelegramBot);
//Init handlerTelegramBot
handlerTelegramBot.init(bot, gestorBD, util);
//*******************************************************************


//*******************  MANEJO DE EXCEPCIONES  ***********************
app.use(function (err, req, res, next) {
    console.log("Error producido: " + err); //we log the error in our db
    if (! res.headersSent) { 
        res.status(400);
        res.send("Recurso no disponible");
    }
});
//********************************************************************


app.listen(app.get('port'), function() {
	console.log("Servidor activo");
});