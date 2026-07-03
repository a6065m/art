module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');
  return sequelize.define('m3u_source', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    name: { type: DataTypes.STRING },
    url: { type: DataTypes.TEXT, allowNull: false },
    last_fetched_at: { type: DataTypes.DATE }
  }, { underscored: true, tableName: 'm3u_sources' });
};
