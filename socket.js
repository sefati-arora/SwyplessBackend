const Models = require("./models/index");

const onlineUsers = new Map();

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log(" Socket connected:", socket.id);
    socket.on("connected data", ({ id }) => {
      if (!id) return;
      onlineUsers.set(id, socket.id);
      console.log(` User ${id} online`);
    });
    socket.on("send_message", async (data) => {
      try {
        const { senderId, receiverId, message, messageType } = data;
        if (!senderId || !receiverId || !message) return;
        const savedMessage = await Models.messageTable.create({
          senderId,
          receiverId,
          message,
          messageType,
          isRead: 0
        });
        await Models.chatTable.upsert({
          senderId,
          receiverId,
          lastMessageId: savedMessage.id
        });
        const receiverSocket = onlineUsers.get(receiverId);

        if (receiverSocket) {
          io.to(receiverSocket).emit("receive_message", {
            id: savedMessage.id,
            senderId,
            message,
            messageType,
            createdAt: savedMessage.createdAt
          });
        }
        socket.emit("message_sent", {
          success: true,
          messageId: savedMessage.id
        });

      } catch (error) {
        console.error(" Message error:", error);
        socket.emit("message_error", { error: "Message failed" });
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
      for (const [userId, sockId] of onlineUsers.entries()) {
        if (sockId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }
    });
  });
};
