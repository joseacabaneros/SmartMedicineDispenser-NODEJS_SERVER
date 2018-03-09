module.exports = {
	mongo : null,
	app : null,
	init : function(app, mongo){
		this.mongo = mongo;
		this.app = app;
	},
	insertarUsuario: function(usuario, funcionCallback){
		this.mongo.MongoClient.connect(this.app.get('db'), function(err, db){
			if(err){
				funcionCallback(null);
			}else{
				var collection = db.collection('usuarios');
				collection.insert(usuario, function(err, result){
					if (err){
						funcionCallback(null);
					}else{
						funcionCallback(result.ops[0]._id);
					}
					db.close();
				});
			}
		});
	},
	obtenerUsuarios: function(criterio, funcionCallback){
		this.mongo.MongoClient.connect(this.app.get('db'), function(err, db){
			if(err){
				funcionCallback(null);
			}else{
				var collection = db.collection('usuarios');
				collection.find(criterio).toArray(function(err, usuarios){
					if(err){
						funcionCallback(null);
					}else{
						funcionCallback(usuarios);
					}
					db.close();
				});
			}
		});
	},
	insertarSerial: function(serial, funcionCallback){
		this.mongo.MongoClient.connect(this.app.get('db'), function(err, db){
			if(err){
				funcionCallback(null);
			}else{
				var collection = db.collection('serials');
				collection.insert(serial, function(err, result){
					if(err){
						funcionCallback(null);
					}else{
						funcionCallback(result.ops[0]._id);
					}
					db.close();
				});
			}
		});
	},
	obtenerSerials: function(criterio, funcionCallback){
		this.mongo.MongoClient.connect(this.app.get('db'), function(err, db){
			if(err){
				funcionCallback(null);
			}else{
				var collection = db.collection('serials');
				collection.find(criterio).toArray(function(err, serials){
					if(err){
						funcionCallback(null);
					}else{
						funcionCallback(serials);
					}
					db.close();
				});
			}
		});
	},
	modificarSerial: function(criterio, serial, funcionCallback){
		this.mongo.MongoClient.connect(this.app.get('db'), function(err, db){
			if(err){
				funcionCallback(null);
			}else{
				var collection = db.collection('serials');
				collection.update(criterio, {$set: serial}, function(err, result){
					if(err){
						funcionCallback(null);
					}else{
						funcionCallback(result);
					}
					db.close();
				});
			}
		});
	},
	insertarProgramacion: function(horario, funcionCallback){
		this.mongo.MongoClient.connect(this.app.get('db'), function(err, db){
			if(err){
				funcionCallback(null);
			}else{
				var collection = db.collection('horarios');
				collection.insert(horario, function(err, result){
					if(err){
						funcionCallback(null);
					}else{
						funcionCallback(result.ops[0]._id);
					}
					db.close();
				});
			}
		});
	},
	obtenerProgramacion: function(criterio, funcionCallback){
		this.mongo.MongoClient.connect(this.app.get('db'), function(err, db){
			if(err){
				funcionCallback(null);
			}else{
				var collection = db.collection('horarios');
				collection.find(criterio).toArray(function(err, horarios){
					if(err){
						funcionCallback(null);
					}else{
						funcionCallback(horarios);
					}
					db.close();
				});
			}
		});
	},
	actualizarProgramacion: function(criterio, horario, funcionCallback){
		this.mongo.MongoClient.connect(this.app.get('db'), function(err, db){
			if(err){
				funcionCallback(null);
			}else{
				var collection = db.collection('horarios');
				collection.update(criterio, {$set: horario}, function(err, result){
					if(err){
						funcionCallback(null);
					}else{
						funcionCallback(result);
					}
					db.close();
				});
			}
		});
	}
};
