/**
 * Created by ·« on 2015/8/29.
 */
var settings=require('../settings'),
    Db=require('mongodb').Db,
    Connection=require('mongodb').Connection,
    Server=require('mongodb').Server;
module.exports=new Db(settings.db,new Server(settings.host,27017),{safe:true});