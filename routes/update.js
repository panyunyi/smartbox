'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var result={
  status:200,
  message:"",
  data:{},
  server_time:new Date()
};

router.get('/:id/:code', function(req, res) {
    var query=new AV.Query('Update');
    query.equalTo('isDel',false);
    query.equalTo('deviceId',req.params.id);
    query.select(['deviceId','url','version']);
    query.greaterThan('version',req.params.code*1);
    query.first().then(function(data){
        if(typeof(data)=="undefined"){
            result['message']="无此设备版本号";
            result['data']=false;
            return res.jsonp(result);
        }
        result['data']=data;
        result['message']="";
        res.jsonp(result);
    });
});
module.exports = router;
