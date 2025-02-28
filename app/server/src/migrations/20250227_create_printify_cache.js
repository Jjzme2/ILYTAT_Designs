'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('printify_cache', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true
            },
            type: {
                type: Sequelize.ENUM('product', 'shop', 'order'),
                allowNull: false
            },
            externalId: {
                type: Sequelize.STRING,
                allowNull: false
            },
            data: {
                type: Sequelize.JSON,
                allowNull: false
            },
            lastUpdated: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false
            }
        });

        await queryInterface.addIndex('printify_cache', ['type', 'externalId'], {
            unique: true
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('printify_cache');
    }
};
