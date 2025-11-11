import sequelize from '../config/db.js';
import User from './users.js';
import UserVerification from './userVerification.js';

//associations
UserVerification.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(UserVerification, { foreignKey: 'user_id' });

export { sequelize, User, UserVerification };


