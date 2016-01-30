/**
 * Created by 帆 on 2015/8/29.
 */
var crypto = require('crypto');
var mongodb = require('./db');
function User(user) {
    this.name = user.name;
    this.password = user.password;
    this.email = user.email;
}
module.exports = User;
//save data
User.prototype.save = function (callback) {
    //user Doc 9.10 改动，增加用户头像
    //var user = {
    //    name: this.name,
    //    password: this.password,
    //    email: this.email
    //};
    //open db

    //9.10改动
    var md5=crypto.createHash('md5'),
        email_MD5=md5.update(this.email.toLowerCase()).digest('hex'),
        head="http://zh-tw.gravatar.com/avatar/"+email_MD5+"?s=48";
    //save Db 9.10
    var user={
        name:this.name,
        password:this.password,
        email:this.email,
        head:head//头像连接建
    }
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);//error
        }
        //read user
        db.collection('users', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //User insert data
            collection.insert(user, {
                safe: true
            }, function (err, user) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, user[0]);//success return Doc
            })
        })
    })
};
//read user
User.get = function (name, callback) {
    //open Db
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //read User collect
        db.collection('users', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //find username
            collection.findOne({
                name: name
            }, function (err, user) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, user);
            })
        })
    })
};
