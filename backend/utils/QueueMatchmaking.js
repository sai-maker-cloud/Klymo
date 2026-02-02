const QueueMatchmaking = {
    queue : [],

    addUser: function(user){
        const exist = this.queue.find(u => u.id === user.id)
        if(!exist) this.queue.push(user);
    },

    deleteUser : function(user){
        const idx = this.queue.find(u => u.id === user.id);
        if(idx) this.queue.splice(idx,1);
    },

    matchUser : function(){
        while(this.queue.length >= 2){
            const user1 = this.queue.shift();
            const user2 = this.queue.shift();

            const roomId = `room_${user1.id}_${user2.id}`;
            user1.emit("match_found", { 
                roomId, 
                partnerNickname: user2.handshake.query.nickname || "Stranger" 
            });
            user2.emit("match_found", { 
                roomId, 
                partnerNickname: user1.handshake.query.nickname || "Stranger" 
            });
        }
    }
}

module.exports = {QueueMatchmaking};