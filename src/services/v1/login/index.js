const express = require('express');
const { authenticate } = require('../../../middleware/authenticate');
var { mongoose } = require('../../../db/mongoose');
var { User } = require('../../../db/models/User');

var route = require('express').Router();

route.post('/', function(req, res) {
  const { username, password, attempts } = req.body;

  if(attempts && typeof attempts === 'number' && attempts >= 0) {
    if(attempts >= 10) {
      res.send({message: 'I mean... you can try. But...', status: 400});
      return;
    } else if(attempts >= 5) {
      res.send({message: 'Are you sure your supposed to be here?', status: 400});
      return;
    }
  }

  User.findByCredentials(username, password).then((user) => {
    user.tokens = [];
    user.save().then(() => {
      user.generateToken().then((token) => {
        res.send({ message: 'Login successful!', token, status: 200 });
      }).catch((err) => {
        res.send({ message: 'Failed to login to account. Please try again.', status: 401 });
      });
    }).catch((err) => {
      res.send({ message: 'Failed to login to account. Please try again.', status: 400 });
    });
  }).catch((err) => {
    res.send({ message: 'Incorrect username or password.', status: 400 });
  });
});

route.post('/auth', function(req, res) {
  const { token } = req.body;

  User.findByToken(token).then((user) => {
    if(!user) return Promise.reject();
    res.send({status: 200});
  }).catch((err) => {
    res.send({status: 400});
  });
});



module.exports = route;
