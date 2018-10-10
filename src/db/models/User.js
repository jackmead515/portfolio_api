const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const config = require('../../config.js');

var UserSchema = new mongoose.Schema({
    password: {
      type: String,
      required: true,
      minlength: 10
    },
    username: {
      type: String,
      required: true,
      minlength: 5,
      maxlength: 30,
      trim: true,
      unique: true,
    },
    access: {
      type: String,
      required: true
    },
    tokens: [{
      token: {
          type: String,
          required: true
      }
    }]
});

UserSchema.methods.generateToken = function() {
  var user = this;
  var access = 'auth';
  var token = jwt.sign({
    _id: user._id.toHexString()
  }, config.tokenSalt).toString();

  user.tokens = [{access, token}];

  return user.save().then(() => {
    return token;
  });
};

UserSchema.statics.findByToken = function(token) {
  var User = this;
  var decoded;
  try {
      decoded = jwt.verify(token, config.tokenSalt);
  } catch (err) { return Promise.reject(); }

  return User.findOne({
    '_id': decoded._id,
    'tokens.token': token,
  });
}

UserSchema.statics.findByCredentials = function(username, password) {
    var User = this;

    return User.findOne({username}).then(function(user){
      if(!user) { return Promise.reject(); }

      return new Promise(function(resolve, reject){
        bcrypt.compare(password, user.password, function(err, equal) {
          if(equal){ resolve(user); }
          reject();
        });
      });
    });
};

UserSchema.pre('save', function(next) {
    var user = this;
    if(user.isModified('password')){
      var password = user.password;
      bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(password, salt, function(err, hash){
          user.password = hash;
          next();
        });
      });
    } else {
      next();
    }
});

var User = mongoose.model('Users', UserSchema);

module.exports = {
  User: User
}
