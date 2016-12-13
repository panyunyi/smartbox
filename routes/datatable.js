'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var async = require('async');
var ApiLog=require('./log');
var moment=require('moment');

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
            result.set('price',"¥"+result.get('price'));
            result.set('spec',result.get('spec')+"(cm)");
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
    var query=new AV.Query('CustomerProduct');
    query.equalTo('isDel',false);
    query.include('product');
    query.include('cusId');
    query.find().then(function(results){
        async.map(results,function(result,callback){
            result.set('product',result.get('product').get('name'));
            result.set('cusId',result.get('cusId').get('name'));
            result.set('cusProductPrice',"¥"+result.get('cusProductPrice'));
            callback(null,result);
        },function(err,data){
            res.jsonp({"data":data});
        });
    });
});

router.get('/employee',function(req,res){
    var query=new AV.Query('Employee');
    query.include('cusId');
    var jsondata=[];
    query.find().then(function(results){
        async.map(results,function(result,callback1){
            result.set('isDel',result.get('isDel')?"停用":"启用");
            result.set('sex',result.get('sex')?"男":"女");
            result.set('cusId',result.get('cusId').get('name'));
            result.set('job',result.get('job')?result.get('job'):"");
            async.map(result.get('card'),function(cardId,callback2){
                var card=AV.Object.createWithoutData('EmployeeCard',cardId);
                card.fetch().then(function(one){
                    if(!one.get('isDel')){
                        callback2(null,one.get('card'));
                    }
                });
            },function(err,cards){
                result.set('card',cards);
                jsondata.push(result);
                callback1(null,results);
            });
            //callback1(null,result);
        },function(err,data){
            res.jsonp({"data":jsondata});
        });
    });
});

router.get('/empPower',function(req,res){
    var query=new AV.Query('EmployeePower');
    query.include('boxId');
    query.include('product');
    query.equalTo('isDel',false);
    query.find().then(function(results){
        results.forEach(function(result){
            result.set('boxId',result.get('boxId').get('deviceId'));
            result.set('product',result.get('product').get('name'));
            var unit="";
            if(result.get('unit')=="month"){
                unit="月";
            }else if(result.get('unit')=="day"){
                unit="日";
            }else if(result.get('unit')=="year"){
                unit="年";
            }
            result.set('unit',unit);
            result.set('begin',new moment(result.get('begin')).format('L'));
        });
        res.jsonp({"data":results});
    });
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
