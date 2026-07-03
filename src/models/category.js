module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');
  return sequelize.define('category', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    name: { type: DataTypes.STRING, allowNull: false },
    parent_id: { type: DataTypes.UUID, allowNull: true },
  }, { underscored: true, tableName: 'categories' });
};
