var forum = function(){}

var Question = function(title, category, comments, views, activity){
    this.title = title;
    this.category = category;
    this.comments = comments;
    this.views = views;
    this.activity = activity;
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

module.exports = forum

