var AV = require('leanengine');
var async=require('async');
var moment=require('moment');
/**
 * 一个简单的云代码方法
 */
AV.Cloud.define('heartbeat', function(request, response) {
    function promise1(callback){
        var boxQuery=new AV.Query('BoxInfo');
        boxQuery.equalTo('isDel',false);
        boxQuery.find().then(function(results){
            callback(null,results);
        });
    }
    function promise2(arg1,callback){
        var query=new AV.Query('Todo');
        query.descending('createdAt');
        async.map(arg1,function(box,callback1){
            query.equalTo('deviceId',box.get('deviceId'));
            query.first().then(function(data){
                var result={};
                var flag=true;
                result['box']=box.get('deviceId');
                if(typeof(data)=="undefined"){
                    flag=false;
                }else{
                    var now=new Date();
                    var time=now-data.get('createdAt');
                    if(time>5000){
                        flag=false;
                    }
                }
                result['flag']=flag;
                if(flag!=box.get('flag')){
                    box.set('isLive',flag);
                    box.save().then(function(one){
                        callback1(null,result);
                    });
                }else{
                    callback1(null,result);
                }
            });
        },function(err,results){
            callback(null,results);
        });

    }
    async.waterfall([
        function (callback){
            promise1(callback);
        },
        function (arg1,callback){
            promise2(arg1,callback);
        }],function(err,results){
            response.success(results);
    });
});

module.exports = AV.Cloud;
