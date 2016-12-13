'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var async = require('async');
var ApiLog=require('./log');

//基础数据
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

router.get('/customer',function(req,res){
    var query=new AV.Query('Customer');
    query.equalTo('isDel',false);
    query.find().then(function(results){
        res.jsonp({"data":results});
    });
});

router.get('/product',function(req,res){
    var query=new AV.Query('Product');
    query.equalTo('isDel',false);
    query.include('type');
    query.find().then(function(results){
        async.map(results,function(result,callback){
            result.set('type',result.get('type')?result.get('type').get('name'):null);
            callback(null,result);
        },function(err,data){
            res.jsonp({"data":data});
        });
    });
});

router.get('/category',function(req,res){
    var query=new AV.Query('Assortment');
    query.equalTo('isDel',false);
    query.find().then(function(results){
        res.jsonp({"data":results});
    });
});

//客户管理
router.get('/customerProduct',function(req,res){

});

router.get('/employee',function(req,res){

});

router.get('/empCard',function(req,res){

});

router.get('/empPower',function(req,res){

});

//售货机管理
router.get('/box',function(req,res){

});
router.get('/passage',function(req,res){

});
router.get('/takeout',function(req,res){

});

//补货业务
router.get('/supply',function(req,res){

});

//借还业务
router.get('/borrow',function(req,res){

});

//盘点业务
router.get('/checklist',function(req,res){

});

router.get('/checkrecord',function(req,res){

});

//仓库管理
router.get('/storehouse',function(req,res){

});

//数据报表
router.get('/charts',function(req,res){

});
module.exports = router;
