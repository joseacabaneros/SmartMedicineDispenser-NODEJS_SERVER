module.exports = {
	mongo : null,
	app : null,
	init : function(app, mongo){
		this.mongo = mongo;
		this.app = app;
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