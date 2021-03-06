"use strict"

module.exports = {
    ChallengesHandler: ChallengesHandler
};


function ChallengesHandler(database) {
    return (function() {

        var db = database;

        function fieldByValue(db, field, value) {
            return new Promise(function(resolve, reject) {
                db.rowsByField("challenges", field, value).then(function(challenge) {
                    resolve(challenge);
                }, function(err) {
                    reject(err);
                });
            });
        }

        function fieldPresent(db, field, value) {
            return new Promise(function(resolve, reject) {
                fieldByValue(db, field, value).then(function(row) {
                    if (Object.keys(row).length > 0) {
                        resolve(true);
                    }
                    resolve(false);
                }, function(err) {
                    reject("error getting field: ["+field+"] value: ["+value+ "], "+err);
                });
            });
        }

        var challengesByUser = function(db, userID) {
            return new Promise(function(resolve, reject) {
                db.rowsByField("challenges", "user", userID).then(function(challenge) {
                    if (challenge.length > 0 ) {
                        resolve({
                            0: challenge[0].challenge_complete_0,
                            1: challenge[0].challenge_complete_1,
                            2: challenge[0].challenge_complete_2,
                            3: challenge[0].challenge_complete_3,
                            4: challenge[0].challenge_complete_4,
                            5: challenge[0].challenge_complete_5,
                        });
                        return;
                    } else {
                        resolve(challenge);
                        return;
                    }
                }, function(err) {
                    reject("failed to get challenge from user id: "+err);
                    return;
                });
            });
        };

        var newChallenge = function(db, userID) {
            return new Promise(function(resolve, reject) {
                db.newChallenge(userID).then(function(challenge) {
                    resolve(challenge);
                    return;
                }, function(err) {
                    reject(err);
                    return;
                });
            });
        };

        var updateChallenge = function(db, userID, index, status) {
            return new Promise(function(resolve, reject) {
                db.updateChallenge(userID, index, status).then(function(challenge) {
                    resolve(challenge);
                    return;
                }, function(err) {
                    reject(err);
                    return;
                });
            });
        };

        return {
           challengesByUser:function(userID) {
               return challengesByUser(db, userID);
            },
           newChallenge:function(userID) {
               return newChallenge(db, userID);
            },
           updateChallenge:function(userID, index, status) {
               return updateChallenge(db, userID, index, status);
            },
        }

    }());
}
