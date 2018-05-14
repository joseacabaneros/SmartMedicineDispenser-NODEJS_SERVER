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
	modificarUsuario: function(criterio, usuario, funcionCallback){
		this.mongo.MongoClient.connect(this.app.get('db'), function(err, db){
			if(err){
				funcionCallback(null);
			}else{
				var collection = db.collection('usuarios');
				collection.update(criterio, {$set: usuario}, function(err, result){
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
	eliminarUsuario: function(criterio, funcionCallback) {
		this.mongo.MongoClient.connect(this.app.get('db'), function(err, db) {
			if (err) {
				funcionCallback(null);
			} else {
				var collection = db.collection('usuarios');
				collection.remove(criterio, function(err, result) {
					if (err) {
						funcionCallback(null);
					} else {
						funcionCallback(result);
					}
					db.close();
				});
			}
		});
	}
};