const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Session extends Model {
        static associate(models) {
            this.belongsTo(models.User, { foreignKey: 'userId' });
        }
    }

    Session.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        token: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        ipAddress: {
            type: DataTypes.STRING
        },
        userAgent: {
            type: DataTypes.STRING
        },
        isValid: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: false
        }
    }, {
        sequelize,
        modelName: 'Session',
        indexes: [
            {
                fields: ['userId']
            },
            {
                unique: true,
                fields: ['token']
            }
        ]
    });

    return Session;
};
