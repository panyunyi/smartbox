'use strict';
var router = require('express').Router();
var ApiLog=require('./log');
var AV = require('leanengine');
var async = require('async');
var Borrow = AV.Object.extend('Borrow');

function doWork(cus,box,deviceId,card,passage,res){
    var flag=false;
    var resdata={};
    var message="无权限";
    resdata["result"]=flag;
    var oneborrow=new Borrow();

    function promise1(callback){
        var cardQuery=new AV.Query('EmployeeCard');
        cardQuery.equalTo('card',card);
        cardQuery.equalTo('isDel',false);
        cardQuery.equalTo('cusId',cus);
        cardQuery.include('emp');
        cardQuery.first().then(function(cardObj){
            if (typeof(cardObj) == "undefined") {
                return callback(null,0,null);
            }
            oneborrow.set('isDel',false);
            oneborrow.set('box',box);
            oneborrow.set('time',new Date());
            oneborrow.set('card',cardObj);
            oneborrow.set('result',false);
            oneborrow.set('borrow',true);
            oneborrow.save();
            return callback(null,1,cardObj.get('emp'));
        },function(error){
            return callback(error);
        });
    }
    function promise2(arg1,arg2,callback){
        if(arg1==0){
            return callback(null,false,null);
        }
        var passageQuery=new AV.Query('Passage');
        passageQuery.equalTo('isDel',false);
        passageQuery.equalTo('flag',passage.substr(0,1));
        passageQuery.equalTo('isSend',false);
        //passageQuery.equalTo('borrowState',false);
        passageQuery.equalTo('seqNo',passage.substr(1,2));
        passageQuery.equalTo('boxId',box);
        //passageQuery.equalTo('used',null);
        passageQuery.first().then(function(passageObj){
            oneborrow.set('passage',passageObj);
            oneborrow.set('product',passageObj.get('product'));
            oneborrow.save();
            if(passageObj.get('borrowState')||passageObj.get('used')!=null){
                message="格子柜为借出状态";
                return callback(null,false,null);
            }
            return callback(null,passageObj,arg2);
        },function(error){
            return callback(error);
        });
    }
    function promise3(arg1,arg2,callback){
        if (typeof(arg1) == "undefined"||arg1==false||arg2==null) {
            return callback(null,false);
        }
        var product=arg1.get('product');
        var empPower=arg2.get('power');
        async.mapSeries(empPower,function(emppower,callback1){
            var powerQuery=new AV.Query('EmployeePower');
            powerQuery.equalTo('objectId',emppower);
            powerQuery.equalTo('isDel',false);
            powerQuery.first().then(function(power){
                if (typeof(power)!="undefined") {
                    verifyPower(product,power,callback1,callback);
                }
            },function(error){
                return callback(error);
            });
        },function(error,results){
            return callback(null,flag);
        });
    }
    function verifyPower(product,power,callback,callback1){
        if(power.get('boxId').get('id')==box.get('id')&&power.get('product').get('id')==product.get('id')){
            flag=true;
            oneborrow.set('result',true);
            oneborrow.save().then(function(one){
                message="";
                resdata["result"]=flag;
                resdata["objectId"]=one.id;
                var passage=one.get('passage');
                passage.set('borrowState',true);
                passage.increment('stock',-1);
                passage.set('used',one.get('card').get('emp'));
                passage.save().then(function(){
                    callback(null,true);
                    return callback1(null,true);
                });
            });
        }else{
            message="无权限";
            callback(null,false);
        }
    }
    async.waterfall([
        function (callback){
            promise1(callback);
        },
        function (arg1,arg2,callback){
            promise2(arg1,arg2,callback);
        },
        function (arg1,arg2,callback){
            promise3(arg1,arg2,callback);
        }],function(err,results){
        var result={
            status:200,
            message:message,
            data:resdata,
            server_time:new Date()
        }
        res.jsonp(result);
    });
}

router.get('/:id/:card/:passage', function(req, res) {
    var deviceId=req.params.id;
    var card=req.params.card;
    var passage=req.params.passage;
    var todo={"ip":req.headers['x-real-ip'],"api":"借货判断接口","deviceId":deviceId,"msg":"card:"+card+",passage:"+passage};
    ApiLog.WorkOn(todo);
    var boxQuery=new AV.Query('BoxInfo');
    boxQuery.equalTo('deviceId',deviceId);
    boxQuery.include('cusId');
    boxQuery.first().then(function (box){
        if (typeof(box) == "undefined") {
          var result={
            status:200,
            message:"无此设备号的数据",
            data:{"result":false},
            server_time:new Date()
          }
          res.jsonp(result);
          return;
        }
        var cus=box.get('cusId');
        doWork(cus,box,deviceId,card,passage,res);
    },function (error){
        console.log(error);
        var result={
          status:200,
          message:"查询出错",
          data:{"result":false},
          server_time:new Date()
        }
        res.jsonp(result);
    });
});

router.get('/fail/:id', function(req, res) {
    var result={
      status:200,
      message:"设备号或objectId有误",
      data:false,
      server_time:new Date()
    }
    var todo={"ip":req.headers['x-real-ip'],"api":"借货失败回调接口","deviceId":"","msg":"objectId:"+req.params.id};
    ApiLog.WorkOn(todo);
    var borrow=AV.Object.createWithoutData('Borrow',req.params.id);
    borrow.set('result',false);
    borrow.set('borrow',true);
    borrow.save();
    borrow.fetch().then(function(){
        result['message']="";
        result['data']=true;
        res.jsonp(result);
        var passage=borrow.get('passage');
        passage.set('borrowState',false);
        passage.increment('stock',1);
        passage.set('used',null)
        passage.save();
    },function(error){
        res.jsonp(result);
    });
});
module.exports = router;
