const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

module.exports = (sequelize) => {
    class User extends Model {
        static associate(models) {
            // Define associations
            this.hasMany(models.Session, { foreignKey: 'userId' });
            this.belongsToMany(models.Role, { 
                through: 'UserRoles',
                foreignKey: 'userId'
            });
        }

        // Instance method to validate password
        async validatePassword(password) {
            try {
                return await bcrypt.compare(password, this.password);
            } catch (error) {
                logger.error('Error validating password:', error);
                return false;
            }
        }

        // Remove sensitive data before sending to client
        toJSON() {
            const values = { ...this.get() };
            delete values.password;
            delete values.resetPasswordToken;
            delete values.resetPasswordExpires;
            return values;
        }
    }

    User.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        username: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
            validate: {
                len: [3, 30]
            }
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        firstName: {
            type: DataTypes.STRING,
            allowNull: true
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: true
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        lastLogin: {
            type: DataTypes.DATE
        },
        resetPasswordToken: {
            type: DataTypes.STRING
        },
        resetPasswordExpires: {
            type: DataTypes.DATE
        }
    }, {
        sequelize,
        modelName: 'User',
        hooks: {
            beforeSave: async (user) => {
                if (user.changed('password')) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
                
                // Generate username from email if not provided
                if (!user.username && user.email) {
                    user.username = user.email.split('@')[0];
                }
            }
        },
        indexes: [
            {
                unique: true,
                fields: ['email']
            },
            {
                unique: true,
                fields: ['username']
            }
        ]
    });

    return User;
};
