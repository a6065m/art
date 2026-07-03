module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');
  return sequelize.define('subscription', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    user_id: { type: DataTypes.UUID },
    type: { type: DataTypes.STRING },
    m3u_source_id: { type: DataTypes.UUID },
    xtream_source_id: { type: DataTypes.UUID },
    start_at: { type: DataTypes.DATE },
    end_at: { type: DataTypes.DATE },
    active: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, { underscored: true, tableName: 'subscriptions' });
};
