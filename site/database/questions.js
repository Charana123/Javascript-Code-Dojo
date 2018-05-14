"use strict"

module.exports = {
    QuestionsHandler: QuestionsHandler
};


function QuestionsHandler(database) {
    return (function() {

        var db = database;

        var newQuestion = function(db, id, title, question, answer_file, start_code) {
            return new Promise(function(resolve, reject) {
                db.newQuestion(id, title, question, answer_file, start_code).then(function(question) {
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

        var getAllQuestions = function(db) {
            return new Promise(function (resolve, reject) {
                db.getAll("questions").then(function(questions) {
                    resolve(questions);
                    return;
                }, function(err) {
                    reject("unable to get all questions: "+err);
                    return;
                });
            });
        };

        return {
           newQuestion:function(id, title, question, answer_file, start_code) {
               return newQuestion(db, id, title, question, answer_file, start_code);
            },
           getQuestion:function(questionId) {
               return getQuestion(db, questionId);
            },
           getAllQuestions:function() {
               return getAllQuestions(db);
            },
        }

    }());
}
