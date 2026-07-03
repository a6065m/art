module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');
  return sequelize.define('channel', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    source_type: { type: DataTypes.STRING, allowNull: false },
    source_id: { type: DataTypes.UUID },
    source_channel_id: { type: DataTypes.STRING },
    name: { type: DataTypes.STRING, allowNull: false },
    logo: { type: DataTypes.TEXT },
    metadata: { type: DataTypes.JSONB },
  }, { underscored: true, tableName: 'channels' });
};
