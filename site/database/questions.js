"use strict"

module.exports = {
    QuestionsHandler: QuestionsHandler
};


function QuestionsHandler(database) {
    return (function() {

        var db = database;

        var newQuestion = function(db, title, question, answer_file, start_code) {
            return new Promise(function(resolve, reject) {
                db.newQuestion(title, question, answer_file, start_code).then(function(question) {
                    resolve(question);
                    return;
                }, function(err) {
                    reject(err);
                    return;
                });
            });
        };

        var getQuestion = function(db, questionId) {
            return new Promise(function (resolve, reject) {
                db.rowsByField("questions", "id", questionId).then(function(question) {
                    resolve(question);
                    return;
                }, function(err) {
                    reject("unable to get  question by ID: "+err);
                    return;
                });
            });
        };

        return {
           newQuestion:function(title, question, answer_file, start_code) {
               return newQuestion(db, title, question, answer_file, start_code);
            },
           getQuestion:function(questionId) {
               return getQuestion(db, questionId);
            },
        }

    }());
}
