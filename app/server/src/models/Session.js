const { Model, DataTypes } = require('sequelize');
const { enhanceModelOptions, standardizeAttributes } = require('../utils/modelEnhancer');


module.exports = (sequelize) => {
    class Session extends Model {
        static associate(models) {
            this.belongsTo(models.User, { foreignKey: 'user_id' });
        }
    }

    const attributes = standardizeAttributes({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        token: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        ip_address: {
            type: DataTypes.STRING
        },
        user_agent: {
            type: DataTypes.STRING
        },
        is_valid: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        expires_at: {
            type: DataTypes.DATE,
            allowNull: false
        }
    });

    const options = enhanceModelOptions({
        sequelize,
        modelName: 'Session',
        tableName: 'sessions',
        paranoid: true, // Enable soft deletes with deleted_at
        indexes: [
            // Removed redundant indices that are already defined in migrations
            // These indices are already created in migration file:
            // - 20250227000006-create-sessions.js (user_id, token)
        ]
    });

    Session.init(attributes, options);

    return Session;
};
