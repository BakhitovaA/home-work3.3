const express = require("express");
const bodyParser = require("body-parser");
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({"extended": true}));

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/tasklist')

var Schema = mongoose.Schema;

var personSchema = new Schema({
	name: String
})

var Person = mongoose.model('Person', personSchema);

var taskSchema = new Schema({
	title: String,
	description: String,
	state: { type: Boolean, default : true },
	statusTask: String,
	executor: String
})

taskSchema.methods.statusTasks = function () {
	if (this.state == true) {
		this.statusTask = 'Открыта'
	} else {
		this.statusTask = 'Закрыта'
	}
}

var Task = mongoose.model('Task', taskSchema)

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
		
	//Отображение списка пользователей
	app.get("/personlist/", function(req, res) {
		Person.find({}, function (err, docs) {
			if (err) {
				console.log(err);
			} else  {
				if (docs.length) {
					res.send(docs)
				} else {
					res.send('Отсутствуют пользователи');
				}
			}
		});
	});
	
	//Добавление пользователей
	app.get("/personlist/add/", function(req, res) {	
		console.log('Добавляем: ', req.query.name);
		let person = new Person({name : req.query.name});
		person.save(function (err) {
			if (err) {
				return handleError(err);
			} else {
				res.send('Добавлен пользователь: ' + req.query.name)
			}
		})
	});
	
	//Редактирование пользователей
	app.get("/personlist/update/:id", function(req, res) {
		var updateUser = {_id: req.params.id}
		Person.update(updateUser, {name : req.query.name}, (function (err) {
			if (err) {
				return handleError(err);
			} else {
				res.send('Обновлен пользователь: ' + req.query.name)
			}
		}))
	});
	
	//Удаление пользователей
	app.get("/personlist/remove/:id", function(req, res) {
		Person.remove({_id: req.params.id}, (function (err) {
			if (err) {
				return handleError(err);
			} else {
				res.send('Удален пользователь: ' + req.query.name)
			}
		}))
	});	
	
	//Отображение списка задач
	app.get("/tasklist/", function(req, res) {
		Task.find({}, function (err, docs) {
			if (err) {
				console.log(err);
			} else  {
				if (docs.length) {
					res.send(docs)
				} else {
					res.send('Отсутствуют задачи');
				}
			}
		});
	});
	
	//Добавление новой задачи
	app.get("/tasklist/add/", function(req, res) {	
		if (req.query.executor !== undefined) {
			Person.find({name : req.query.executor}, function (err, docs) {
				if (err) {
					console.log(err);
				} else  {
					if (docs.length) {
						let task = new Task({title : req.query.title, description : req.query.description, state : req.query.state, executor : req.query.executor});
						task.statusTasks();
						task.save(function (err) {
							if (err) {
								return handleError(err);
							} else {
								res.send('Добавлена задача: "' + req.query.title + '"')
							}
						})
					} else {
						let task = new Task({title : req.query.title, description : req.query.description, state : req.query.state});
						task.statusTasks();
						task.save(function (err) {
							if (err) {
								return handleError(err);
							} else {
								res.send('Новая задача: "' + req.query.title + '" сохранена, но пользователю не назначена, т.к. такого пользователя не существует');
							}
						})
					}
				}
			});
		} else {
			let task = new Task({title : req.query.title, description : req.query.description, state : req.query.state});
			task.statusTasks();
			task.save(function (err) {
				if (err) {
					return handleError(err);
				} else {
					res.send('Новая задача: "' + req.query.title + '" сохранена');
				}
			})
		}
	});

	//Редактирование задачи
	app.get("/tasklist/update/:id", function(req, res) {
		if (req.query.executor !== undefined) {
			Person.find({name : req.query.executor}, function (err, docs) {
				if (err) {
					console.log(err);
				} else  {
					if (docs.length) {
						var updateTask = {_id: req.params.id}
						if (req.query.state !== undefined) {
							if (req.query.state == 'true') {
								Task.update(updateTask, {title : req.query.title, description : req.query.description, state : req.query.state, statusTask : 'Открыта', executor : req.query.executor}, (function (err) {
									if (err) {
										console.log(err);
									} else {
										res.send('Обновленная задача: "' + req.query.title + '", ' + req.query.description + '. Состояние: Открыта. Назначена пользователю: ' + req.query.executor)
									}
								}))
							} else {
								Task.update(updateTask, {title : req.query.title, description : req.query.description, state : req.query.state, statusTask : 'Закрыта', executor : req.query.executor}, (function (err) {
									if (err) {
										console.log(err);
									} else {
										res.send('Обновленная задача: "' + req.query.title + '", ' + req.query.description + '. Состояние: Закрыта. Исполнивший пользователь: ' + req.query.executor)
									}
								}))
							}
						} else {
							Task.update(updateTask, {title : req.query.title, description : req.query.description, executor : req.query.executor}, (function (err) {
								if (err) {
									console.log(err);
								} else {
									res.send('Обновленная задача: "' + req.query.title + '", ' + req.query.description + '. Пользователь: ' + req.query.executor)
								}
							}))
						}
					} else {
						var updateTask = {_id: req.params.id}
						if (req.query.state !== undefined) {
							if (req.query.state == 'true') {
								Task.update(updateTask, {title : req.query.title, description : req.query.description, state : req.query.state, statusTask : 'Открыта'}, (function (err) {
									if (err) {
										console.log(err);
									} else {
										res.send('Обновленная задача: "' + req.query.title + '", ' + req.query.description + '. Состояние: Открыта. Исполняющий пользователь: не найден в списке пользователей')
									}
								}))
							} else {
								Task.update(updateTask, {title : req.query.title, description : req.query.description, state : req.query.state, statusTask : 'Закрыта'}, (function (err) {
									if (err) {
										console.log(err);
									} else {
										res.send('Обновленная задача: "' + req.query.title + '", ' + req.query.description + '. Состояние: Закрыта. Исполнивший пользователь: не найден в списке пользователей')
									}
								}))
							}
						} else {
							Task.update(updateTask, {title : req.query.title, description : req.query.description}, (function (err) {
								if (err) {
									console.log(err);
								} else {
									res.send('Обновленная задача: "' + req.query.title + '", ' + req.query.description + '. Пользователь не найден в списке пользователей')
								}
							}))
						}
					}
				}
			});
		} else {
			var updateTask = {_id: req.params.id}
			if (req.query.state !== undefined) {
				if (req.query.state == 'true') {
					Task.update(updateTask, {title : req.query.title, description : req.query.description, state : req.query.state, statusTask : 'Открыта'}, (function (err) {
						if (err) {
							console.log(err);
						} else {
							res.send('Обновленная задача: "' + req.query.title + '", ' + req.query.description + '. Состояние: Открыта')
						}
					}))
				} else {
					Task.update(updateTask, {title : req.query.title, description : req.query.description, state : req.query.state, statusTask : 'Закрыта'}, (function (err) {
						if (err) {
							console.log(err);
						} else {
							res.send('Обновленная задача: "' + req.query.title + '", ' + req.query.description + '. Состояние: Закрыта')
						}
					}))
				}
			} else {
				Task.update(updateTask, {title : req.query.title, description : req.query.description}, (function (err) {
					if (err) {
						console.log(err);
					} else {
						res.send('Обновленная задача: "' + req.query.title + '", ' + req.query.description + '.')
					}
				}))
			}
		}
	});
	
	//Удаление задачи
	app.get("/tasklist/remove/:id", function(req, res) {
		Task.remove({_id: req.params.id}, (function (err) {
			if (err) {
				return handleError(err);
			} else {
				res.send('Удалена задача № ' + req.params.id)
			}
		}))
	});	
	
	//Поиск
	app.get("/tasklist/find/", function(req, res) {
		if (req.query.title !== undefined && req.query.description !== undefined) {
			Task.find({title : req.query.title, description : req.query.description}, function (err, docs) {
				if (err) {
					console.log(err);
				} else  {
					if (docs.length) {
						res.send(docs)
					} else {
						res.send('Отсутствуют задачи c заданными условиями поиска');
					}
				}
			});
		} else {
			if (req.query.title !== undefined) {
				Task.find({title : req.query.title}, function (err, docs) {
					if (err) {
						console.log(err);
					} else  {
						if (docs.length) {
							res.send(docs)
						} else {
							res.send('Отсутствуют задачи c заданными условиями поиска');
						}
					}
				});
			} else {
				if (req.query.description !== undefined) {
					Task.find({description : req.query.description}, function (err, docs) {
						if (err) {
							console.log(err);
						} else  {
							if (docs.length) {
								res.send(docs)
							} else {
								res.send('Отсутствуют задачи c заданными условиями поиска');
							}
						}
					});
				} 
			}
		}
	});	
})


app.listen(3000, function () {
	console.log('Подключение к порту: 3000');
});
