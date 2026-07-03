module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');
  return sequelize.define('stream', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    channel_id: { type: DataTypes.UUID },
    url: { type: DataTypes.TEXT, allowNull: false },
    quality: { type: DataTypes.STRING },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  }, { underscored: true, tableName: 'streams' });
};
