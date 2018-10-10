var mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const db = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/portfolio';

mongoose.connect(db);

module.exports = {
  mongoose: mongoose
}
