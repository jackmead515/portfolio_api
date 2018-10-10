const express = require('express');
const { authenticate, admin_authenticate } = require('../../../middleware/authenticate');
var { mongoose } = require('../../../db/mongoose');
var { Comments } = require('../../../db/models/Comments');
var { Guide } = require('../../../db/models/Guide');

var route = require('express').Router();

route.post('/', function(req, res) {
  const { searchTitle } = req.body;

  if(validateOneQuery(searchTitle)) {
    Comments.findOne({ 'searchTitle': searchTitle }, (err, comments) => {
      if(err) {
        console.log(err);
        res.send({status: 400});
      } else {
        if(comments) {
          res.send({comments, status: 200});
        } else {
          res.send({comments: null, status: 200});
        }
      }
    });
  } else {
      res.send({status: 400, message: 'Invalid parameter'});
  }
});

route.post('/amount', function(req, res) {
  const { searchTitle } = req.body;

  if(validateOneQuery(searchTitle)) {
    Comments.findOne({ 'searchTitle': searchTitle }, (err, comments) => {
      if(err) {
        console.log(err);
        res.send({status: 400});
      } else {
        if(comments && comments.comments) {
          res.send({amount: comments.comments.length, status: 200});
        } else {
          res.send({amount: 0, status: 200});
        }
      }
    });
  } else {
      res.send({status: 400, message: 'Invalid parameter'});
  }
});

route.post('/save', function(req, res) {
  const { searchTitle, comment, name } = req.body;

  if(validateOneQuery(searchTitle) && validateComments(comment, name)) {
    Comments.findOne({ 'searchTitle': searchTitle }, (err, comments) => {
      if(err) {
        console.log(err);
        res.send({status: 400});
      } else {
        if(comments) {

          if(comments.comments.length >= 20) {
            res.send({status: 400, message: 'Maximum of 20 comments'});
          } else {
            comments.comments.push({comment, name, date: new Date().getTime()});

            comments.save().then(() => {
              res.send({status: 200, comments});
            }).catch((err) => {
              console.log(err);
              res.send({status: 400});
            })
          }

        } else {
          Guide.findOne({ 'searchTitle': searchTitle }, (err, guide) => {
            if(err) {
              console.log(err);
              res.send({status: 400, message: err});
            } else {
              if(guide) {

                var newComments = new Comments({
                  searchTitle,
                  guideId: guide._id,
                  comments: [{comment, name, date: new Date().getTime()}]
                });

                newComments.save().then(() => {
                  res.send({status: 200, comments: newComments});
                }).catch((err) => {
                  res.send({status: 400});
                });

              } else {
                res.send({status: 400});
              }
            }
          });
        }
      }
    });
  } else {
    res.send({status: 400, message: 'Invalid parameters'});
  }
});

route.post('/delete', admin_authenticate, function(req, res) {
  const { searchTitle, commentId } = req.body;

  Comments.findOne({ 'searchTitle': searchTitle }, (err, comments) => {
    if(err) {
      res.send({status: 400, message: err});
    } else {
      if(comments) {

          comments.comments = comments.comments.filter((c) => {
            return c._id.toString() !== commentId
          });

          comments.save().then(() => {
            res.send({status: 200});
          }).catch((err) => {
            console.log(err);
            res.send({status: 400, message: err});
          });

      } else {
        res.send({status: 400, message: 'No comment section found'});
      }
    }
  });
});

const validateComments = (comment, name) => {
  return (typeof comment === 'string' && comment.length <= 2000 && comment.length > 0) &&
         (typeof name === 'string' && name.length <= 50 && name.length > 0)
}

const validateOneQuery = (value) => {
  return typeof value === 'string' && value.length <= 500 && value.length > 0;
}

module.exports = route;
