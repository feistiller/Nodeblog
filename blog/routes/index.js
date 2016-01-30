/*
 * GET home page.
 */
var crypto = require('crypto'),
    fs = require('fs'),
    User = require('../models/user.js'),
    Post = require('../models/post.js');
Comment = require('../models/comment.js');


module.exports = function (app) {
    //index
    app.get('/', function (req, res) {
        var page = req.query.p ? parseInt(req.query.p) : 1;
        //judge first page is or not,and req
        Post.getTen(null, page, function (err, posts, total) {
            if (err) {
                posts = [];
            }
            res.render('index', {
                title: 'index',
                user: req.session.user,
                posts: posts,
                success: req.flash('success').toString(),
                error: req.flash('error').toString(),
                page: page,
                isFirstPage: (page - 1) == 0,
                isLastPage: ((page - 1) * 10 + posts.length) == total
            });
        });
    });

    //register
    app.get('reg', checkNotLogin);
    app.get('/reg', function (req, res) {
        res.render('reg', {
            title: 'register',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    app.post('/reg', checkNotLogin);
    app.post('/reg', function (req, res) {
        var name = req.body.name,
            password = req.body.password,
            password_re = req.body['password-repeat'];
        //cherk twice password same or not
        if (password_re != password) {
            req.flash('error', 'twice password not same');
            return res.redirect('/reg');//return reg main
        }
        var md5 = crypto.createHash('md5'),
            password = md5.update(req.body.password).digest('hex');
        var newUser = new User({
            name: req.body.name,
            password: password,
            email: req.body.email
        });
        //cherk username exist or not
        User.get(newUser.name, function (err, user) {
            if (user) {
                req.flash('error', 'username had existed');
                return res.redirect('/reg');//return regiser
            }
            //Not exist create it
            newUser.save(function (err, user) {
                if (err) {
                    req.flash('error', err);
                    return res.redirect('/reg');
                }
                req.session.user = user;//store session
                req.flash('success', 'success');
                res.redirect('/');//success and return main
            })
        })
    });

    //login
    app.get('login', checkNotLogin);
    app.get('/login', function (req, res) {
        res.render('login', {
            title: 'login',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    app.post('/login', checkNotLogin);
    app.post('/login', function (req, res) {
        //md5
        var md5 = crypto.createHash('md5'),
            password = md5.update(req.body.password).digest('hex');
        //cherk user exist or not
        User.get(req.body.name, function (err, user) {
            if (!user) {
                req.flash('error', 'user not exist');
                return res.redirect('/login');
            }
            //cherk user password
            if (user.password != password) {
                req.flash('error', 'password wrong');
                return res.redirect('/login');
            }
            //save session
            req.session.user = user;
            req.flash('success', 'success');
            res.redirect('/');
        })
    });

    //post
    app.get('/post', checkLogin);
    app.get('/post', function (req, res) {
        res.render('post', {
            title: 'post',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    app.post('/post', checkLogin);
    app.post('/post', function (req, res) {
        //var currentUser = req.session.user,
        //    post = new Post(currentUser.name, req.body.title, req.body.post);
        //add tags 9.6
        var currentUser = req.session.user,
            tags = [req.body.tag1, req.body.tag2, req.body.tag3],
        //9.10 Modify
        //post = new Post(currentUser.name, req.body.title, tags, req.body.post);

            post = new Post(currentUser.name, currentUser.head, req.body.title, tags, req.body.post);

        post.save(function (err) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            req.flash('success', 'success post');
            res.redirect('/');
        })
    });

    //logout
    app.get('/logout', checkLogin);
    app.get('/logout', function (req, res) {
        req.session.user = null;
        req.flash('success', 'logout success');
        res.redirect('/');
    });

    //upload img
    app.get('/upload', checkLogin);
    app.get('/upload', function (req, res) {
        res.render('upload', {
            title: 'upload',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        })
    });

    app.post('/upload', checkLogin);
    app.post('/upload', function (req, res) {
        for (var i in req.files) {
            if (req.files[i].size == 0) {
                //Synchronous del
                fs.unlinkSync(req.files[i].path);
                console.log('Successfully removed an empty_path');
            } else {
                var target_path = './public/images' + req.files[i].name;
                //Synchronous rename
                fs.renameSync(req.files[i].path, target_path);
                console.log("successfully rename success");
            }
        }
        req.flash('success', 'files input success');
        res.redirect('/upload');
    });

    //search
    app.get('/search', function (req, res) {
        Post.search(req.query.keyword, function (err, posts) {
            if (err) {
                req.flash('error', err);
                return res.redirect("/");
            }
            res.render('search', {
                title: "SEARCH:" + req.query.keyword,
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            })
        })
    });

    //articlelist by username
    app.get('/u/:name', function (req, res) {
        var page = req.query.p ? parseInt(req.query.p) : 1;
        //cherk username exist or not
        User.get(req.params.name, function (err, user) {
            if (!user) {
                req.flash('error', 'user not exist');
                return res.redirect('/');
            }
            Post.getTen(user.name, page, function (err, posts, total) {
                if (!user) {
                    req.flash('error', err);
                    return res.redirect('/');
                }
                res.render('user', {
                    title: user.name,
                    posts: posts,
                    page: page,
                    isFirstPage: (page - 1) == 0,
                    isLastPage: ((page - 1) * 10 + posts.length) == total,
                    user: req.session.user,
                    success: req.flash('success').toString(),
                    error: req.flash('error').toString()

                })
            })
            //Post.getAll(user.name, function (err, posts) {
            //    if(err){
            //        req.flash('error',err);
            //        return res.redirect('/');
            //    }
            //    res.render('user',{
            //        title:user.name,
            //        posts:posts,
            //        user:req.session.user,
            //        success:req.flash('success').toString(),
            //        error:req.flash('error').toString()
            //    })
            //})
        })
    });

    app.get('/u/:name/:day/:title', function (req, res) {
        Post.getOne(req.params.name, req.params.day, req.params.title, function (err, post) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('article', {
                title: req.params.title,
                post: post,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            })
        })
    });


    //edit acricle
    app.get('/edit/:name/:day/:title', checkLogin);
    app.get('/edit/:name/:day/:title', function (req, res) {
        var currentUser = req.session.user;
        Post.edit(currentUser.name, req.params.day, req.params.title, function (err, post) {
            if (err) {
                req.flash('error', err);
                return res.redirect('back');
            }
            res.render('edit', {
                title: 'edit',
                post: post,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            })
        })
    });

    app.post('/edit/:name/:day/:title', checkLogin);
    app.post('/edit/:name/:day/:title', function (req, res) {
        var currentUser = req.session.user;
        Post.update(currentUser.name, req.params.day, req.params.title, req.body.post, function (err) {
            var url = '/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title;
            if (err) {
                req.flash('error', err);
                return res.redirect(url);//woring return

            }
            req.flash('success', 'edit success');
            res.redirect(url);
        })
    });

    //remove
    app.get('/remove/:name/:day/:title', checkLogin);
    app.get('/remove/:name/:day/:title', function (req, res) {
        var currentUser = req.session.user;
        Post.remove(currentUser.name, req.params.day, req.params.title, function (err) {
            if (err) {
                req.flash('error', err);
                return res.redirect('back');
            }
            req.flash('success', 'del success');
            res.redirect('/');
        })
    });

//Comment
    app.post('/u/:name/:day/:title', function (req, res) {
        var date = new Date(),
            time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + "" + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
        //var comment = {
        //    name: req.body.name,
        //    email: req.body.email,
        //    website: req.body.website,
        //    time: time,
        //    content: req.body.content
        //};
        //9.10 Modify
        var md5 = crypto.createHash('md5'),
            email_MD5 = md5.update(req.body.email.toLowerCase()).digest('hex'),
            head = "http://zh-tw.gravatar.com/avatar/" + email_MD5 + "?s=48";
        var comment={
            name:req.body.name,
            head:head,
            email:req.body.email,
            website:req.body.website,
            time:time,
            content:req.body.content
        }
        var newComment = new Comment(req.params.name, req.params.day, req.params.title, comment);
        newComment.save(function (err) {
            if (err) {
                req.flash('error', err);
                return res.redirect('back');
            }
            req.flash('success', 'comment success');
            res.redirect('back');
        })
    });

    //存档的路由规则
    app.get('/archive', function (req, res) {
        Post.getArchive(function (err, posts) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('archive', {
                title: 'Archive',
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            })
        })
    });

    //tags pages
    app.get('/tags', function (req, res) {
        Post.getTags(function (err, posts) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('tags', {
                title: 'tags',
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            })
        })
    });

    app.get('/tags/:tag', function (req, res) {
        Post.getTag(req.params.tag, function (err, posts) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('tag', {
                title: 'TAG:' + req.params.tag,
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            })
        })
    });

    //use 404 page
    app.use(function (req, res) {
        res.render("404");
    });

    //cherk login or not
    function checkLogin(req, res, next) {
        if (!req.session.user) {
            req.flash('error', 'U not login');
            res.redirect('/login');
        }
        next();
    }

    function checkNotLogin(req, res, next) {
        if (req.session.user) {
            req.flash('error', 'Repeat login');
            res.redirect('back');
        }
        next();
    }
};