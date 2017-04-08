'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var async = require('async');
var ApiLog=require('./log');

function doWork(cus,box,res,ts){
    let data={};
    function promise1(callback){
      let query = new AV.Query('AdminCard');
      query.greaterThanOrEqualTo('updatedAt',ts);
      if(ts-new Date(0)==0){
          query.equalTo('isDel',false);
      }
      query.select(['card','isDel']);
      query.limit(1000);
      query.find().then(function (results) {
          data["AdminCard"]=results;
          return callback(null,results);
        }, function (error) {
          // 异常处理
          return callback(error)
        });
    }
    function promise2(callback){
      let query = new AV.Query('CustomerProduct');
      query.greaterThanOrEqualTo('updatedAt',ts);
      query.include('product');
      query.equalTo('cusId',cus);
      if(new Date(0)==ts){
          query.equalTo('isDel',false);
      }
      query.limit(1000);
      query.find().then(function (results) {
          async.map(results,function(result,callback1){
              let one={"cusProductName":result.get('product').get('name'),
              "isDel":result.get('isDel'),"productName":result.get('product').get('name'),
              "objectId":result.get('product').get('id'),"createdAt":result.get('createdAt'),
              "updatedAt":result.get('updatedAt')};
              callback1(null,one);
          },function(err,ones){
              data["Product"]=ones;
              return callback(null,results);
          });
        }, function (error) {
          // 异常处理
          return callback(error)
        });
    }
    function promise3(callback){
        let query = new AV.Query('EmployeeCard');
        query.greaterThanOrEqualTo('updatedAt',ts);
        if(new Date(0)==ts){
            query.equalTo('isDel',false);
        }
        query.equalTo('cusId',cus);
        query.count().then(function(count){
            let num=Math.ceil(count/1000);
            let empcards=[];
            async.times(num,function(n,callback2){
                query.limit(1000);
                query.skip(1000*n);
                query.find().then(function(results){
                    empcards=empcards.concat(results);
                    callback2(null,results);
                });
            },function(err,empcardres){
                async.map(empcards,function(result,callback1){
                    let one={"card":result.get('card'),"emp":result.get('emp').id,
                    "isDel":result.get('isDel'),"createdAt":result.get('createdAt'),
                    "updatedAt":result.get('updatedAt'),"objectId":result.id};
                    callback1(null,one);
                },function(err,ones){
                    data["EmpCard"]=ones;
                    return callback(null,ones);
                });
            });
        });
    }
    function promise4(callback){
        let query=new AV.Query('EmployeePower');
        query.greaterThanOrEqualTo('updatedAt',ts);
        if(new Date(0)==ts){
            query.equalTo('isDel',false);
        }
        query.equalTo('cusId',cus);
        query.count().then(function(count){
            let num=Math.ceil(count/1000);
            let emppowers=[];
            async.times(num,function(n,callback2){
                query.limit(1000);
                query.skip(1000*n);
                query.find().then(function(results){
                    emppowers=emppowers.concat(results);
                    callback2(null,results);
                });
            },function(err,empcardres){
                async.map(emppowers,function(result,callback1){
                    let one={"emp":result.get('emp').id,"unit":result.get('unit'),
                    "begin":result.get('begin'),"isDel":result.get('isDel'),
                    "product":result.get('product').id,"count":result.get('count'),
                    "period":result.get('period'),"used":result.get('used'),
                    "createdAt":result.get('createdAt'),"updatedAt":result.get('updatedAt'),
                    "objectId":result.id};
                    callback1(null,one);
                },function(err,ones){
                    data["EmpPower"]=ones;
                    return callback(null,ones);
                });
            });
        });
    }
    function promise5(callback){
        let query=new AV.Query('Passage');
        query.greaterThanOrEqualTo('updatedAt',ts);
        if(new Date(0)==ts){
            query.equalTo('isDel',false);
        }
        query.equalTo('boxId',box);
        query.count().then(function(count){
            let num=Math.ceil(count/1000);
            let passages=[];
            async.times(num,function(n,callback2){
                query.limit(1000);
                query.skip(1000*n);
                query.find().then(function(results){
                    passages=passages.concat(results);
                    callback2(null,results);
                });
            },function(err,passagesres){
                async.map(passages,function(result,callback1){
                    let one={"flag":result.get('flag'),"capacity":result.get('capacity'),
                    "isDel":result.get('isDel'),"seqNo":result.get('seqNo'),
                    "used":result.get('used')?result.get('used').get('id'):"",
                    "whorlSize":result.get('whorlSize'),"product":result.get('product').get('id'),
                    "borrowState":result.get('borrowState'),"stock":result.get('stock'),
                    "isSend":result.get('isSend'),"objectId":result.get('id'),
                    "createdAt":result.get('createdAt'),"updatedAt":result.get('updatedAt')};
                    callback1(null,one);
                },function(err,ones){
                    data["Passage"]=ones;
                    return callback(null,ones);
                });
            });
        });
    }
    function promise6(callback){
        let one={"machine":box.get('machine'),"model":box.get('model'),
        "connecter":box.get('connecter'),"phone":box.get('conPhone')};
        let arr=[];
        arr.push(one);
        data["Box"]=arr;
        callback(null,arr);
    }
    async.parallel([
        function (callback){
            promise1(callback);
        },
        function (callback){
            promise2(callback);
        },
        function (callback){
            promise3(callback);
        },
        function (callback){
            promise4(callback);
        },
        function (callback){
            promise5(callback);
        },
        function (callback){
            promise6(callback);
        }],function(err,results){
        var result={
            status:200,
            message:"",
            data:data,
            server_time:new Date()
        }
        res.jsonp(result);
    });
}
router.get('/:id', function(req, res) {
    let deviceId=req.params.id;
    let todo={"ip":req.headers['x-real-ip'],"api":"获取全部基础数据接口","deviceId":deviceId,"msg":""};
    ApiLog.WorkOn(todo);
    let boxQuery=new AV.Query('BoxInfo');
    boxQuery.equalTo('deviceId',deviceId);
    boxQuery.include('cusId');
    boxQuery.first().then(function (data){
        if (typeof(data) == "undefined") {
          let result={
            status:201,
            message:"无此设备号的数据",
            data:{},
            server_time:new Date()
          }
          res.jsonp(result);
          return;
        }
        let cus=data.get('cusId');
        doWork(cus,data,res,new Date(0));
    },function (error){
        console.log(error);
        let result={
          status:202,
          message:"查询失败",
          data:{},
          server_time:new Date()
        }
        res.jsonp(result);
    });
});

router.get('/:id/:stamp', function(req, res) {
    let deviceId=req.params.id;
    let todo={"ip":req.headers['x-real-ip'],"api":"同步基础数据接口","deviceId":deviceId,"msg":req.params.stamp};
    ApiLog.WorkOn(todo);
    let boxQuery=new AV.Query('BoxInfo');
    boxQuery.equalTo('deviceId',deviceId);
    boxQuery.include('cusId');
    boxQuery.first().then(function (data){
        if (typeof(data) == "undefined") {
          let result={
            status:201,
            message:"无此设备号的数据",
            data:{},
            server_time:new Date()
          }
          res.jsonp(result);
          return;
        }
        let cus=data.get('cusId');
        doWork(cus,data,res,new Date(req.params.stamp*1000));
    },function (error){
        console.log(error);
        let result={
          status:202,
          message:"查询失败",
          data:{},
          server_time:new Date()
        }
        res.jsonp(result);
    });
});
module.exports = router;
