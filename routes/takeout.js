'use strict';
var router = require('express').Router();
var AV = require('leanengine');

router.get('/:id/:card/:passage', function(req, res) {
    var deviceId=req.params.id;
    var todo={"ip":req.headers['x-real-ip'],"api":"取货接口","deviceId":deviceId,"msg":""};
    ApiLog.WorkOn(todo);
    var card=req.params.card;
    var passage=req.params.passage;
    var boxQuery=new AV.Query('BoxInfo');
    boxQuery.equalTo('deviceId',deviceid);
    boxQuery.include('cusId');
    boxQuery.first().then(function (data){
        if (typeof(data) == "undefined") {
          var result={
            status:200,
            message:"",
            data:{},
            server_time:new Date()
          }
          res.jsonp(result);
          return;
        }
        var cus=data.get('cusId');
        doWork(cus,data,res,new Date(req.params.stamp*1000));
    },function (error){
        console.log(error);
    });
});

router.get('/success/:id', function(req, res) {

});
module.exports = router;
