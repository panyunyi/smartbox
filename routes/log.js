'use strict';
var AV = require('leanengine');
var Todo = AV.Object.extend('Todo');

function WorkOn(data){
	var todo=new Todo();
	todo.set('ip',data.ip);
	todo.set('api',data.api);
	todo.set('deviceId',data.deviceId);
	todo.set('content',data.msg);
	todo.save().then(function(){

	},function(error){
		console.log(error);
	});
}
exports.WorkOn = WorkOn;
