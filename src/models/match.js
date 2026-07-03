module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');
  return sequelize.define('match', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    home_team: { type: DataTypes.STRING },
    away_team: { type: DataTypes.STRING },
    start_time: { type: DataTypes.DATE },
    status: { type: DataTypes.STRING },
    metadata: { type: DataTypes.JSONB }
  }, { underscored: true, tableName: 'matches' });
};
