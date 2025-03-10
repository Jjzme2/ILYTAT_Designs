const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Role extends Model {
        static associate(models) {
            this.belongsToMany(models.User, {
                through: 'UserRoles',
                foreignKey: 'roleId'
            });
            this.belongsToMany(models.Permission, {
                through: 'RolePermissions',
                foreignKey: 'roleId'
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
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
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
        modelName: 'Role',
        timestamps: true,
        paranoid: true,
        underscored: false,
        indexes: [
            // Removed redundant indices that are already defined in migrations
            // These indices are already created in migration files:
            // - 20250227000002-create-roles.js (name)
            // - 20250228135213-add-timestamps.js (createdAt, updatedAt)
        ]
    });

    return Role;
};
