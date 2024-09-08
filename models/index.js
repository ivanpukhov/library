const User = require('./User');
const Book = require('./Book');
const Club = require('./Club');
const ClubMessage = require('./ClubMessage');
const ClubEvent = require('./ClubEvent');
const ClubNews = require('./ClubNews');
const Event = require('./Event');
const Duel = require('./Duel');
const UserBook = require('./UserBook');
const UserEvent = require('./UserEvent');
const UserClubEvents = require('./UserClubEvents');
const Review = require('./Review');
const UserClub = require('./UserClub');


User.belongsToMany(Book, { through: UserBook });
Book.belongsToMany(User, { through: UserBook });


Club.hasMany(ClubMessage, { foreignKey: 'ClubId' });
Club.hasMany(ClubEvent, { foreignKey: 'ClubId' });
Club.hasMany(ClubNews, { foreignKey: 'ClubId' });


ClubMessage.belongsTo(User);
ClubMessage.belongsTo(Club);


ClubEvent.belongsTo(Club);


ClubNews.belongsTo(Club);


User.belongsToMany(Club, { through: UserClub });
Club.belongsToMany(User, { through: UserClub });


User.belongsToMany(ClubEvent, { through: UserClubEvents });
ClubEvent.belongsToMany(User, { through: UserClubEvents });


Event.belongsToMany(User, { through: UserEvent });
User.belongsToMany(Event, { through: UserEvent });


Club.hasMany(Duel, { foreignKey: 'clubId' });
Duel.belongsTo(Club, { foreignKey: 'clubId' });
User.hasMany(Duel, { as: 'challengedDuels', foreignKey: 'challengerId' });
User.hasMany(Duel, { as: 'opponentDuels', foreignKey: 'opponentId' });
Duel.belongsTo(User, { as: 'challenger', foreignKey: 'challengerId' });
Duel.belongsTo(User, { as: 'opponent', foreignKey: 'opponentId' });
Duel.belongsTo(Book, { foreignKey: 'bookId' });
Book.hasMany(Duel, { foreignKey: 'bookId' });
UserClub.belongsTo(User);
UserClub.belongsTo(Club)

Club.hasMany(UserClub, { foreignKey: 'ClubId' });
UserClub.belongsTo(Club, { foreignKey: 'ClubId' });
UserClub.belongsTo(User, { foreignKey: 'UserId' });
User.hasMany(UserClub, { foreignKey: 'UserId' });

module.exports = { User, Book, Club, Review, UserClub, Duel, ClubMessage, UserClubEvents, ClubEvent, ClubNews, UserBook, Event, UserEvent };
