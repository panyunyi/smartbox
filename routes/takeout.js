'use strict';
var router = require('express').Router();
var ApiLog=require('./log');
var AV = require('leanengine');
var async = require('async');

function doWork(cus,box,deviceId,card,passage,res){
    var flag=false;
    function promise1(callback){
        var cardQuery=AV.Query('EmployeeCard');
        cardQuery.equalTo('card',card);
        cardQuery.equalTo('isDel',false);
        cardQuery.first().then(function(cardObj){
            if (typeof(cardObj) == "undefined") {
                return callback(err,0,null);
            }
            var empQuery=AV.Query('Employee');
            empQuery.equalTo('card',cardObj.get('id'));
            empQuery.equalTo('isDel',false);
            empQuery.first().then(function(data){
                return callback(err,1,data);
            },function(error){
            });
        },function(error){
            return callback(error);
        });
        return callback(err,0,null);
    }
    function promise2(arg1,arg2,callback){
        if(arg1==0){
            return callback(err,false,null);
        }
        var passageQuery=AV.Query('Passage');
        passageQuery.equalTo('isDel',false);
        passageQuery.equalTo('seqNo',passage);
        passageQuery.equalTo('boxId',box);
        passageQuery.first().then(function(passageObj){
            return callback(err,passageObj,arg2);
        },function(error){
            return callback(error);
        });
        return callback(err,false,null);
    }
    function promise3(arg1,arg2,callback){
        if (typeof(arg1) == "undefined"||arg1==false) {
            return callback(err,0,0);
        }
        var product=arg1.get('product');
        var empPower=arg2.get('power');
    }
    function promise4(arg1,arg2,callback){
        if(arg1==0||arg2==0){
            return callback(err,false);
        }

    }
    async.waterfall([
        function (callback){
            promise1(callback);
        },
        function (callback){
            promise2(arg1,arg2,callback);
        },
        function (callback){
            promise3(arg1,arg2,callback);
        },
        function (callback){
            promise4(arg1,arg2,callback);
        }],function(err,results){
        var result={
            status:200,
            message:"无权限",
            data:flag,
            server_time:new Date()
        }
        res.jsonp(result);
    });
}

router.get('/:id/:card/:passage', function(req, res) {
    var deviceId=req.params.id;
    var card=req.params.card;
    var passage=req.params.passage;
    var todo={"ip":req.headers['x-real-ip'],"api":"取货判断接口","deviceId":deviceId,"msg":"card:"+card+",passage:"+passage};
    ApiLog.WorkOn(todo);
    var boxQuery=new AV.Query('BoxInfo');
    boxQuery.equalTo('deviceId',deviceid);
    boxQuery.include('cusId');
    boxQuery.first().then(function (box){
        if (typeof(box) == "undefined") {
          var result={
            status:200,
            message:"无此设备号的数据",
            data:false,
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
          data:false,
          server_time:new Date()
        }
        res.jsonp(result);
    });
});

router.get('/success/:id', function(req, res) {

});
module.exports = router;
