import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
const RecommendationEvent = sequelize.define('RecommendationEvent', {
event_id: {
type: DataTypes.BIGINT,
primaryKey: true,
autoIncrement: true,
},
user_id: {
type: DataTypes.INTEGER,
allowNull: true,
references: { model: 'users', key: 'user_id' },
},
session_token: {
type: DataTypes.STRING(255),
allowNull: true,
comment: 'For anonymous users before login',
},
listing_id: {
type: DataTypes.INTEGER,
allowNull: true,
references: { model: 'listings', key: 'listing_id' },
},
event_type: {
type: DataTypes.STRING(50),
allowNull: false,
validate: {
isIn: [['impression', 'click', 'save', 'cart_add',
'order', 'booking', 'voice_query']]
},
},
source: {
type: DataTypes.STRING(50),
allowNull: true,
validate: {
isIn: [['home_feed', 'similar_items', 'voice_search',
'visual_search', 'text_search', 'browse', null]]
},
},
query_text: {
type: DataTypes.STRING(500),
allowNull: true,
comment: 'Search query or voice transcript if applicable',
},
position: {
type: DataTypes.INTEGER,
allowNull: true,
comment: 'Rank position in results list when event happened',
},
metadata: {
type: DataTypes.JSONB,
allowNull: true,
comment: 'Any extra context (device, screen, etc.)',
},
}, {
tableName: 'recommendation_events',
underscored: true,
timestamps: true,
createdAt: 'created_at',
updatedAt: false,
});
export default RecommendationEvent;