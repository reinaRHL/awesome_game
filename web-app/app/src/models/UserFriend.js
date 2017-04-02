// Made this join table separately to force to have additional fields.

module.exports = function(sequelize, DataType) {
	var UserFriend = sequelize.define('UserFriend', {
        status: {
            type: DataType.INTEGER,
            field: 'status' 
            // Use status: 0 for pending friend request
            // Use status: 1 for confirmed friend
            // UserId= 1, FriendId= 2, status=0 means User1 sent friend request to User2
        }
    });
	return UserFriend;
};
