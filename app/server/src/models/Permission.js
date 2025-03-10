const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Permission extends Model {
        static associate(models) {
            this.belongsToMany(models.Role, {
                through: 'RolePermissions',
                foreignKey: 'permissionId'
            });
        }
    }

    Permission.init({
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
        resource: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'The resource this permission applies to (e.g., "users", "posts")'
        },
        action: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'The action allowed (e.g., "create", "read", "update", "delete")'
        },
        attributes: {
            type: DataTypes.JSON,
            comment: 'Additional attributes or conditions for the permission'
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        deletedAt: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'Permission',
        timestamps: true,
        paranoid: true,
        underscored: false,
        indexes: [
            // Removed redundant indices that are already defined in migrations
            // These indices are already created in migration files:
            // - 20250227000003-create-permissions.js (name)
            // - 20250228135213-add-timestamps.js (createdAt, updatedAt)
            // Note: resource and action indices are only defined in the migration
        ]
    });

    return Permission;
};
