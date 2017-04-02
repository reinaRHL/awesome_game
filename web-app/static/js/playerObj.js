class Player {
    constructor(user, current) {
        this.username = user;
        this.isCurrentPlayer = current;
        this.score = 0;
    }

    addScore(s){
        this.score += s;
        return this.score;
    }
}