var player = new function() {
    this.username;
    this.isCurrentPlayer;
    this.score;
    this.addScore = function(s) {
        this.score += s;
        return this.score;
    }
}
