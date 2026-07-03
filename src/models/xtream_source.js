module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');
  return sequelize.define('xtream_source', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    name: { type: DataTypes.STRING },
    host: { type: DataTypes.STRING },
    port: { type: DataTypes.INTEGER },
    username: { type: DataTypes.STRING },
    password_encrypted: { type: DataTypes.TEXT },
    api_token: { type: DataTypes.TEXT },
    last_fetched_at: { type: DataTypes.DATE }
  }, { underscored: true, tableName: 'xtream_sources' });
};
