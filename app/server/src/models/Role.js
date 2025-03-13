
const { Model, DataTypes } = require('sequelize');
const { enhanceModelOptions, standardizeAttributes } = require('../utils/modelEnhancer');


module.exports = (sequelize) => {
    class Role extends Model {
        static associate(models) {
            this.belongsToMany(models.User, {
                through: 'user_roles',
                foreignKey: 'role_id'
            });
            this.belongsToMany(models.Permission, {
                through: 'role_permissions',
                foreignKey: 'role_id'
            });
        }
    }

    Role.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                len: [2, 50]
            }
        },
        description: {
            type: DataTypes.STRING
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        deleted_at: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'Role',
        tableName: 'roles',
        timestamps: true,
        paranoid: true,
        underscored: true,
        indexes: [
            // Removed redundant indices that are already defined in migrations
            // These indices are already created in migration files:
            // - 20250227000002-create-roles.js (name)
            // - 20250228135213-add-timestamps.js (createdAt, updatedAt)
        ]
    });

    return Role;
};
