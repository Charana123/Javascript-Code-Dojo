var forum = function(){}

var Question = function(title, category, comments, views, activity){
    this.title = title;
    this.category = category;
    this.comments = comments;
    this.views = views;
    this.activity = activity;
}

var ChallengeUser = function(passed){
    this.passed = passed;
}

var Challenge = function(title, description, user){
    this.title = title;
    this.id = title + "-link"
    this.description = description;
    this.user = user;
}

forum.getAllPostsData = function(){
    return new Promise(function(resolve, reject){
        var question_1 = new Question("HTTP - Writing a server", "General", 5, 35, "26d")
        var question_2 = new Question("'undefined' vs 'null'", "Challenge1", 3, 25, "5th Jan 2018")
        var forum_data = [ question_1, question_2 ]
        var data = { session_valid: true, forum_data: forum_data }
        resolve(data)
    })
}

forum.getAllChallengeData = function(){
    return new Promise(function(resolve, reject){
        var challenge1 = new Challenge("Title 1", "Description 1", new ChallengeUser(100))
        var challenge2 = new Challenge("Title 2", "Description 2", new ChallengeUser(80))
        var challenges_data = [challenge1, challenge2]
        var data = { session_valid: true, challenges: challenges_data }
        resolve(data)
    })
}

forum.getDefault = function(){
    return new Promise(function(resolve, reject){
        var data = { session_valid: false, forum_data: [] }
        resolve(data)
    })
}

forum.getTopPostsData = function(){
    return forum.getAllPostsData()
}

forum.getNewPostsData = function(){
    return forum.getAllPostsData()
}

forum.getHotPostsData = function(){
    return forum.getAllPostsData()
}

forum.login = function(email, password){
    return new Promise(function(resolve, reject){
        if(email == "charana@yahoo.com" && password == "password123") resolve(true)
        else reject(new Error("Incorrent field"))
    })
}

module.exports = forum

