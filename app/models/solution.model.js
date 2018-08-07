const mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  requireLogin = require('../middlewares/requireLogin');

const SolutionSchema = new Schema({
  name: {
    type: String,
    required: true,
    // unique: true,
    trim: true,
    lowercase: true,
  },
  screens: [
    {
      type: Schema.ObjectId,
      ref: 'Screens',
    },
  ],
});

SolutionSchema.set('timestamps', true);
SolutionSchema.set('collection', 'solutions');
SolutionSchema.set('versionKey', false);
// SolutionSchema.index({ 'email.addr': 1 });

module.exports.modelRestify = mongoose.main_conn.model('Solutions', SolutionSchema);
module.exports.preMiddleware = requireLogin.validToken;
