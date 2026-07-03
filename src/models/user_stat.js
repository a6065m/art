module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');
  return sequelize.define('user_stat', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    user_id: { type: DataTypes.UUID },
    watch_minutes: { type: DataTypes.INTEGER, defaultValue: 0 },
    last_seen_at: { type: DataTypes.DATE }
  }, { underscored: true, tableName: 'user_stats' });
};
