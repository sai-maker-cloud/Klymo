const ChatModel = require('../models/chat.models');
const crypto = require('crypto');

const QueueMatchmaking = {
    queue: [],

    addUser: function (socket) {
        const exist = this.queue.find(u => u.id === socket.id);
        if (!exist) this.queue.push(socket);
        this.matchUser();
    },

    deleteUser: function (socketOrId) {
        const id = typeof socketOrId === 'string' ? socketOrId : socketOrId.id;
        this.queue = this.queue.filter(u => u.id !== id);
    },

    matchUser: async function () {
        if (this.queue.length < 2) return;

        let i = 0;
        while (i < this.queue.length) {
            const u1 = this.queue[i];

            const partnerIdx = this.queue.findIndex((u, idx) => {
                if (idx === i || u.deviceId === u1.deviceId) return false;

                const u1Interests = Array.isArray(u1.interests) ? u1.interests : [];
                const uInterests = Array.isArray(u.interests) ? u.interests : [];

                const common = u1Interests.filter(interest =>
                    uInterests.map(s => s.toLowerCase()).includes(interest.toLowerCase())
                );
                return common.length > 0;
            });

            if (partnerIdx !== -1) {
                const user1 = this.queue.splice(i, 1)[0];
                const adjustedIdx = partnerIdx > i ? partnerIdx - 1 : partnerIdx;
                const user2 = this.queue.splice(adjustedIdx, 1)[0];

                const commonInterest = user1.interests.find(interest =>
                    user2.interests.map(s => s.toLowerCase()).includes(interest.toLowerCase())
                ) || "General";

                const seed = `${user1.id}-${user2.id}-${Date.now()}`;
                const roomId = crypto.createHash('sha256').update(seed).digest('hex').substring(0, 24);

                try {
                    await ChatModel.create({
                        roomId: roomId,
                        participants: [
                            { 
                                userId: user1.userId, 
                                socketId: user1.id, 
                                username: user1.username, 
                                avatar: user1.avatar 
                            },
                            { 
                                userId: user2.userId, 
                                socketId: user2.id, 
                                username: user2.username, 
                                avatar: user2.avatar 
                            }
                        ],
                        matchReason: commonInterest,
                        status: 'active'
                    });

                    user1.join(roomId);
                    user2.join(roomId);

                    const payload = (p, reason) => ({
                        roomId,
                        partner: {
                            username: p.username,
                            bio: p.bio,
                            avatar: p.avatar
                        },
                        notice: `CONNECTED_VIA_${reason.toUpperCase()}`
                    });

                    user1.emit("match_found", payload(user2, commonInterest));
                    user2.emit("match_found", payload(user1, commonInterest));

                    continue;
                } catch (err) {
                    console.error("Match Error:", err);
                    this.queue.push(user1, user2);
                }
            }
            i++;
        }
    }
};

module.exports = { QueueMatchmaking };