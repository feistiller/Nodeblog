/**
 * Created by ·« on 2015/8/30.
 */
var mongodb = require('./db');
markdown = require('markdown').markdown;

//function Post(name, title, post) {
//    this.name = name;
//    this.title = title;
//    this.post = post;
//}
//function Post(name, title, tags, post) {
//    this.name = name;
//    this.title = title;
//    this.tags=tags;
//    this.post = post;
//}
//9.10 Modify
function Post(name,head,title,tags,post){
    this.name=name;
    this.head=head;
    this.title=title;
    this.tags=tags;
    this.post=post;
}
module.exports = Post;
//save article
Post.prototype.save = function (callback) {
    var date = new Date();
    //save time
    var time = {
        date: date,
        year: date.getFullYear(),
        month: date.getFullYear() + '-' + (date.getMonth() + 1),
        day: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + (date.getDate()),
        minute: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + (date.getDate()) + ' ' + date.getHours() + ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
    };
    //will save Doc

    //var post = {
    //    name: this.name,
    //    time: time,
    //    title: this.title,
    //    tags:this.tags,
    //    post: this.post,
    //    comments: [],//Comment
    //    pv:0
    //};
    //9.10 Modify
    var post={
        name:this.name,
        head:this.head,
        time:time,
        title:this.title,
        tags:this.tags,
        post:this.post,
        comments:[],
        pv:0
    }

    //Open Db
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //read posts collection
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //insert into posts
            collection.insert(post, {
                safe: true
            }, function (err) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null);
            })
        })
    })
}

//Read articles and others(10)
Post.getTen = function (name, page, callback) {
    //open Db
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //read posts collection
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            var query = {};
            if (name) {
                query.name = name;
            }
            //use count return number of doc named total
            collection.count(query, function (err, total) {
                //select by query ,and jump (page-1)*10 artcle,10 article will be returned
                collection.find(query, {
                    skip: (page - 1) * 10,
                    limit: 10
                }).sort({
                    time: -1
                }).toArray(function (err, docs) {
                    mongodb.close();
                    if (err) {
                        return callback(err);
                    }
                    //resolved markdown to be HTML
                    docs.forEach(function (doc) {
                        doc.post = markdown.toHTML(doc.post);
                    })
                    callback(null, docs, total);
                })
            })
            ////find article by query
            //collection.find(query).sort({
            //    time: -1
            //}).toArray(function (err, docs) {
            //    mongodb.close();
            //    if (err) {
            //        return callback(err);//fail return err
            //    }
            //    //markdown explained HTML
            //    docs.forEach(function (doc) {
            //        doc.post = markdown.toHTML(doc.post);
            //    });
            //    callback(null, docs);//success
            //})
        })
    })
}

//find a article
Post.getOne = function (name, day, title, callback) {
    //open Db
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //read posts collection
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //find article by username,date,name
            collection.findOne({
                "name": name,
                "time.day": day,
                "title": title
            }, function (err, doc) {

                if (err) {
                    mongodb.close();
                    return callback(err);
                }
                //resolve markdown to html
                //doc.post = markdown.toHTML(doc.post);
                if (doc) {
                    //pv+1
                    collection.update({
                        "name":name,
                        "time.day":day,
                        "title":title
                    },{
                        $inc:{"pv":1}
                    }, function (err) {
                        mongodb.close();
                        if(err){
                            return callback(err);
                        }
                    });

                    doc.post = markdown.toHTML(doc.post);
                    doc.comments.forEach(function (comment) {
                        comment.content = markdown.toHTML(comment.content);
                    })
                }
                callback(null, doc);//return the article
            })
        })
    })
}


//return old text(markdown type)
Post.edit = function (name, day, title, callback) {
    //Open Db
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //read Posts collection
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //select by username,date,articlename
            collection.findOne({
                "name": name,
                "time.day": day,
                "title": title
            }, function (err, doc) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, doc);
            })
        })
    })
}


//updata edit
Post.update = function (name, day, title, post, callback) {
    //Open Db
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //read Post collection
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //updata
            collection.update({
                "name": name,
                "time.day": day,
                "title": title
            }, {
                $set: {post: post}
            }, function (err) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null);
            })
        })
    })
}

//del
Post.remove = function (name, day, title, callback) {
    //Open Db
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //read Post collection
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //del the article by username,date,lable
            collection.remove({
                "name": name,
                "time.day": day,
                "title": title
            }, {
                w: 1
            }, function (err) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null);
            })
        })
    })
}


//return All Archive message
Post.getArchive = function (callback) {
    //Open Db
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //Read posts collection
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //return the message only include name time &title
            collection.find({}, {
                "name": 1,
                "time": 1,
                "title": 1
            }).sort({
                time: -1
            }).toArray(function (err, docs) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, docs);
            })
        })
    })
}

Post.getTags= function (callback) {
    mongodb.open(function (err, db) {
        if(err){
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if(err){
                mongodb.close();
                return callback(err);
            }
            //distinct use to key
            collection.distinct("tags", function (err, docs) {
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null,docs);
            })
        })
    })
}


//return tags about article
Post.getTag= function (tag, callback) {
    mongodb.open(function (err, db) {
        if(err){
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if(err){
                mongodb.close();
                return callback(err);
            }
            //select tags array include tag Doc
            //return array include name time title
            collection.find({
                "tags":tag
            },{
                "name":1,
                "time":1,
                "title":1
            }).sort({
                time:-1
            }).toArray(function (err, docs) {
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null,docs);
            })
        })
    })
}

//return articles by keyword
Post.search= function (keyword, callback) {
    mongodb.open(function (err, db) {
        if(err){
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if(err){
                mongodb.close();
                return callback(err);
            }
            var pattern=new RegExp("^.*"+keyword+".*$","i");
            collection.find({
                "title":pattern
            },{
                "name":1,
                "time":1,
                "title":1
            }).sort({
                time:-1
            }).toArray(function (err, docs) {
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null,docs);
            })
        })
    })
}