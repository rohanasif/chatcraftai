// Manual mock for OpenAI
const mockOpenAI = jest.fn().mockImplementation(() => {
  return {
    chat: {
      completions: {
        create: jest.fn().mockImplementation((params) => {
          const systemContent = (
            params.messages.find((m) => m.role === "system")?.content || ""
          ).toLowerCase();

          // Grammar correction
          if (systemContent.includes("correct the grammar")) {
            return Promise.resolve({
              choices: [
                {
                  message: {
                    content: "Corrected text response",
                  },
                },
              ],
            });
          }
          // Reply suggestions
          if (systemContent.includes("follow-up message suggestions")) {
            // Check the context in the user message
            const userContext =
              params.messages.find((m) => m.role === "user")?.content || "";
            // If the context matches only the first message, return suggestions
            if (userContext.trim() === "Alice: Hello, how are you?") {
              return Promise.resolve({
                choices: [
                  {
                    message: {
                      content: JSON.stringify({
                        replies: [
                          "Great to hear!",
                          "That's wonderful!",
                          "How was your day?",
                        ],
                      }),
                    },
                  },
                ],
              });
            }
            // Otherwise, return empty suggestions
            return Promise.resolve({
              choices: [
                {
                  message: {
                    content: JSON.stringify({ replies: [] }),
                  },
                },
              ],
            });
          }
          // Summary and sentiment
          if (
            systemContent.includes("summary") &&
            systemContent.includes("sentiment")
          ) {
            return Promise.resolve({
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      summary: "A friendly conversation between participants.",
                      sentiment: ["positive", "friendly"],
                    }),
                  },
                },
              ],
            });
          }
          // Default
          return Promise.resolve({
            choices: [
              {
                message: {
                  content: "Mocked AI response",
                },
              },
            ],
          });
        }),
      },
    },
  };
});

export default mockOpenAI;
