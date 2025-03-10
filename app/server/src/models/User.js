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
                // Add detailed debug logging
                logger.debug('Password validation attempt', {
                    userId: this.id,
                    email: this.email,
                    passwordLength: password ? password.length : 0,
                    hashedPasswordLength: this.password ? this.password.length : 0,
                    rawPassword: password ? password.substring(0, 3) + '***' : 'none' // Show first 3 chars for debugging
                });
                
                // Log first few characters of hashed password for debugging
                if (this.password) {
                    logger.debug('Hashed password details', {
                        prefix: this.password.substring(0, 10) + '...',
                        isProperlyHashed: this.password.startsWith('$2a$') || this.password.startsWith('$2b$')
                    });
                }
                
                const result = await bcrypt.compare(password, this.password);
                
                logger.debug('Password validation result', {
                    userId: this.id,
                    email: this.email,
                    result: result
                });
                
                return result;
            } catch (error) {
                logger.error('Error validating password:', {
                    error: error.message,
                    stack: error.stack,
                    userId: this.id,
                    email: this.email
                });
                return false;
            }
        }

        // Remove sensitive data before sending to client
        toJSON() {
            const values = { ...this.get() };
            delete values.password;
            delete values.resetPasswordToken;
            delete values.resetPasswordExpires;
            delete values.verificationToken;
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
        isVerified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        verificationToken: {
            type: DataTypes.STRING,
            allowNull: true
        },
        verificationExpires: {
            type: DataTypes.DATE,
            allowNull: true
        },
        lastLogin: {
            type: DataTypes.DATE
        },
        resetPasswordToken: {
            type: DataTypes.STRING,
            allowNull: true
        },
        resetPasswordExpires: {
            type: DataTypes.DATE,
            allowNull: true
        },
        loginAttempts: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        lockUntil: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'User',
        tableName: 'Users', 
        hooks: {
            beforeSave: async (user) => {
                // Add debug logging for password changes
                if (user.changed('password')) {
                    logger.debug('User password changed - preparing to hash', {
                        userId: user.id,
                        email: user.email,
                        isNewRecord: user.isNewRecord,
                        passwordLength: user.password ? user.password.length : 0,
                        passwordPrefix: user.password ? 
                            (user.password.startsWith('$2') ? 'Already hashed: ' + user.password.substring(0, 10) + '...' : 'Plaintext') : 'None'
                    });
                    
                    // Check if password is already hashed (starts with $2a$ or $2b$)
                    if (user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))) {
                        logger.debug('Password appears to be already hashed, skipping hash operation', {
                            userId: user.id,
                            email: user.email
                        });
                        return; // Skip hashing if already hashed
                    }
                    
                    const salt = await bcrypt.genSalt(10);
                    const originalPassword = user.password;
                    user.password = await bcrypt.hash(user.password, salt);
                    
                    logger.debug('Password hashed in beforeSave hook', {
                        userId: user.id,
                        email: user.email,
                        originalLength: originalPassword ? originalPassword.length : 0,
                        hashedLength: user.password.length,
                        hashedPrefix: user.password.substring(0, 10) + '...'
                    });
                } else {
                    logger.debug('User save operation - password not changed', {
                        userId: user.id,
                        email: user.email,
                        isNewRecord: user.isNewRecord,
                        changedFields: user.changed()
                    });
                }
                
                // Generate username from email if not provided
                if (!user.username && user.email) {
                    user.username = user.email.split('@')[0];
                }
            }
        },
        indexes: [
            // Removed redundant indices that are already defined in migrations
            // These indices are already created in migration files:
            // - 20250227000001-create-users.js (email, username)
            // - 20250305000001-add-verification-fields-to-users.js (verificationToken)
            {
                fields: ['resetPasswordToken']
            }
        ]
    });

    return User;
};
