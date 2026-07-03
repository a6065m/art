// Sequelize initialization and model loading

const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgres://user:pass@localhost:5432/art', {
  logging: false,
});

const User = require('./models/user')(sequelize);
const Category = require('./models/category')(sequelize);
const Channel = require('./models/channel')(sequelize);
const Stream = require('./models/stream')(sequelize);
const M3USource = require('./models/m3u_source')(sequelize);
const XtreamSource = require('./models/xtream_source')(sequelize);
const Subscription = require('./models/subscription')(sequelize);
const Match = require('./models/match')(sequelize);
const Favorite = require('./models/favorite')(sequelize);
const UserStat = require('./models/user_stat')(sequelize);

// Associations
User.hasMany(Subscription, { foreignKey: 'user_id' });
Subscription.belongsTo(User, { foreignKey: 'user_id' });

Category.hasMany(Channel, { foreignKey: 'category_id' });
Channel.belongsTo(Category, { foreignKey: 'category_id' });

Channel.hasMany(Stream, { foreignKey: 'channel_id' });
Stream.belongsTo(Channel, { foreignKey: 'channel_id' });

Channel.hasMany(Match, { foreignKey: 'channel_id' });
Match.belongsTo(Channel, { foreignKey: 'channel_id' });

User.hasMany(Favorite, { foreignKey: 'user_id' });
Favorite.belongsTo(User, { foreignKey: 'user_id' });

User.hasOne(UserStat, { foreignKey: 'user_id' });
UserStat.belongsTo(User, { foreignKey: 'user_id' });

module.exports = {
  sequelize,
  User,
  Category,
  Channel,
  Stream,
  M3USource,
  XtreamSource,
  Subscription,
  Match,
  Favorite,
  UserStat,
};
