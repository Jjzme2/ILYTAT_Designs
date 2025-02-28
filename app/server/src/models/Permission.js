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
        modelName: 'Permission',
        timestamps: true,
        paranoid: true,
        underscored: true,
        indexes: [
            {
                unique: true,
                fields: ['name']
            },
            {
                fields: ['created_at']
            },
            {
                fields: ['updated_at']
            }
        ]
    });

    return Permission;
};
