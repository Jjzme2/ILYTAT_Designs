
const { Model, DataTypes } = require('sequelize');
const { enhanceModelOptions, standardizeAttributes } = require('../utils/modelEnhancer');

const logger = require('../utils/logger');

/**
 * Audit Model
 * Stores audit records for tracking system activities and changes
 */
module.exports = (sequelize) => {
  class Audit extends Model {
    static associate(models) {
      // Define associations
      this.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }
  }

  Audit.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'User who performed the action (null for system actions)'
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Type of action performed (e.g., CREATE, UPDATE, DELETE, LOGIN)'
    },
    entityType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Type of entity affected (e.g., User, Order, Product)'
    },
    entityId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'ID of the affected entity'
    },
    oldValues: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Previous state of the entity (for updates/deletes)'
    },
    newValues: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'New state of the entity (for creates/updates)'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional contextual information'
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: 'IP address of the client'
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'User agent of the client'
    },
    requestId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Request ID for correlation'
    },
    status: {
      type: DataTypes.ENUM('success', 'failure', 'warning'),
      defaultValue: 'success',
      comment: 'Outcome status of the action'
    },
    severity: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      defaultValue: 'low',
      comment: 'Importance level of the audit event'
    }
  }, {
    sequelize,
    modelName: 'Audit',
    tableName: 'Audits',
    timestamps: true,
    paranoid: true, // Use soft deletes for audit records
    indexes: [
      {
        fields: ['action']
      },
      {
        fields: ['entityType', 'entityId']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['createdAt']
      },
      {
        fields: ['severity']
      },
      {
        fields: ['status']
      },
      {
        fields: ['requestId']
      }
    ],
    hooks: {
      afterCreate: (record, options) => {
        logger.debug('Audit record created', {
          auditId: record.id,
          action: record.action,
          entityType: record.entityType,
          entityId: record.entityId,
          userId: record.userId
        });
      }
    }
  });

  return Audit;
};
