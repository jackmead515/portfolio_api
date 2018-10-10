const mongoose = require('mongoose');

var CommentsSchema = new mongoose.Schema({
    guideId: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 50,
      trim: true,
      unique: true
    },
    searchTitle: {
      unique: true,
      type: String,
      required: true,
      minlength: 1,
      maxlength: 500
    },
    comments: [{
      name: {
        type: String,
        required: true,
        minlength: 1,
        maxlength: 50
      },
      comment: {
        type: String,
        required: true,
        minlength: 1,
        maxlength: 2000
      },
      date: {
        type: Number,
        required: true,
        min: 0
      },
    }],
});

var Comments = mongoose.model('Comments', CommentsSchema);

module.exports = {
  Comments
}
