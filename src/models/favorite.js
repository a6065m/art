module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');
  return sequelize.define('favorite', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    user_id: { type: DataTypes.UUID },
    channel_id: { type: DataTypes.UUID }
  }, { underscored: true, tableName: 'favorites' });
};
