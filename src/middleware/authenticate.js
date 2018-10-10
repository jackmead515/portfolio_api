var { mongoose } = require('../db/mongoose');
var { User } = require('../db/models/User');

const authenticate = (req, res, next) => {
  let token = 'null';
  if(req.method === 'POST') {
    token = req.body.token;
  } else if(req.method === 'GET') {
    token = req.query.token;
  }

  User.findByToken(token).then((user) => {
    if(!user) return Promise.reject();

    if(user.access === 'admin' || user.access === 'auth') {
      req.user = user;
      req.token = token;
      next();
    } else {
      res.send({status: 401, message: 'Not authenticated'});
    }
  }).catch((err) => {
    res.send({status: 401, message: 'Not authenticated'});
  });
};

const admin_authenticate = (req, res, next) => {
  let token = 'null';
  if(req.method === 'POST') {
    token = req.body.token;
  } else if(req.method === 'GET') {
    token = req.query.token;
  }

  User.findByToken(token).then((user) => {
    if(!user) return Promise.reject();

    if(user.access === 'admin') {
      req.user = user;
      req.token = token;
      next();
    } else {
       res.send({status: 401, message: 'Not authenticated'});
    }
  }).catch((err) => {
    res.send({status: 401, message: 'Not authenticated'});
  });
};

module.exports = { authenticate, admin_authenticate }
