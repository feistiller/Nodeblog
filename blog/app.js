
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
//var user = require('./routes/user');
var http = require('http');
var path = require('path');
var MongoStore=require('connect-mongo')(express);
var settings=require('./settings');
var flash=require('connect-flash');

//9.10 fix about Save Log
var fs=require('fs');
var accessLog=fs.createWriteStream('access.log',{flags:'a'});
var errorLog=fs.createWriteStream('error.log',{flags:'a'});

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(flash());//use flashmethod means session
app.use(express.favicon());
app.use(express.logger('dev'));//Log Output Terminal
app.use(express.logger({stream:accessLog}));//Save Log Localhaost File
//app.use(express.static(path.join(__dirname,'public')));

app.use(express.bodyParser({keepExtensions:true,uploadDir:'./public/images'}));//旧方法
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.session({
  secret:settings.cookieSecret,
  key:settings.db,
  cookie:{maxAge:1000*60*60*24*30},//30days
  store:new MongoStore({
    db:settings.db
  })
}));



app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.use(function (err, req, res, next) {
  var meta='['+new Date()+']'+req.url+'\n';
  errorLog.write(meta+err.stack+'\n');
  next();
});

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

//app.get('/', routes.index);
//app.get('/users', user.list);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

routes(app);//总的路由接口