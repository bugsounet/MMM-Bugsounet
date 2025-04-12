"use strict";

const path = require("node:path");
const GoogleAssistant = require("../components/AssistantSDK");

const config = {
  auth: {
    keyFilePath: path.resolve(__dirname, "../credentials.json"),
    savedTokensPath: path.resolve(__dirname, "../tokenGA.json"),
    force: true,
    inputReader: true
  },
  conversation: {
    lang: "en-US"
  }
};

function startConversation (conversation) {
  // setup the conversation
  conversation
    .on("ended", (error) => {
      if (error) {
        console.error("[GA] Conversation ended with error:", error);
        process.exit();
      } else {
        conversation.end();
        console.log("\n[GA] Token created!");
        process.exit();
      }
    })
    // catch any errors
    .on("error", (error) => {
      console.error("[GA] Conversation Error:", error);
      process.exit();
    });
}

try {
  this.assistant = new GoogleAssistant(config.auth);
} catch (error) {
  console.error("[GA]", error.toString());
  process.exit();
}

this.assistant
  .on("ready", () => {
    config.conversation.textQuery = "What time is it?";
    this.assistant.start(config.conversation, startConversation);
  })
  .on("error", (error) => {
    console.error("[GA] Assistant Error:", error);
  });
