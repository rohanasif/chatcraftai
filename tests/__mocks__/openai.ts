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
          if (systemContent.includes("reply suggestions")) {
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
