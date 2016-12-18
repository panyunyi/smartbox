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
    query.include('boxId.cusId');
    query.include('product');
    query.equalTo('isDel',false);
    query.find().then(function(results){
        results.forEach(function(result){
            result.set('cus',result.get('boxId').get('cusId').get('name'));
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
    var query=new AV.Query('BoxInfo');
    query.equalTo('isDel',false);
    query.include('cusId');
    query.find().then(function(results){
        results.forEach(function(result){
            result.set('cusId',result.get('cusId').get('name'));
            result.set('isLive',result.get('isLive')?"联机":"未联机");
        });
        res.jsonp({"data":results});
    });
});

router.get('/passtock',function(req,res){
    var query=new AV.Query('Passage');
    query.equalTo('isDel',false);
    query.include('boxId');
    query.include('boxId.cusId');
    query.include('product');
    query.find().then(function(results){
        results.forEach(function(result){
            result.set('cus',result.get('boxId').get('cusId').get('name'));
            result.set('boxId',result.get('boxId').get('deviceId'));
            result.set('type',result.get('flag')?"格子柜":"售货机");
            result.set('sku',result.get('product').get('sku'));
            result.set('product',result.get('product').get('name'));
            result.set('seqNo',result.get('flag')?result.get('flag')+result.get('seqNo'):result.get('seqNo'));
        });
        res.jsonp({"data":results});
    });
});

//售货机交易记录
router.get('/pasrecord',function(req,res){
    var takeoutQuery=new AV.Query('TakeOut');
    var borrowQuery=new AV.Query('Borrow');
    var jsondata=[];
    function promise1(callback){
        takeoutQuery.equalTo('isDel',false);
        takeoutQuery.equalTo('result',true);
        takeoutQuery.include('product');
        takeoutQuery.include('product.type');
        takeoutQuery.find().then(function(takeouts){
            takeouts.forEach(function(takeout){
                var deviceId=takeout.get('deviceId');
                var card=takeout.get('card');
                var empQuery=new AV.Query('Employee');
                empQuery.equalTo('isDel',false);
                empQuery.include('cusId');
                empQuery.equalTo('card',card);
                empQuery.first().then(function(emp){
                    console.log(emp);
                    var onetake={"time":takeout.get('time'),"type":"领料","objectId":
                takeout.get('id'),"cus":emp.get('cusId').get('name'),"deviceId":
                deviceId,"passage":takeout.get('passage'),"sku":takeout.get('product').get('sku'),
                "product":takeout.get('product').get('name'),"count":-1,"assortment":
                takeout.get('product').get('type').get('name'),"employee":emp.get('name'),
                "empNo":emp.get('empNo'),"empCard":card};
                    jsondata.push(onetake);
                    console.log(onetake);
                    return callback(null,onetake);
                });
            });
        });
    }
    function promise2(callback){
        borrowQuery.equalTo('isDel',false);
        borrowQuery.equalTo('result',true);
        borrowQuery.include('product');
        borrowQuery.include('product.type');
        borrowQuery.find().then(function(borrows){
            borrows.forEach(function(borrow){
                var deviceId=takeout.get('deviceId');
                var card=takeout.get('card');
                var empQuery=new AV.Query('Employee');
                empQuery.equalTo('isDel',false);
                empQuery.include('cusId');
                empQuery.contains('card',card);
                empQuery.first().then(function(emp){
                    var onetake={"time":takeout.get('time'),"type":"借还","objectId":
                takeout.get('id'),"cus":emp.get('cusId').get('name'),"deviceId":
                deviceId,"passage":takeout.get('passage'),"sku":takeout.get('product').get('sku'),
                "product":takeout.get('product').get('name'),"count":-1,"assortment":
                takeout.get('product').get('type').get('name'),"employee":emp.get('name'),
                "empNo":emp.get('empNo'),"empCard":card};
                    jsondata.push(onetake);
                    return callback(null,onetake);
                });
            });
        });
    }
    async.parallel([
        function (callback){
            promise1(callback);
        },
        function (callback){
            promise2(callback);
        }],function(err,results){
        res.jsonp({"data":jsondata});
    });
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
