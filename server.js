var express = require("express");
var parseurl = require("parseurl");
var bodyParser = require("body-Parser");
var path = require("path");
var expressValidator = require("express-validator");
var mustacheExpress = require("mustache-express");
var session = require("express-session");
var db = require("./models/");
var app = express();

var PORT = process.env.PORT || 3000;

app.engine("mustache", mustacheExpress());
app.set("view engine", "mustache");
app.set("views", "./views");
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);
app.use(expressValidator());

app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true
  })
);

app.get("/", function(req, res) {
  res.render("index");
});

app.get("/signup", function(req, res) {
  res.render("signup");
});

app.get("/login", function(req, res) {
  res.render("login");
});

// app.get('/liked', function(req, res) {
//   res.render('liked');
// });

app.get("/login", function(req, res) {
  if (req.session && req.session.authenticated) {
    db.user
      .findOne({
        where: {
          username: req.session.username,
          password: req.session.password
        }
      })
      .then(function(user) {
        if (user) {
          req.session.username = req.body.username;
          req.session.userId = user.dataValues.id;
          var username = req.session.username;
          var userid = req.session.userId;
          res.render("index", {
            user: user
          });
        }
      });
  } else {
    res.redirect("/home");
  }
});

app.post("/login", function(req, res) {
  console.log(req.body.username);
  console.log(req.body.password);
  var username = req.body.username;
  var password = req.body.password;

  db.user
    .findOne({
      where: {
        username: username,
        password: password
      }
    })
    .then(user => {
      if (user && user.password == password) {
        req.session.username = username;
        req.session.userId = user.dataValues.id;
        req.session.authenticated = true;
        console.log(req.session);

        res.redirect("/home");
      } else {
        res.redirect("/login");
        console.log("This is my session", req.session);
      }
    });
});

app.post("/signup", function(req, res) {
  // db.user.build({
  //   name: req.body.name,
  //   email: req.body.email,
  //   username: req.body.username,
  //   password: req.body.password
  // });
  // console.log(req.body);

  var newUser = {
    name: req.body.name,
    email: req.body.email,
    username: req.body.username,
    password: req.body.password
  };
  console.log(req.body);

  db.user.create(newUser).then(function(user) {
    req.username = db.user.username;
    req.session.authenticated = true;
    res.redirect("/login");
    console.log(req.session);
  });
});

app.post("/newtalk", function(req, res) {
  var post = db.post.build({
    userId: req.session.userId,
    title: req.body.gabtitle,
    body: req.body.gabbody
  });

  post.save().then(function(post) {
    console.log(post);
  });
});

app.get("/home", function(req, res) {
  db.post.findAll().then(function(posts) {
    res.render("home", {
      posts: posts,
      name: req.session.username
    });
  });
});

app.get("/newtalk", function(req, res) {
  db.post.findAll().then(function(posts) {
    res.render("newtalk", {
      posts: posts,
      name: req.session.username
    });
  });
});

app.post("/home", function(req, res) {
  var post = db.post.build({
    title: (req.body.gabtitle = req.session.post),
    body: (req.body.gabbody = req.session.post)
  });
  console.log(req.session.post);

  post.save();
  res.redirect("/home");
});

app.post("/like", function(req, res) {
  var like = db.like.build({
    like: true,
    userId: req.session.userId,
    postId: req.body.submitbtn
  });
  like.save().then(function(like) {
    console.log(like);
  });
});

app.get("/liked", function(req, res) {
  db.like
    .findAll({
      include: [
        {
          model: db.user,
          as: "user"
        }
      ]
    })
    .then(function(likes) {
      console.log(likes);
      res.render("liked", {
        likes: likes
      });
    });
});

app.get("/logout", function(req, res) {
  req.session.destroy(function(err) {});
  res.render("index");
  console.log(req.session);
});

db.sequelize.sync({}).then(function() {
  app.listen(PORT, function() {
    console.log("App listening on PORT " + PORT);
  });
});
