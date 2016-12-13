'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var async = require('async');
var ApiLog=require('./log');

router.get('/admincard', function(req, res) {
    var query=new AV.Query('AdminCard');
    query.include('customer');
    query.equalTo('isDel',false);
    query.find().then(function (results){
        var jsondata=[];
        async.map(results,function(result,callback1){
        	async.map(result.get('box'),function(boxId,callback2){
        		var box=AV.Object.createWithoutData('BoxInfo',boxId);
        		box.fetch().then(function(data){
        			callback2(null,data.get('deviceId'));
        		});
        	},function(err,boxes){
           		var one={"card":result.get('card'),"box":boxes,"customer":result.get('customer').get('name')};
            	jsondata.push(one);
            	callback1(null,boxes);
        	});
        },function(err,results2){
        	res.jsonp({"data":jsondata});
        });
        
    });
});

module.exports = router;
